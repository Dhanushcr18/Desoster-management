import { Router } from 'express';
import { getImpactMetrics } from '../controllers/impact.controller';

const router = Router();

// GET /api/impact - Public
router.get('/', getImpactMetrics);

export default router;
