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
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.get('/all', getAllRoads);
router.get('/affected', getAffectedRoads);
router.get('/alternate', getAlternateRoutes);

// Protected endpoints (require authentication)
router.post('/report-affected', authenticate, reportAffectedRoad);
router.post('/report-alternate', authenticate, reportAlternateRoute);
router.put('/:id', authenticate, updateRoadStatus);
router.delete('/:id', authenticate, deleteRoad);

export default router;
