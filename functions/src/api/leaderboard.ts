import express from 'express';
import { LeaderboardService } from '../services/leaderboard.service';


const router = express.Router();
const leaderboardService = new LeaderboardService();

/**
 * @route GET /leaderboard/overall
 * @desc Get overall leaderboard
 */
router.get('/overall', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const leaderboard = await leaderboardService.getOverallLeaderboard(limit);
        return res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching overall leaderboard:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /leaderboard/weekly
 * @desc Get weekly leaderboard
 */
router.get('/weekly', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const leaderboard = await leaderboardService.getWeeklyLeaderboard(limit);
        return res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching weekly leaderboard:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /leaderboard/monthly
 * @desc Get monthly leaderboard
 */
router.get('/monthly', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const leaderboard = await leaderboardService.getMonthlyLeaderboard(limit);
        return res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching monthly leaderboard:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /leaderboard/challenge/:challengeId
 * @desc Get leaderboard for a specific challenge
 */
router.get('/challenge/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        
        if (!challengeId) {
            return res.status(400).json({ error: 'Challenge ID is required' });
        }

        const leaderboard = await leaderboardService.getChallengeLeaderboard(challengeId, limit);
        return res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching challenge leaderboard:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
