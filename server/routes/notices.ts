import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, type AuthenticatedRequest } from '../auth.js';
import type { Notice, NoticePriority } from '../types.js';

const router = Router();

// Get all notices
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const notices = db.getNotices();
  res.json(notices);
});

// Create notice (Owner only)
router.post('/', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const { title, content, targetAudience, priority, isPinned } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const owner = db.getOwnerProfile();
  const authorName = owner?.fullName ? `${owner.fullName} (Hostel Office)` : 'Hostel Management';

  const newNotice: Notice = {
    id: `not_${Date.now()}`,
    title: title.trim(),
    content: content.trim(),
    targetAudience: targetAudience || 'all',
    priority: (priority as NoticePriority) || 'normal',
    isPinned: Boolean(isPinned),
    authorName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createNotice(newNotice);
  res.status(201).json(newNotice);
});

// Update notice (Owner only)
router.put('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const notice = db.getNoticeById(req.params.id);
  if (!notice) return res.status(404).json({ error: 'Notice not found.' });

  const { title, content, targetAudience, priority, isPinned } = req.body;

  const updated = db.updateNotice(notice.id, {
    ...(title ? { title: title.trim() } : {}),
    ...(content ? { content: content.trim() } : {}),
    ...(targetAudience ? { targetAudience } : {}),
    ...(priority ? { priority: priority as NoticePriority } : {}),
    ...(isPinned !== undefined ? { isPinned: Boolean(isPinned) } : {}),
  });

  res.json(updated);
});

// Delete notice (Owner only)
router.delete('/:id', authMiddleware, requireRole(['owner']), (req: AuthenticatedRequest, res) => {
  const success = db.deleteNotice(req.params.id);
  if (!success) return res.status(404).json({ error: 'Notice not found.' });
  res.json({ message: 'Notice deleted.' });
});

export default router;
