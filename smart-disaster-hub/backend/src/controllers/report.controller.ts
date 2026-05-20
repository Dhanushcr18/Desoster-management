import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Report from '../models/Report.model';
import Alert from '../models/Alert.model';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const createReportValidation = [
  body('alertId').notEmpty().withMessage('Alert ID is required'),
  body('status').isIn(['safe', 'help']).withMessage('Status must be safe or help'),
  body('note').optional().isString().isLength({ max: 500 }),
  body('safeRadius').optional().isFloat({ min: 0, max: 1000 }).withMessage('Safe radius must be between 0 and 1000 km'),
  body('currentLatitude').optional().isFloat({ min: -90, max: 90 }),
  body('currentLongitude').optional().isFloat({ min: -180, max: 180 }),
  body('address').optional().isString(),
  body('landmark').optional().isString(),
  body('affectedRoad').optional().isString(),
  body('alternateRoute').optional().isString(),
  body('extraDistance').optional().isFloat({ min: 0 }),
  body('estimatedTime').optional().isInt({ min: 0 }),
  body('routeDescription').optional().isString().isLength({ max: 1000 }),
  body('contactName').optional().isString().isLength({ max: 255 }),
  body('contactPhone').optional().isString().isLength({ max: 50 }),
  body('contactLocation').optional().isString().isLength({ max: 500 })
];

// Create or update user status report
export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { 
      alertId, 
      status, 
      note, 
      safeRadius,
      currentLatitude,
      currentLongitude,
      // Support both flat fields AND nested locationDetails object (from ReportModal)
      locationDetails,
      address:         flatAddress,
      landmark:        flatLandmark,
      affectedRoad:    flatAffectedRoad,
      alternateRoute:  flatAlternateRoute,
      extraDistance:   flatExtraDistance,
      estimatedTime:   flatEstimatedTime,
      routeDescription: flatRouteDescription,
      contactName:     flatContactName,
      contactPhone:    flatContactPhone,
      contactLocation: flatContactLocation
    } = req.body;

    // Merge nested locationDetails with flat fields (flat fields take priority)
    const ld = locationDetails || {};
    const address         = flatAddress         ?? ld.address;
    const landmark        = flatLandmark        ?? ld.landmark;
    const affectedRoad    = flatAffectedRoad    ?? ld.affectedRoad;
    const alternateRoute  = flatAlternateRoute  ?? ld.alternateRoute;
    const extraDistance   = flatExtraDistance   ?? ld.extraDistance;
    const estimatedTime   = flatEstimatedTime   ?? ld.estimatedTime;
    const routeDescription = flatRouteDescription ?? ld.routeDescription;
    const contactName     = flatContactName     ?? ld.contactName;
    const contactPhone    = flatContactPhone    ?? ld.contactPhone;
    const contactLocation = flatContactLocation ?? ld.contactLocation;

    // userId may be null for anonymous/unauthenticated reports
    const userId = req.userId ? Number(req.userId) : null;

    // Verify alert exists in database (skip for real-world alerts with non-numeric ids)
    const numericAlertId = Number(alertId);
    const isRealWorldAlert = isNaN(numericAlertId) || numericAlertId <= 0;

    if (isRealWorldAlert) {
      // Real-world alerts (USGS earthquakes, weather alerts) have string IDs and
      // don't exist in the DB. Return a mock success so the user sees feedback.
      console.log(`ℹ️  Report for real-world alert "${alertId}" acknowledged (not stored in DB)`);
      res.status(201).json({
        message: 'Status acknowledged successfully',
        report: { alertId, status, note },
        reportStats: { safe: status === 'safe' ? 1 : 0, help: status === 'help' ? 1 : 0 }
      });
      return;
    }

    // For DB alerts, verify the alert actually exists
    const dbAlert = await Alert.findByPk(numericAlertId);
    if (!dbAlert) {
      res.status(404).json({ message: 'Alert not found in database' });
      return;
    }

    // For anonymous users, always create a new report (no upsert by userId)
    let report: any;
    if (userId) {
      const [found] = await Report.findOrCreate({
        where: { alertId: numericAlertId, userId },
        defaults: {
          alertId: numericAlertId,
          userId,
          status,
          note,
          safeRadius,
          currentLatitude,
          currentLongitude,
          address,
          landmark,
          affectedRoad,
          alternateRoute,
          extraDistance,
          estimatedTime,
          routeDescription,
          contactName,
          contactPhone,
          contactLocation
        }
      });
      // Update if already exists
      await found.update({
        status,
        note,
        safeRadius,
        currentLatitude,
        currentLongitude,
        address,
        landmark,
        affectedRoad,
        alternateRoute,
        extraDistance,
        estimatedTime,
        routeDescription,
        contactName,
        contactPhone,
        contactLocation
      });
      report = found;
    } else {
      // Anonymous report — always insert new
      report = await Report.create({
        alertId: numericAlertId,
        userId: null as any,
        status,
        note,
        safeRadius,
        currentLatitude,
        currentLongitude,
        address,
        landmark,
        affectedRoad,
        alternateRoute,
        extraDistance,
        estimatedTime,
        routeDescription,
        contactName,
        contactPhone,
        contactLocation
      });
    }

    console.log('✅ Report saved:', {
      reportId: report.id,
      alertId,
      userId,
      status: report.status,
      safeRadius: report.safeRadius
    });

    // Get updated stats for this alert
    const stats = await Report.findAll({
      where: { alertId: numericAlertId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Calculate average safe radius
    const radiusStats = await Report.findAll({
      where: { 
        alertId,
        safeRadius: { [Op.ne]: null }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('safeRadius')), 'avgSafeRadius'],
        [sequelize.fn('MIN', sequelize.col('safeRadius')), 'minSafeRadius'],
        [sequelize.fn('MAX', sequelize.col('safeRadius')), 'maxSafeRadius'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      raw: true
    });

    const reportStats: any = {
      safe: 0,
      help: 0
    };

    (stats as any).forEach((stat: any) => {
      reportStats[stat.status as 'safe' | 'help'] = stat.count;
    });

    console.log('📊 Calculated report stats for alert:', alertId, reportStats);

    // Add safe radius information if available
    if (radiusStats.length > 0 && (radiusStats[0] as any).avgSafeRadius) {
      reportStats.safeRadius = {
        average: Math.round((radiusStats[0] as any).avgSafeRadius * 10) / 10,
        min: (radiusStats[0] as any).minSafeRadius,
        max: (radiusStats[0] as any).maxSafeRadius,
        reportCount: (radiusStats[0] as any).count
      };
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Emitting report:update event for alert:', alertId, reportStats);
      io.to('alerts').emit('report:update', {
        alertId: alertId.toString(),
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

    const reports = await Report.findAll({
      where: { userId },
      include: [
        {
          model: Alert,
          as: 'Alert'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};
