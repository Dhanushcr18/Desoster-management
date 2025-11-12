import { Router } from 'express';
import {
  getAlerts,
  getAlertById,
  createAlert,
  deleteAlert,
  getAlertLocationReports,
  createAlertValidation,
  getAlertsValidation
} from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/alerts - Get all alerts (with optional filters)
router.get('/', authenticate, getAlertsValidation, getAlerts);

// GET /api/alerts/:id - Get single alert by ID
router.get('/:id', authenticate, getAlertById);

// GET /api/alerts/:id/location-reports - Get location reports for an alert
router.get('/:id/location-reports', authenticate, getAlertLocationReports);

// POST /api/alerts - Create new alert (protected)
router.post('/', authenticate, createAlertValidation, createAlert);

// DELETE /api/alerts/:id - Delete alert (admin function)
router.delete('/:id', authenticate, deleteAlert);

export default router;
