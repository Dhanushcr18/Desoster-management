import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Alert from '../models/Alert.model';
import Report from '../models/Report.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const createAlertValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Severity must be low, medium, high, or critical'),
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

    // Build where clause
    const where: any = {};

    if (severity) {
      where.severity = severity;
    }

    // Bounding box format: minLng,minLat,maxLng,maxLat
    if (bbox && typeof bbox === 'string') {
      const coords = bbox.split(',').map(Number);
      if (coords.length === 4) {
        where.longitude = {
          [Op.between]: [coords[0], coords[2]]
        };
        where.latitude = {
          [Op.between]: [coords[1], coords[3]]
        };
      }
    }

    const alerts = await Alert.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    });

    // Get report stats for each alert
    const alertsWithStats = await Promise.all(
      alerts.map(async (alert) => {
        // Get status counts
        const stats = await Report.findAll({
          where: { alertId: alert.id },
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        });

        // Get safe radius stats
        const radiusStats = await Report.findAll({
          where: { 
            alertId: alert.id,
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
          reportStats[stat.status as 'safe' | 'help'] = parseInt(stat.count, 10) || 0;
        });

        // Add safe radius information if available
        if (radiusStats.length > 0 && (radiusStats[0] as any).avgSafeRadius) {
          reportStats.safeRadius = {
            average: Math.round((radiusStats[0] as any).avgSafeRadius * 10) / 10,
            min: (radiusStats[0] as any).minSafeRadius,
            max: (radiusStats[0] as any).maxSafeRadius,
            reportCount: (radiusStats[0] as any).count
          };
        }

        return {
          ...alert.toJSON(),
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

    const alert = await Alert.findByPk(id);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Get status counts
    const stats = await Report.findAll({
      where: { alertId: alert.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get safe radius stats
    const radiusStats = await Report.findAll({
      where: { 
        alertId: alert.id,
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
      reportStats[stat.status as 'safe' | 'help'] = parseInt(stat.count, 10) || 0;
    });

    // Add safe radius information if available
    if (radiusStats.length > 0 && (radiusStats[0] as any).avgSafeRadius) {
      reportStats.safeRadius = {
        average: Math.round((radiusStats[0] as any).avgSafeRadius * 10) / 10,
        min: (radiusStats[0] as any).minSafeRadius,
        max: (radiusStats[0] as any).maxSafeRadius,
        reportCount: (radiusStats[0] as any).count
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

    const { title, description, severity, source, photos } = req.body;

    // Support both geometry.coordinates format (frontend) and flat lat/lon format
    let longitude: number;
    let latitude: number;

    if (req.body.geometry?.coordinates && Array.isArray(req.body.geometry.coordinates)) {
      [longitude, latitude] = req.body.geometry.coordinates;
    } else {
      longitude = req.body.longitude;
      latitude = req.body.latitude;
    }

    if (longitude === undefined || latitude === undefined || isNaN(longitude) || isNaN(latitude)) {
      res.status(400).json({ message: 'Valid location coordinates are required' });
      return;
    }

    // Normalize severity: 'critical' -> 'high' for DB compatibility
    const normalizedSeverity = severity === 'critical' ? 'high' : severity;

    const alert = await Alert.create({
      title,
      description,
      longitude,
      latitude,
      severity: normalizedSeverity,
      source,
      photos: photos || [],
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
    const reports = await Report.findAll({
      where: { alertId: id },
      include: [
        {
          association: 'User',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Filter reports that have meaningful location or contact data
    const locationReports = reports.filter(report => 
      report.address ||
      report.affectedRoad ||
      report.alternateRoute ||
      report.contactName ||
      report.contactPhone ||
      report.contactLocation
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

    const alert = await Alert.findByPk(id);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    await alert.destroy();
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
    const alert = await Alert.findByPk(id);
    if (!alert) {
      res.status(404).json({ message: 'Alert not found' });
      return;
    }

    // Get current photos
    const currentPhotos = alert.photos || [];
    const currentPhotoCount = Array.isArray(currentPhotos) ? currentPhotos.length : 0;
    
    if (currentPhotoCount + photos.length > 5) {
      res.status(400).json({ 
        message: `Cannot add ${photos.length} photo(s). Alert already has ${currentPhotoCount} photo(s). Maximum is 5.` 
      });
      return;
    }

    // Add new photos to existing photos
    const updatedPhotos = [...(currentPhotos || []), ...photos];
    await alert.update({ photos: updatedPhotos });

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

    const alert = await Alert.findByPk(id);

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
