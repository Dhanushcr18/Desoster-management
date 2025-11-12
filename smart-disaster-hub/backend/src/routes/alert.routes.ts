import { Router } from 'express';
import {
  getAlerts,
  getAlertById,
  createAlert,
  deleteAlert,
  getAlertLocationReports,
  createAlertValidation,
  getAlertsValidation,
  addPhotosToAlert,
  addPhotosValidation,
  markAlertResolved
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

// PATCH /api/alerts/:id/photos - Add photos to existing alert
router.patch('/:id/photos', authenticate, addPhotosValidation, addPhotosToAlert);

// PATCH /api/alerts/:id/resolve - Mark alert as resolved (admin function)
router.patch('/:id/resolve', authenticate, markAlertResolved);

// DELETE /api/alerts/:id - Delete alert (admin function)
router.delete('/:id', authenticate, deleteAlert);

export default router;
