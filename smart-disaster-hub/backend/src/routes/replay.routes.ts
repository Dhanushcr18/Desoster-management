import { Router } from 'express';
import {
  handleStartReplay,
  handlePauseReplay,
  handleStopReplay,
  handleGetReplayStatus,
  handleGetComparison,
} from '../controllers/replay.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/replay/start - Admin / Authenticated
router.post('/start', authenticate, handleStartReplay);

// POST /api/replay/pause - Admin / Authenticated
router.post('/pause', authenticate, handlePauseReplay);

// POST /api/replay/stop - Admin / Authenticated
router.post('/stop', authenticate, handleStopReplay);

// GET /api/replay/status - Public
router.get('/status', handleGetReplayStatus);

// GET /api/replay/comparison - Public
router.get('/comparison', handleGetComparison);

export default router;
