import express from 'express';
import { ChallengeService } from '../services/challenge.service';
import { ChallengeFilters, ChallengeDifficulty } from '../models/challenge.model';
import { validateAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
const router = express.Router();
const challengeService = new ChallengeService();

/**
 * @route POST /challenges
 * @desc Create a new challenge
 */
router.post('/', validateAuth, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' }); // ✅ Ensure req.user exists
        }
        const challenge = await challengeService.createChallenge(req.body, req.user.id);
        return res.status(201).json(challenge);  // ✅ Ensure return statement
    } catch (error) {
        console.error('Error creating challenge:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /challenges/:id
 * @desc Get challenge by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const challenge = await challengeService.getChallengeById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(challenge);
    } catch (error) {
        console.error('Error fetching challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /challenges
 * @desc Get challenges with filters
 */
router.get('/', async (req, res) => {
    try {
        const filters: Partial<ChallengeFilters> = {};
        if (req.query.difficulty) {
            filters.difficulty = ChallengeDifficulty[req.query.difficulty as keyof typeof ChallengeDifficulty];
        }

        const challenges = await challengeService.getChallenges(filters);
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route PUT /challenges/:id
 * @desc Update a challenge
 */
router.put('/:id', validateAuth, async (req, res) => {
    try {
        const updatedChallenge = await challengeService.updateChallenge(req.params.id, req.body);
        if (!updatedChallenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(updatedChallenge);
    } catch (error) {
        console.error('Error updating challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route DELETE /challenges/:id
 * @desc Delete a challenge
 */
router.delete('/:id', validateAuth, async (req, res) => {
    try {
        await challengeService.deleteChallenge(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /challenges/recent
 * @desc Get recent challenges
 */
router.get('/recent', async (req, res) => {
    try {
        const challenges = await challengeService.getChallenges({}, 10);
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching recent challenges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /challenges/top
 * @desc Get top challenges
 */
router.get('/top', async (req, res) => {
    try {
        const challenges = await challengeService.getChallenges({}, 10);
        res.json(challenges);
    } catch (error) {
        console.error('Error fetching top challenges:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
