import { Router } from 'express';
import {
  createReport,
  getUserReports,
  createReportValidation
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/reports - Create or update user status report
router.post('/', authenticate, createReportValidation, createReport);

// GET /api/reports/me - Get current user's reports
router.get('/me', authenticate, getUserReports);

export default router;
