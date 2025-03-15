import express from 'express';
import { validateAuth } from '../middleware/auth';
import * as admin from 'firebase-admin';

const router = express.Router();

/**
 * Google Login - Firebase Authentication should handle it on frontend
 * The frontend gets an ID Token and sends it here for verification
 */
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decodedToken.uid, email: decodedToken.email, message: 'Login successful' });
  } catch (error: any) {
    console.error('Google Login Error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
});

/**
 * Email/Password Login
 */
router.post('/email-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decodedToken.uid, email: decodedToken.email, message: 'Login successful' });
  } catch (error: any) {
    console.error('Email Login Error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
});

/**
 * Register User (Email/Password) - Handled by Firebase Authentication
 */
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    res.json({ uid: userRecord.uid, message: 'User registered successfully' });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Logout - Firebase authentication handles this client-side
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful (handled on client)' });
});

/**
 * Get Current User Profile
 */
router.get('/profile', validateAuth, async (req, res) => {
  try {
    const userId = req.app.locals.userId;
    const userRecord = await admin.auth().getUser(userId);

    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify Authentication Token
 */
router.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    res.json({ uid: decodedToken.uid, message: 'Token is valid' });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
});

export default router;
