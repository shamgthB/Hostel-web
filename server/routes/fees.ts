import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth.js';
import type { Payment, PaymentMethod, PaymentStatus } from '../types.js';

const router = Router();

// Get all payments (Owner sees all; Resident sees only theirs)
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { residentId, status, monthYear, search } = req.query;
  let payments = db.getPayments();
  const residents = db.getResidents();
  const rooms = db.getRooms();

  if (req.user?.role === 'resident') {
    const currentRes = db.getResidentByUserId(req.user.userId);
    if (!currentRes) return res.status(404).json({ error: 'Resident profile not found' });
    payments = payments.filter(p => p.residentId === currentRes.id);
  } else if (residentId && typeof residentId === 'string') {
    payments = payments.filter(p => p.residentId === residentId);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    payments = payments.filter(p => p.status === status);
  }

  if (monthYear && typeof monthYear === 'string' && monthYear !== 'all') {
    payments = payments.filter(p => p.monthYear.toLowerCase() === monthYear.toLowerCase());
  }

  let enriched = payments.map(p => {
    const resItem = residents.find(r => r.id === p.residentId);
    const room = rooms.find(r => r.id === p.roomId);
    return {
      ...p,
      residentName: resItem ? resItem.fullName : 'Vacated Resident',
      residentPhone: resItem ? resItem.mobileNumber : '',
      roomNumber: room ? room.roomNumber : 'N/A',
      floor: room ? room.floor : 0,
    };
  });

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    enriched = enriched.filter(
      p =>
        p.residentName.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.roomNumber.toLowerCase().includes(q) ||
        p.monthYear.toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(enriched);
});

// Get receipt by payment ID
router.get('/:id/receipt', authMiddleware, (req: AuthenticatedRequest, res) => {
  const payment = db.getPaymentById(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });

  const resident = db.getResidentById(payment.residentId);
  if (req.user?.role === 'resident') {
    const currentRes = db.getResidentByUserId(req.user.userId);
    if (!currentRes || currentRes.id !== payment.residentId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
  }

  const room = db.getRoomById(payment.roomId);
  const bed = resident ? db.getBedById(resident.bedId) : null;
  const owner = db.getOwnerProfile();

  res.json({
    receiptNumber: payment.receiptNumber,
    paymentDate: payment.paymentDate || new Date(payment.createdAt).toISOString().split('T')[0],
    monthYear: payment.monthYear,
    amountDue: payment.amountDue,
    amountPaid: payment.amountPaid,
    remainingAmount: payment.remainingAmount,
    status: payment.status,
    paymentMethod: payment.paymentMethod || 'Cash',
    notes: payment.notes || 'Monthly accommodation and amenities fee.',
    hostel: {
      name: owner?.hostelName || 'Hostel Management System',
      address: owner?.address || 'Hostel Campus, Student Avenue',
      phone: owner?.phone || '+1 (555) 019-2831',
      adminName: owner?.fullName || 'Hostel Warden',
    },
    resident: {
      name: resident?.fullName || 'Resident',
      phone: resident?.mobileNumber || '',
      roomNumber: room ? room.roomNumber : 'N/A',
      bedNumber: bed ? bed.bedNumber : 1,
      idNumber: resident?.idNumber || 'N/A',
    },
  });
});

// Create new fee / bill record (Owner only)
router.post('/', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const { residentId, monthYear, amountDue, amountPaid, paymentMethod, paymentDate, notes } = req.body;

  if (!residentId || !monthYear || amountDue === undefined) {
    return res.status(400).json({ error: 'Resident ID, month/year, and amount due are required.' });
  }

  const resident = db.getResidentById(residentId);
  if (!resident) return res.status(404).json({ error: 'Resident not found.' });

  const paidNum = Number(amountPaid) || 0;
  const dueNum = Number(amountDue);
  const remaining = Math.max(0, dueNum - paidNum);

  let status: PaymentStatus = 'Pending';
  if (remaining === 0 && paidNum > 0) {
    status = 'Paid';
  } else if (paidNum > 0) {
    status = 'Partial';
  }

  const receiptNum = `RCP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const newPayment: Payment = {
    id: `pay_${Date.now()}`,
    residentId: resident.id,
    roomId: resident.roomId,
    monthYear: String(monthYear).trim(),
    amountDue: dueNum,
    amountPaid: paidNum,
    remainingAmount: remaining,
    paymentDate: paidNum > 0 ? (paymentDate || new Date().toISOString().split('T')[0]) : undefined,
    paymentMethod: paidNum > 0 ? (paymentMethod as PaymentMethod || 'Cash') : undefined,
    status,
    receiptNumber: receiptNum,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createPayment(newPayment);
  res.status(201).json(newPayment);
});

// Update payment record / mark as paid or partial (Owner only)
router.put('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const payment = db.getPaymentById(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found.' });

  const { amountPaid, paymentMethod, paymentDate, notes, status: inputStatus } = req.body;

  let paidNum = payment.amountPaid;
  if (amountPaid !== undefined) {
    paidNum = Number(amountPaid);
  }

  let remaining = Math.max(0, payment.amountDue - paidNum);

  let status: PaymentStatus = payment.status;
  if (inputStatus && ['Paid', 'Pending', 'Partial'].includes(inputStatus)) {
    status = inputStatus as PaymentStatus;
    if (status === 'Paid') {
      paidNum = payment.amountDue;
      remaining = 0;
    } else if (status === 'Pending') {
      paidNum = 0;
      remaining = payment.amountDue;
    }
  } else {
    if (remaining === 0 && paidNum > 0) {
      status = 'Paid';
    } else if (paidNum > 0) {
      status = 'Partial';
    } else {
      status = 'Pending';
    }
  }

  const updated = db.updatePayment(payment.id, {
    amountPaid: paidNum,
    remainingAmount: remaining,
    paymentMethod: paymentMethod || payment.paymentMethod || 'Cash',
    paymentDate: paymentDate || (paidNum > 0 ? new Date().toISOString().split('T')[0] : undefined),
    status,
    notes: notes !== undefined ? notes : payment.notes,
  });

  res.json(updated);
});

// Delete payment record (Owner only)
router.delete('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const success = db.deletePayment(req.params.id);
  if (!success) return res.status(404).json({ error: 'Payment not found.' });
  res.json({ message: 'Payment record deleted.' });
});

export default router;
