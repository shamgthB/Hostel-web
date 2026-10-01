import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, type AuthenticatedRequest } from '../auth.js';

const router = Router();

// Owner Dashboard Overview
router.get('/owner-summary', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied: Owner privileges required.' });
  }

  const rooms = db.getRooms();
  const beds = db.getBeds();
  const residents = db.getResidents().filter(r => r.status === 'active');
  const payments = db.getPayments();
  const complaints = db.getComplaints();
  const notices = db.getNotices();

  const totalRooms = rooms.length;
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  const availableBeds = beds.filter(b => b.status === 'available').length;
  const maintenanceBeds = beds.filter(b => b.status === 'maintenance').length;
  const totalResidents = residents.length;

  // Monthly collected & pending fees
  // Sum up all payments for current month / all active records
  let monthlyCollectedFees = 0;
  let pendingFees = 0;
  for (const pay of payments) {
    monthlyCollectedFees += pay.amountPaid;
    pendingFees += pay.remainingAmount;
  }

  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Recent 5 complaints with resident and room info
  const enrichedComplaints = complaints.slice(0, 5).map(c => {
    const resItem = db.getResidentById(c.residentId);
    const room = db.getRoomById(c.roomId);
    return {
      ...c,
      residentName: resItem ? resItem.fullName : 'Unknown Resident',
      roomNumber: room ? room.roomNumber : 'N/A',
    };
  });

  // Recent 5 payments
  const enrichedPayments = payments.slice(0, 5).map(p => {
    const resItem = db.getResidentById(p.residentId);
    const room = db.getRoomById(p.roomId);
    return {
      ...p,
      residentName: resItem ? resItem.fullName : 'Unknown Resident',
      roomNumber: room ? room.roomNumber : 'N/A',
    };
  });

  res.json({
    stats: {
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      totalResidents,
      monthlyCollectedFees,
      pendingFees,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      occupancyRate,
    },
    recentComplaints: enrichedComplaints,
    recentPayments: enrichedPayments,
    recentNotices: notices.slice(0, 4),
  });
});

// Resident Dashboard Overview
router.get('/resident-summary', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const resident = db.getResidentByUserId(req.user.userId);
  if (!resident) {
    return res.status(404).json({ error: 'Resident profile not found.' });
  }

  const room = db.getRoomById(resident.roomId);
  const bed = db.getBedById(resident.bedId);
  const payments = db.getPaymentsByResidentId(resident.id);
  const complaints = db.getComplaintsByResidentId(resident.id);
  const notices = db.getNotices();

  // Find roommates
  const allResidentsInRoom = db.getResidents().filter(
    r => r.roomId === resident.roomId && r.id !== resident.id && r.status === 'active'
  );

  const roommates = allResidentsInRoom.map(r => {
    const roommateBed = db.getBedById(r.bedId);
    return {
      id: r.id,
      fullName: r.fullName,
      mobileNumber: r.mobileNumber,
      bedNumber: roommateBed ? roommateBed.bedNumber : '?',
      profilePhoto: r.profilePhoto,
      joiningDate: r.joiningDate,
    };
  });

  // Calculate fee status
  let totalDue = 0;
  let totalPaid = 0;
  let remainingDue = 0;

  for (const p of payments) {
    totalDue += p.amountDue;
    totalPaid += p.amountPaid;
    remainingDue += p.remainingAmount;
  }

  // Get most recent payment record
  const latestPayment = payments[payments.length - 1] || null;

  res.json({
    resident: {
      ...resident,
      roomNumber: room ? room.roomNumber : 'N/A',
      floor: room ? room.floor : 1,
      roomType: room ? room.roomType : 'N/A',
      bedNumber: bed ? bed.bedNumber : 1,
      roomAmenities: room ? room.amenities : [],
    },
    room: room || null,
    bed: bed || null,
    payments: payments || [],
    complaints: complaints || [],
    roommates,
    feesSummary: {
      monthlyRent: resident.monthlyRent,
      securityDeposit: resident.securityDeposit,
      totalDue,
      totalPaid,
      remainingDue,
      latestPayment,
      status: remainingDue === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending',
    },
    recentComplaints: complaints.slice(0, 4),
    recentPayments: payments.slice(0, 4),
    notices: notices.slice(0, 5),
  });
});

export default router;
