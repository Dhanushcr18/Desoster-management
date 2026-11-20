import { Router } from 'express';
import { triggerAgentRun, getDecisions, getStatus } from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/agent/run - Admin / Authenticated trigger
router.post('/run', authenticate, triggerAgentRun);

// GET /api/agent/decisions - Public
router.get('/decisions', getDecisions);

// GET /api/agent/status - Public
router.get('/status', getStatus);

export default router;
