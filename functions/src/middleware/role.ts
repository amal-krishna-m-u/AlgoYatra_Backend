import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';

/**
 * Middleware to validate user roles
 * Must be used after validateAuth middleware
 * @param allowedRoles Array of allowed roles
 */
export function validateRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { userRole } = req.app.locals;
    
    if (!userRole) {
      res.status(401).json({ error: 'Unauthorized - Authentication required' });
      return;
    }
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      return;
    }
    
    // Role validated, continue to next middleware
    next();
  };
}