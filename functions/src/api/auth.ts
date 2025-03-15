import express from 'express';
import { validateAuth } from '../middleware/auth';
import * as admin from 'firebase-admin';

const router = express.Router();

/**
 * Google Login – The frontend sends an ID Token for verification
 */
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return res.json({ uid: decodedToken.uid, email: decodedToken.email, message: 'Login successful' });
  } catch (error: any) {
    console.error('Google Login Error:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});

/**
 * Email/Password Login – The frontend sends an ID Token for verification
 */
router.post('/email-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return res.json({ uid: decodedToken.uid, email: decodedToken.email, message: 'Login successful' });
  } catch (error: any) {
    console.error('Email Login Error:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});

/**
 * Register User (Email/Password) – Handled by Firebase Authentication
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
    return res.json({ uid: userRecord.uid, message: 'User registered successfully' });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Logout – Handled on the client side
 */
router.post('/logout', (req, res) => {
  return res.json({ message: 'Logout successful (handled on client)' });
});

/**
 * Get Current User Profile – Requires authentication
 */
router.get('/profile', validateAuth, async (req, res) => {
  try {
    // Using req.app.locals.user or similar approach if your validateAuth sets it.
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userRecord = await admin.auth().getUser(userId);
    return res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Verify Authentication Token – Checks token validity
 */
router.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'ID Token is required' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return res.json({ uid: decodedToken.uid, message: 'Token is valid' });
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});

export default router;
