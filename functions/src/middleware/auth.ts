import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { UserService } from '../services/user.service';

/**
 * Middleware to validate Firebase authentication token
 * Sets userId in req.app.locals if valid
 */
export async function validateAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized - No valid authentication token provided' });
    return;
  }
  
  // Extract the token
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token with Firebase Auth
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user ID to request for later use
    req.app.locals.userId = decodedToken.uid;
    
    // Get user role from database
    const userService = new UserService();
    const user = await userService.getUserById(decodedToken.uid);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Add user role to request for later use
    req.app.locals.userRole = user.role;
    
    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Error validating authentication token:', error);
    res.status(401).json({ error: 'Unauthorized - Invalid authentication token' });
  }
}