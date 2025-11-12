import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Report from '../models/Report.model';
import Alert from '../models/Alert.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const createReportValidation = [
  body('alertId').notEmpty().withMessage('Alert ID is required'),
  body('status').isIn(['safe', 'help']).withMessage('Status must be safe or help'),
  body('note').optional().isString().isLength({ max: 500 }),
  body('safeRadius').optional().isFloat({ min: 0, max: 1000 }).withMessage('Safe radius must be between 0 and 1000 km'),
  body('locationDetails').optional().isObject(),
  body('locationDetails.address').optional().isString(),
  body('locationDetails.landmark').optional().isString(),
  body('locationDetails.affectedRoad').optional().isString(),
  body('locationDetails.alternateRoute').optional().isString(),
  body('locationDetails.extraDistance').optional().isFloat({ min: 0 }),
  body('locationDetails.estimatedTime').optional().isInt({ min: 0 }),
  body('locationDetails.routeDescription').optional().isString().isLength({ max: 1000 })
];

// Create or update user status report
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { alertId, status, note, safeRadius, locationDetails } = req.body;
    const userId = req.userId;

    // Verify alert exists
    const alert = await Alert.findById(alertId);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Prepare update data
    const updateData: any = {
      status,
      note,
      createdAt: new Date()
    };

    // Add safe radius if provided
    if (safeRadius !== undefined && safeRadius !== null) {
      updateData.safeRadius = safeRadius;
    }

    // Add location details if provided
    if (locationDetails && Object.keys(locationDetails).length > 0) {
      updateData.locationDetails = locationDetails;
    }

    // Create or update report (upsert)
    const report = await Report.findOneAndUpdate(
      { alertId, userId },
      updateData,
      { upsert: true, new: true }
    );

    console.log('✅ Report saved:', {
      reportId: report._id,
      alertId,
      userId,
      status: report.status,
      safeRadius: report.safeRadius
    });

    // Get updated stats for this alert
    const stats = await Report.aggregate([
      { $match: { alertId: alert._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average safe radius
    const radiusStats = await Report.aggregate([
      { $match: { alertId: alert._id, safeRadius: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgSafeRadius: { $avg: '$safeRadius' },
          minSafeRadius: { $min: '$safeRadius' },
          maxSafeRadius: { $max: '$safeRadius' },
          count: { $sum: 1 }
        }
      }
    ]);

    const reportStats: any = {
      safe: 0,
      help: 0
    };

    stats.forEach((stat: any) => {
      reportStats[stat._id as 'safe' | 'help'] = stat.count;
    });

    console.log('📊 Calculated report stats for alert:', alertId, reportStats);

    // Add safe radius information if available
    if (radiusStats.length > 0) {
      reportStats.safeRadius = {
        average: Math.round(radiusStats[0].avgSafeRadius * 10) / 10, // Round to 1 decimal
        min: radiusStats[0].minSafeRadius,
        max: radiusStats[0].maxSafeRadius,
        reportCount: radiusStats[0].count
      };
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Emitting report:update event for alert:', alertId, reportStats);
      io.to('alerts').emit('report:update', {
        alertId: alertId.toString(), // Ensure it's a string
        reportStats
      });
    } else {
      console.warn('⚠️ Socket.IO instance not found on req.app');
    }

    res.status(201).json({
      message: 'Status updated successfully',
      report,
      reportStats
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Failed to create report' });
  }
};

// Get user's reports
export const getUserReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const reports = await Report.find({ userId })
      .populate('alertId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};
