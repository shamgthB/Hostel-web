import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth.js';
import type { Complaint, ComplaintImage, ComplaintStatus, ComplaintPriority } from '../types.js';

const router = Router();

// Get complaints (Owner sees all; Resident sees their own)
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { status, priority, category, search } = req.query;
  let complaints = db.getComplaints();
  const residents = db.getResidents();
  const rooms = db.getRooms();

  if (req.user?.role === 'resident') {
    const currentRes = db.getResidentByUserId(req.user.userId);
    if (!currentRes) return res.status(404).json({ error: 'Resident profile not found.' });
    complaints = complaints.filter(c => c.residentId === currentRes.id);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    complaints = complaints.filter(c => c.status === status);
  }

  if (priority && typeof priority === 'string' && priority !== 'all') {
    complaints = complaints.filter(c => c.priority === priority);
  }

  if (category && typeof category === 'string' && category !== 'all') {
    complaints = complaints.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  let enriched = complaints.map(c => {
    const resident = residents.find(r => r.id === c.residentId);
    const room = rooms.find(r => r.id === c.roomId);
    return {
      ...c,
      residentName: resident ? resident.fullName : 'Former Resident',
      residentPhone: resident ? resident.mobileNumber : '',
      roomNumber: room ? room.roomNumber : 'N/A',
      floor: room ? room.floor : 0,
    };
  });

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    enriched = enriched.filter(
      c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.residentName.toLowerCase().includes(q) ||
        c.roomNumber.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  res.json(enriched);
});

// Get single complaint details
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const complaint = db.getComplaintById(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  if (req.user?.role === 'resident') {
    const currentRes = db.getResidentByUserId(req.user.userId);
    if (!currentRes || currentRes.id !== complaint.residentId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
  }

  const resident = db.getResidentById(complaint.residentId);
  const room = db.getRoomById(complaint.roomId);

  res.json({
    ...complaint,
    residentName: resident ? resident.fullName : 'Resident',
    roomNumber: room ? room.roomNumber : 'N/A',
  });
});

// Create new complaint (Resident or Owner on behalf of resident)
router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { title, description, category, priority, images } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  let residentId = req.body.residentId;
  let roomId = req.body.roomId;

  if (req.user?.role === 'resident') {
    const currentRes = db.getResidentByUserId(req.user.userId);
    if (!currentRes) return res.status(404).json({ error: 'Resident profile not found.' });
    residentId = currentRes.id;
    roomId = currentRes.roomId;
  } else {
    if (!residentId || !roomId) {
      return res.status(400).json({ error: 'Resident ID and Room ID are required.' });
    }
  }

  const complaintId = `cmp_${Date.now()}`;
  const complaintImages: ComplaintImage[] = [];

  if (Array.isArray(images)) {
    images.forEach((img: any, idx: number) => {
      if (typeof img === 'string' && img.length > 0) {
        complaintImages.push({
          id: `img_${complaintId}_${idx}`,
          complaintId,
          imageUrl: img,
          fileName: `attachment_${idx + 1}.jpg`,
          createdAt: new Date().toISOString(),
        });
      } else if (img && img.imageUrl) {
        complaintImages.push({
          id: `img_${complaintId}_${idx}`,
          complaintId,
          imageUrl: img.imageUrl,
          fileName: img.fileName || `attachment_${idx + 1}.jpg`,
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  const newComplaint: Complaint = {
    id: complaintId,
    residentId,
    roomId,
    title: title.trim(),
    description: description.trim(),
    category: category || 'General',
    priority: (priority as ComplaintPriority) || 'Medium',
    status: 'Pending',
    images: complaintImages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createComplaint(newComplaint);

  const resident = db.getResidentById(newComplaint.residentId);
  const room = db.getRoomById(newComplaint.roomId);

  res.status(201).json({
    ...newComplaint,
    residentName: resident ? resident.fullName : 'Resident',
    roomNumber: room ? room.roomNumber : 'N/A',
  });
});

// Update complaint status & owner response (Owner only)
router.put('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const complaint = db.getComplaintById(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  const { status, ownerResponse, priority } = req.body;

  const updates: Partial<Complaint> = {};
  if (status && ['Pending', 'In Progress', 'Resolved'].includes(status)) {
    updates.status = status as ComplaintStatus;
  }
  if (priority && ['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
    updates.priority = priority as ComplaintPriority;
  }
  if (ownerResponse !== undefined) {
    updates.ownerResponse = ownerResponse;
    updates.responseDate = new Date().toISOString();
  }

  const updated = db.updateComplaint(complaint.id, updates);

  const resident = db.getResidentById(complaint.residentId);
  const room = db.getRoomById(complaint.roomId);

  res.json({
    ...updated,
    residentName: resident ? resident.fullName : 'Resident',
    roomNumber: room ? room.roomNumber : 'N/A',
  });
});

// Delete complaint (Owner only)
router.delete('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteComplaint(req.params.id);
  if (!success) return res.status(404).json({ error: 'Complaint not found.' });
  res.json({ message: 'Complaint deleted.' });
});

export default router;
