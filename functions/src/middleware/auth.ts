import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { AuthenticatedRequest } from '../types';

export const validateAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = { id: decodedToken.uid, role: 'user' }; // You might fetch the role from the database

        (req as AuthenticatedRequest).user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid token' });
    }
};
