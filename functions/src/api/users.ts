import { Router } from 'express';
import { UserService } from '../services/user.service';
import { UserRole, UserFilters, UserPreferences } from '../models/user.model';
import * as admin from 'firebase-admin';

const router = Router();
const userService = new UserService();

/**
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Get user by email
 */
router.get('/email/:email', async (req, res) => {
  try {
    const user = await userService.getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Get users with filters
 */
router.get('/', async (req, res) => {
  try {
    const filters: UserFilters = req.query;
    const limit = parseInt(req.query.limit as string) || 50;
    const users = await userService.getUsers(filters, limit);
    return res.json(users);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    return res.status(201).json(user);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Update user details
 */
router.put('/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Update user role
 */
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await userService.updateUserRole(req.params.id, role);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Get top users
 */
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await userService.getTopUsers(limit);
    return res.json(users);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Search users
 */
router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 50;
    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    const users = await userService.searchUsers(searchTerm, limit);
    return res.json(users);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Get user statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await userService.getUserStats();
    return res.json(stats);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Get recently joined users
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await userService.getRecentUsers(limit);
    return res.json(users);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Get active users in a time period
 */
router.get('/active', async (req, res) => {
  try {
    const startDate = req.query.startDate ? admin.firestore.Timestamp.fromDate(new Date(req.query.startDate as string)) : null;
    const endDate = req.query.endDate ? admin.firestore.Timestamp.fromDate(new Date(req.query.endDate as string)) : null;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const users = await userService.getActiveUsers(startDate, endDate, limit);
    return res.json(users);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

/**
 * Update user preferences
 */
router.put('/:id/preferences', async (req, res) => {
  try {
    const user = await userService.updateUserPreferences(req.params.id, req.body as Partial<UserPreferences>);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({ message: error.message });
  }
});

export default router;
