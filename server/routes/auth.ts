import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  authMiddleware,
  type AuthenticatedRequest,
} from '../auth.js';
import type { User, OwnerProfile } from '../types.js';

const router = Router();

// Login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }

  const user =
    db.findUserByEmail(identifier.trim()) || db.findUserByUsername(identifier.trim());

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
  }

  const token = generateToken(user);
  let profile = null;
  let residentInfo = null;

  if (user.role === 'owner') {
    profile = db.getOwnerProfile();
  } else {
    residentInfo = db.getResidentByUserId(user.id);
  }

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    profile,
    residentInfo,
  });
});

// Register / Create Owner Account (if no owners exist or first setup)
router.post('/register-owner', (req, res) => {
  const { username, email, password, fullName, phone, hostelName, address } = req.body;

  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ error: 'Username, email, password, and full name are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (db.findUserByEmail(email) || db.findUserByUsername(username)) {
    return res.status(400).json({ error: 'A user with this email or username already exists.' });
  }

  const { salt, hash } = hashPassword(password);
  const newUser: User = {
    id: `usr_own_${Date.now()}`,
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    role: 'owner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  const ownerProfile: OwnerProfile = {
    id: `own_${Date.now()}`,
    userId: newUser.id,
    fullName: fullName.trim(),
    phone: phone || '',
    hostelName: hostelName || 'City Central Hostel',
    address: address || '',
    createdAt: new Date().toISOString(),
  };

  db.updateOwnerProfile(ownerProfile);

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    },
    profile: ownerProfile,
  });
});

// Current User Profile
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.findUserById(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let profile = null;
  let residentInfo = null;

  if (user.role === 'owner') {
    profile = db.getOwnerProfile();
  } else {
    residentInfo = db.getResidentByUserId(user.id);
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    profile,
    residentInfo,
  });
});

// Reset demo database
router.post('/reset-demo', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only owners can reset database to default demo.' });
  }
  db.resetToSeed();
  res.json({ message: 'Hostel database has been successfully reset to initial demo state.' });
});

export default router;
