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
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/alerts - Get all alerts (public, optional auth)
router.get('/', optionalAuthenticate, getAlertsValidation, getAlerts);

// GET /api/alerts/:id - Get single alert by ID (public)
router.get('/:id', optionalAuthenticate, getAlertById);

// GET /api/alerts/:id/location-reports - Get location reports for an alert
router.get('/:id/location-reports', optionalAuthenticate, getAlertLocationReports);

// POST /api/alerts - Create new alert (public with optional auth for community reports)
router.post('/', optionalAuthenticate, createAlertValidation, createAlert);

// PATCH /api/alerts/:id/photos - Add photos to existing alert (optional auth)
router.patch('/:id/photos', optionalAuthenticate, addPhotosValidation, addPhotosToAlert);

// PATCH /api/alerts/:id/resolve - Mark alert as resolved (admin function)
router.patch('/:id/resolve', authenticate, markAlertResolved);

// DELETE /api/alerts/:id - Delete alert (admin function)
router.delete('/:id', authenticate, deleteAlert);

export default router;
