import express from 'express';
import { ChallengeService } from '../services/challenge.service';
import { ChallengeFilters, ChallengeDifficulty } from '../models/challenge.model';
import { validateAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();
const challengeService = new ChallengeService();

/**
 * Create a new challenge – Requires authentication
 */
router.post('/', validateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const challenge = await challengeService.createChallenge(req.body, req.user.id);
    return res.status(201).json(challenge);
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get challenge by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const challenge = await challengeService.getChallengeById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    return res.json(challenge);
  } catch (error: any) {
    console.error('Error fetching challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get challenges with filters
 */
router.get('/', async (req, res) => {
  try {
    const filters: Partial<ChallengeFilters> = {};
    if (req.query.difficulty) {
      filters.difficulty = ChallengeDifficulty[req.query.difficulty as keyof typeof ChallengeDifficulty];
    }
    const challenges = await challengeService.getChallenges(filters);
    return res.json(challenges);
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a challenge – Requires authentication
 */
router.put('/:id', validateAuth, async (req, res) => {
  try {
    const updatedChallenge = await challengeService.updateChallenge(req.params.id, req.body);
    if (!updatedChallenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    return res.json(updatedChallenge);
  } catch (error: any) {
    console.error('Error updating challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a challenge – Requires authentication
 */
router.delete('/:id', validateAuth, async (req, res) => {
  try {
    await challengeService.deleteChallenge(req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get recent challenges
 */
router.get('/recent', async (req, res) => {
  try {
    const challenges = await challengeService.getChallenges({}, 10);
    return res.json(challenges);
  } catch (error: any) {
    console.error('Error fetching recent challenges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get top challenges
 */
router.get('/top', async (req, res) => {
  try {
    const challenges = await challengeService.getChallenges({}, 10);
    return res.json(challenges);
  } catch (error: any) {
    console.error('Error fetching top challenges:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
