import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, hashPassword, type AuthenticatedRequest } from '../auth.js';
import type { Resident, User, ResidentStatus } from '../types.js';

const router = Router();

// List all residents (Owner only, or filtered view)
router.get('/', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const { search, status, roomId } = req.query;
  let residents = db.getResidents();
  const rooms = db.getRooms();
  const beds = db.getBeds();

  if (status && typeof status === 'string' && status !== 'all') {
    residents = residents.filter(r => r.status === status);
  }

  if (roomId && typeof roomId === 'string') {
    residents = residents.filter(r => r.roomId === roomId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    residents = residents.filter(
      r =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.mobileNumber.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
    );
  }

  const enriched = residents.map(resItem => {
    const room = rooms.find(r => r.id === resItem.roomId);
    const bed = beds.find(b => b.id === resItem.bedId);
    const payments = db.getPaymentsByResidentId(resItem.id);
    const totalPending = payments.reduce((acc, p) => acc + p.remainingAmount, 0);

    return {
      ...resItem,
      roomNumber: room ? room.roomNumber : 'N/A',
      floor: room ? room.floor : 0,
      roomType: room ? room.roomType : 'N/A',
      bedNumber: bed ? bed.bedNumber : 0,
      totalPending,
    };
  });

  res.json(enriched);
});

// Get resident by ID
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const resident = db.getResidentById(req.params.id);
  if (!resident) return res.status(404).json({ error: 'Resident not found.' });

  // If role is resident, only allow viewing own profile
  if (req.user?.role === 'resident') {
    const currentRes = db.getResidentByUserId(req.user.userId);
    if (!currentRes || currentRes.id !== resident.id) {
      return res.status(403).json({ error: 'Access denied: You can only view your own profile.' });
    }
  }

  const room = db.getRoomById(resident.roomId);
  const bed = db.getBedById(resident.bedId);
  const payments = db.getPaymentsByResidentId(resident.id);
  const complaints = db.getComplaintsByResidentId(resident.id);

  res.json({
    ...resident,
    room,
    bed,
    payments,
    complaints,
  });
});

// Add a new resident (Owner only)
router.post('/', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const {
    fullName,
    email,
    mobileNumber,
    emergencyContact,
    permanentAddress,
    city,
    idType,
    idNumber,
    joiningDate,
    roomId,
    bedId,
    monthlyRent,
    securityDeposit,
    profilePhoto,
    notes,
    password, // optional, default is resident123
  } = req.body;

  if (!fullName || !email || !mobileNumber || !roomId || !bedId) {
    return res.status(400).json({ error: 'Full name, email, mobile, room, and bed are required.' });
  }

  // Check if email already used by a user
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: `A user with email ${email} already exists.` });
  }

  // Check room and bed availability
  const room = db.getRoomById(roomId);
  if (!room) return res.status(404).json({ error: 'Selected room not found.' });

  const bed = db.getBedById(bedId);
  if (!bed) return res.status(404).json({ error: 'Selected bed not found.' });

  if (bed.status === 'occupied') {
    return res.status(400).json({ error: `Bed ${bed.bedNumber} in Room ${room.roomNumber} is already occupied.` });
  }

  // Create User account for this resident
  const residentPassword = password || 'resident123';
  const { salt, hash } = hashPassword(residentPassword);

  const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') + '_' + Math.floor(Math.random() * 1000);
  const newUser: User = {
    id: `usr_res_${Date.now()}`,
    username,
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    role: 'resident',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  const newResident: Resident = {
    id: `res_${Date.now()}`,
    userId: newUser.id,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    mobileNumber: mobileNumber.trim(),
    emergencyContact: emergencyContact || '',
    permanentAddress: permanentAddress || '',
    city: city || '',
    idType: idType || 'National ID',
    idNumber: idNumber || '',
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    roomId,
    bedId,
    monthlyRent: Number(monthlyRent) || room.monthlyRent,
    securityDeposit: Number(securityDeposit) || 0,
    status: 'active',
    profilePhoto: profilePhoto || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createResident(newResident);

  // Auto-generate the first month rent payment entry
  const currentDate = new Date();
  const currentMonthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const payment: any = {
    id: `pay_${Date.now()}`,
    residentId: newResident.id,
    roomId: newResident.roomId,
    monthYear: currentMonthYear,
    amountDue: newResident.monthlyRent,
    amountPaid: 0,
    remainingAmount: newResident.monthlyRent,
    status: 'Pending',
    receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
    notes: 'Initial monthly rent on registration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.createPayment(payment);

  res.status(201).json({
    resident: newResident,
    generatedCredentials: {
      email: newUser.email,
      temporaryPassword: residentPassword,
      username: newUser.username,
    },
  });
});

// Update resident (Owner only)
router.put('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const resident = db.getResidentById(req.params.id);
  if (!resident) return res.status(404).json({ error: 'Resident not found.' });

  const {
    fullName,
    mobileNumber,
    emergencyContact,
    permanentAddress,
    city,
    idType,
    idNumber,
    joiningDate,
    roomId,
    bedId,
    monthlyRent,
    securityDeposit,
    status,
    profilePhoto,
    notes,
  } = req.body;

  // Validate bed change if requested
  if (bedId && bedId !== resident.bedId) {
    const targetBed = db.getBedById(bedId);
    if (!targetBed) return res.status(400).json({ error: 'Target bed not found.' });
    if (targetBed.status === 'occupied' && targetBed.residentId !== resident.id) {
      return res.status(400).json({ error: 'Target bed is already occupied.' });
    }
  }

  const updated = db.updateResident(resident.id, {
    ...(fullName ? { fullName: fullName.trim() } : {}),
    ...(mobileNumber ? { mobileNumber: mobileNumber.trim() } : {}),
    ...(emergencyContact !== undefined ? { emergencyContact } : {}),
    ...(permanentAddress !== undefined ? { permanentAddress } : {}),
    ...(city !== undefined ? { city } : {}),
    ...(idType !== undefined ? { idType } : {}),
    ...(idNumber !== undefined ? { idNumber } : {}),
    ...(joiningDate ? { joiningDate } : {}),
    ...(roomId ? { roomId } : {}),
    ...(bedId ? { bedId } : {}),
    ...(monthlyRent !== undefined ? { monthlyRent: Number(monthlyRent) } : {}),
    ...(securityDeposit !== undefined ? { securityDeposit: Number(securityDeposit) } : {}),
    ...(status ? { status: status as ResidentStatus } : {}),
    ...(profilePhoto !== undefined ? { profilePhoto } : {}),
    ...(notes !== undefined ? { notes } : {}),
  });

  res.json(updated);
});

// Remove resident (Mark as left / inactive)
router.delete('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const resident = db.getResidentById(req.params.id);
  if (!resident) return res.status(404).json({ error: 'Resident not found.' });

  const hard = req.query.hard === 'true';
  if (hard) {
    db.hardDeleteResident(req.params.id);
    return res.json({ message: 'Resident record deleted permanently.' });
  }

  db.removeResident(req.params.id);
  res.json({ message: 'Resident marked as vacated and bed released to available status.' });
});

export default router;
