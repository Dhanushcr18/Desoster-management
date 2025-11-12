import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Alert from '../models/Alert.model';
import Report from '../models/Report.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const createAlertValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('geometry.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  body('geometry.coordinates[0]').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('geometry.coordinates[1]').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('severity').isIn(['low', 'medium', 'high']).withMessage('Severity must be low, medium, or high'),
  body('source').trim().notEmpty().withMessage('Source is required'),
  body('photos').optional().isArray({ max: 5 }).withMessage('Maximum 5 photos allowed')
];

export const getAlertsValidation = [
  query('severity').optional().isIn(['low', 'medium', 'high']),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

// Get all alerts with optional filtering
export const getAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { severity, bbox, limit = 50 } = req.query;

    // Build query
    const query: any = {};

    if (severity) {
      query.severity = severity;
    }

    // Bounding box format: minLng,minLat,maxLng,maxLat
    if (bbox && typeof bbox === 'string') {
      const coords = bbox.split(',').map(Number);
      if (coords.length === 4) {
        query.geometry = {
          $geoWithin: {
            $box: [
              [coords[0], coords[1]], // bottom-left
              [coords[2], coords[3]]  // top-right
            ]
          }
        };
      }
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Get report stats for each alert
    const alertsWithStats = await Promise.all(
      alerts.map(async (alert) => {
        // Get aggregated report stats
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

        // Add safe radius information if available
        if (radiusStats.length > 0) {
          reportStats.safeRadius = {
            average: Math.round(radiusStats[0].avgSafeRadius * 10) / 10,
            min: radiusStats[0].minSafeRadius,
            max: radiusStats[0].maxSafeRadius,
            reportCount: radiusStats[0].count
          };
        }

        return {
          ...alert.toObject(),
          reportStats
        };
      })
    );

    res.json({
      count: alertsWithStats.length,
      alerts: alertsWithStats
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

// Get single alert by ID
export const getAlertById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Get aggregated report stats
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

    // Add safe radius information if available
    if (radiusStats.length > 0) {
      reportStats.safeRadius = {
        average: Math.round(radiusStats[0].avgSafeRadius * 10) / 10,
        min: radiusStats[0].minSafeRadius,
        max: radiusStats[0].maxSafeRadius,
        reportCount: radiusStats[0].count
      };
    }

    res.json({
      alert,
      reportStats
    });
  } catch (error) {
    console.error('Get alert error:', error);
    res.status(500).json({ message: 'Failed to fetch alert' });
  }
};

// Create new alert
export const createAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { title, description, geometry, severity, source } = req.body;

    const alert = await Alert.create({
      title,
      description,
      geometry: {
        type: 'Point',
        coordinates: geometry.coordinates
      },
      severity,
      source,
      verified: false
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('alerts').emit('alert:new', alert);
    }

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Failed to create alert' });
  }
};

// Get location reports for an alert
export const getAlertLocationReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get reports with location details
    const reports = await Report.find({
      alertId: id,
      'locationDetails': { $exists: true }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    // Filter reports that have meaningful location data
    const locationReports = reports.filter(report => 
      report.locationDetails && (
        report.locationDetails.address ||
        report.locationDetails.affectedRoad ||
        report.locationDetails.alternateRoute
      )
    );

    res.json({
      count: locationReports.length,
      reports: locationReports
    });
  } catch (error) {
    console.error('Get location reports error:', error);
    res.status(500).json({ message: 'Failed to fetch location reports' });
  }
};

// Delete alert (admin function - simplified for hackathon)
export const deleteAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ message: 'Failed to delete alert' });
  }
};

// Validation for adding photos
export const addPhotosValidation = [
  body('photos').isArray({ min: 1, max: 5 }).withMessage('Photos must be an array with 1-5 items'),
  body('photos.*').isString().withMessage('Each photo must be a base64 string')
];

// Add photos to existing alert
export const addPhotosToAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { photos } = req.body;

    // Find the alert
    const alert = await Alert.findById(id);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Check if adding these photos would exceed the limit
    const currentPhotoCount = alert.photos?.length || 0;
    if (currentPhotoCount + photos.length > 5) {
      res.status(400).json({ 
        message: `Cannot add ${photos.length} photo(s). Alert already has ${currentPhotoCount} photo(s). Maximum is 5.` 
      });
      return;
    }

    // Add new photos to existing photos
    const updatedPhotos = [...(alert.photos || []), ...photos];
    alert.photos = updatedPhotos;
    await alert.save();

    res.json({
      message: 'Photos added successfully',
      alert: alert
    });
  } catch (error) {
    console.error('Add photos error:', error);
    res.status(500).json({ message: 'Failed to add photos' });
  }
};

// Mark alert as resolved
export const markAlertResolved = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id);

    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Add resolved status
    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.userId;
    await alert.save();

    res.json({
      message: 'Alert marked as resolved successfully',
      alert: alert
    });
  } catch (error) {
    console.error('Mark resolved error:', error);
    res.status(500).json({ message: 'Failed to mark alert as resolved' });
  }
};
