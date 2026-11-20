import { Router } from 'express';
import { getRoadRisks, assessAllRoadRisks, assessSingleRoadRisk } from '../controllers/risk.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/risk/roads - Public
router.get('/roads', getRoadRisks);

// POST /api/risk/assess - Admin / Authenticated
router.post('/assess', authenticate, assessAllRoadRisks);

// POST /api/risk/assess/:id - Admin / Authenticated
router.post('/assess/:id', authenticate, assessSingleRoadRisk);

export default router;
