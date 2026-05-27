import { Router } from 'express';
import {
  getAllRoads,
  getAffectedRoads,
  getAlternateRoutes,
  reportAffectedRoad,
  reportAlternateRoute,
  updateRoadStatus,
  deleteRoad,
} from '../controllers/road.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.get('/all', getAllRoads);
router.get('/affected', getAffectedRoads);
router.get('/alternate', getAlternateRoutes);

// Protected endpoints (require authentication)
router.post('/report-affected', authMiddleware, reportAffectedRoad);
router.post('/report-alternate', authMiddleware, reportAlternateRoute);
router.put('/:id', authMiddleware, updateRoadStatus);
router.delete('/:id', authMiddleware, deleteRoad);

export default router;
