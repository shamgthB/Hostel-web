import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth.js';
import type { Room, RoomType } from '../types.js';

const router = Router();

// Get all rooms (Owners see full details, residents can see basic list for transfer or info)
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const rooms = db.getRooms();
  const beds = db.getBeds();
  const residents = db.getResidents().filter(r => r.status === 'active');

  const enrichedRooms = rooms.map(room => {
    const roomBeds = beds.filter(b => b.roomId === room.id).map(b => {
      const resident = b.residentId ? residents.find(r => r.id === b.residentId) : null;
      return {
        ...b,
        resident: resident
          ? {
              id: resident.id,
              fullName: resident.fullName,
              mobileNumber: resident.mobileNumber,
              profilePhoto: resident.profilePhoto,
            }
          : null,
      };
    });

    const occupiedBedsCount = roomBeds.filter(b => b.status === 'occupied').length;
    const availableBedsCount = roomBeds.filter(b => b.status === 'available').length;

    return {
      ...room,
      beds: roomBeds,
      occupiedBeds: occupiedBedsCount,
      availableBeds: availableBedsCount,
    };
  });

  res.json(enrichedRooms);
});

// Get single room details
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const room = db.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const beds = db.getBedsByRoomId(room.id);
  const residents = db.getResidents().filter(r => r.roomId === room.id && r.status === 'active');

  res.json({
    ...room,
    beds: beds.map(b => ({
      ...b,
      resident: residents.find(r => r.id === b.residentId) || null,
    })),
    residents,
  });
});

// Create a new room (Owner only)
router.post('/', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const { roomNumber, floor, roomType, totalBeds, monthlyRent, amenities, notes } = req.body;

  if (!roomNumber || floor === undefined || !roomType || !totalBeds || monthlyRent === undefined) {
    return res.status(400).json({ error: 'Please provide roomNumber, floor, roomType, totalBeds, and monthlyRent.' });
  }

  const existing = db.getRoomByNumber(roomNumber);
  if (existing) {
    return res.status(400).json({ error: `Room ${roomNumber} already exists.` });
  }

  const newRoom: Room = {
    id: `rm_${Date.now()}`,
    roomNumber: String(roomNumber).trim(),
    floor: Number(floor),
    roomType: roomType as RoomType,
    totalBeds: Number(totalBeds),
    monthlyRent: Number(monthlyRent),
    amenities: Array.isArray(amenities) ? amenities : ['Wi-Fi'],
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createRoom(newRoom);
  res.status(201).json(newRoom);
});

// Update room details (Owner only)
router.put('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const { roomNumber, floor, roomType, totalBeds, monthlyRent, amenities, notes } = req.body;
  const room = db.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  if (roomNumber && roomNumber !== room.roomNumber) {
    const existing = db.getRoomByNumber(roomNumber);
    if (existing && existing.id !== room.id) {
      return res.status(400).json({ error: `Room ${roomNumber} already exists.` });
    }
  }

  // Validate bed reduction
  if (totalBeds !== undefined && Number(totalBeds) < room.totalBeds) {
    const occupiedCount = db.getBedsByRoomId(room.id).filter(b => b.status === 'occupied').length;
    if (Number(totalBeds) < occupiedCount) {
      return res.status(400).json({
        error: `Cannot reduce total beds to ${totalBeds}. Currently ${occupiedCount} beds are occupied.`,
      });
    }
  }

  const updated = db.updateRoom(req.params.id, {
    ...(roomNumber ? { roomNumber: String(roomNumber).trim() } : {}),
    ...(floor !== undefined ? { floor: Number(floor) } : {}),
    ...(roomType ? { roomType: roomType as RoomType } : {}),
    ...(totalBeds !== undefined ? { totalBeds: Number(totalBeds) } : {}),
    ...(monthlyRent !== undefined ? { monthlyRent: Number(monthlyRent) } : {}),
    ...(amenities ? { amenities: Array.isArray(amenities) ? amenities : [] } : {}),
    ...(notes !== undefined ? { notes } : {}),
  });

  res.json(updated);
});

// Delete room (Owner only)
router.delete('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  try {
    const success = db.deleteRoom(req.params.id);
    if (!success) return res.status(404).json({ error: 'Room not found.' });
    res.json({ message: 'Room deleted successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete room.' });
  }
});

// Transfer a resident to another room/bed (Owner only)
router.post('/transfer-resident', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const { residentId, targetRoomId, targetBedId } = req.body;

  if (!residentId || !targetRoomId || !targetBedId) {
    return res.status(400).json({ error: 'Resident ID, target room ID, and target bed ID are required.' });
  }

  const resident = db.getResidentById(residentId);
  if (!resident) return res.status(404).json({ error: 'Resident not found.' });

  const targetRoom = db.getRoomById(targetRoomId);
  if (!targetRoom) return res.status(404).json({ error: 'Target room not found.' });

  const targetBed = db.getBedById(targetBedId);
  if (!targetBed) return res.status(404).json({ error: 'Target bed not found.' });

  if (targetBed.status === 'occupied' && targetBed.residentId !== resident.id) {
    return res.status(400).json({ error: `Bed ${targetBed.bedNumber} in Room ${targetRoom.roomNumber} is already occupied.` });
  }

  // Perform transfer
  db.updateResident(resident.id, {
    roomId: targetRoom.id,
    bedId: targetBed.id,
    monthlyRent: targetRoom.monthlyRent,
  });

  res.json({
    message: `Resident ${resident.fullName} successfully transferred to Room ${targetRoom.roomNumber}, Bed ${targetBed.bedNumber}.`,
    resident: db.getResidentById(resident.id),
  });
});

export default router;
