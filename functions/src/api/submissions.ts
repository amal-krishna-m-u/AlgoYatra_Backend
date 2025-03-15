import * as express from 'express';
import { SubmissionService } from '../services/submission.service';
import { SubmissionStatus } from '../models/submission.model';
import { validateAuth } from '../middleware/auth';
import { validateRole } from '../middleware/role';
import { UserRole } from '../models/user.model';

const router = express.Router();
const submissionService = new SubmissionService();

/**
 * Submit a solution for a challenge
 * @route POST /submissions/
 * @access Authenticated Users
 */
router.post('/', validateAuth, async (req, res) => {
  try {
    const { challengeId, repositoryUrl, language } = req.body;
    const userId = (req as any).user.id; // Extract user ID from request

    if (!challengeId || !repositoryUrl || !language) {
      return res.status(400).json({ error: 'Missing required fields: challengeId, code, language' });
    }

    const submission = await submissionService.submitSolution({ challengeId, userId, repositoryUrl,language });
    return res.status(201).json(submission);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get submission by ID
 * @route GET /submissions/:id
 * @access Authenticated Users
 */
router.get('/:id', validateAuth, async (req, res) => {
  try {
    const submission = await submissionService.getSubmissionById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json(submission);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get all submissions (Admin only)
 * @route GET /submissions/
 * @access Admin only
 */
router.get('/', validateAuth, validateRole([UserRole.ADMIN]), async (req, res) => {
  try {
    const { challengeId, userId, status, limit } = req.query;
    const filters: Record<string, string> = {};

    if (challengeId) filters.challengeId = challengeId as string;
    if (userId) filters.userId = userId as string;
    if (status) filters.status = status as string;

    const submissions = await submissionService.getSubmissions(filters, Number(limit) || 50);
    return res.json(submissions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Review a submission (Approve/Reject) - Admin only
 * @route PUT /submissions/:id/review
 * @access Admin only
 */
router.put('/:id/review', validateAuth, validateRole([UserRole.ADMIN]), async (req, res) => {
  try {
    const { status, feedback, reviewerId } = req.body;

    if (!reviewerId) {
      return res.status(400).json({ error: 'Reviewer ID is required' });
    }

    if (![SubmissionStatus.APPROVED, SubmissionStatus.REJECTED].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedSubmission = await submissionService.reviewSubmission(
      req.params.id,
      status,
      feedback,
      reviewerId
    );

    return res.json(updatedSubmission);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get submission statistics (Admin only)
 * @route GET /submissions/stats
 * @access Admin only
 */
router.get('/stats', validateAuth, validateRole([UserRole.ADMIN]), async (req, res) => {
  try {
    const stats = await submissionService.getSubmissionStats();
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
