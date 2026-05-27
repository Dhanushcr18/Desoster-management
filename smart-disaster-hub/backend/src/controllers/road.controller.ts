import { Request, Response } from 'express';
import Road from '../models/Road.model';
import Alert from '../models/Alert.model';

// Get all roads
export const getAllRoads = async (req: Request, res: Response) => {
  try {
    const { status, severity } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const roads = await Road.findAll({
      where,
      include: [
        { model: Alert, as: 'relatedAlert', attributes: ['id', 'title', 'severity'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(roads);
  } catch (error) {
    console.error('Error fetching roads:', error);
    res.status(500).json({ error: 'Failed to fetch roads' });
  }
};

// Get affected roads
export const getAffectedRoads = async (req: Request, res: Response) => {
  try {
    const roads = await Road.findAll({
      where: { status: 'affected' },
      order: [['createdAt', 'DESC']],
    });
    res.json(roads);
  } catch (error) {
    console.error('Error fetching affected roads:', error);
    res.status(500).json({ error: 'Failed to fetch affected roads' });
  }
};

// Get alternate routes
export const getAlternateRoutes = async (req: Request, res: Response) => {
  try {
    const roads = await Road.findAll({
      where: { status: 'alternate' },
      order: [['createdAt', 'DESC']],
    });
    res.json(roads);
  } catch (error) {
    console.error('Error fetching alternate routes:', error);
    res.status(500).json({ error: 'Failed to fetch alternate routes' });
  }
};

// Report a road as affected
export const reportAffectedRoad = async (req: Request, res: Response) => {
  try {
    const { name, description, coordinates, severity, relatedAlertId } = req.body;
    const userId = (req as any).user?.id;

    if (!name || !coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ 
        error: 'Name and coordinates (array of [lat, lng]) are required' 
      });
    }

    const road = await Road.create({
      name,
      description,
      coordinates,
      status: 'affected',
      severity: severity || 'high',
      reportedBy: userId,
      relatedAlertId,
    });

    res.status(201).json(road);
  } catch (error) {
    console.error('Error creating affected road:', error);
    res.status(500).json({ error: 'Failed to create road record' });
  }
};

// Report an alternate route
export const reportAlternateRoute = async (req: Request, res: Response) => {
  try {
    const { name, description, coordinates, relatedAlertId } = req.body;
    const userId = (req as any).user?.id;

    if (!name || !coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ 
        error: 'Name and coordinates (array of [lat, lng]) are required' 
      });
    }

    const road = await Road.create({
      name,
      description,
      coordinates,
      status: 'alternate',
      reportedBy: userId,
      relatedAlertId,
    });

    res.status(201).json(road);
  } catch (error) {
    console.error('Error creating alternate route:', error);
    res.status(500).json({ error: 'Failed to create alternate route' });
  }
};

// Update road status
export const updateRoadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, severity } = req.body;

    if (!['affected', 'alternate', 'normal'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const road = await Road.findByPk(id);
    if (!road) {
      return res.status(404).json({ error: 'Road not found' });
    }

    await road.update({ status, ...(severity && { severity }) });
    res.json(road);
  } catch (error) {
    console.error('Error updating road:', error);
    res.status(500).json({ error: 'Failed to update road' });
  }
};

// Delete a road
export const deleteRoad = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const road = await Road.findByPk(id);
    
    if (!road) {
      return res.status(404).json({ error: 'Road not found' });
    }

    await road.destroy();
    res.json({ message: 'Road deleted successfully' });
  } catch (error) {
    console.error('Error deleting road:', error);
    res.status(500).json({ error: 'Failed to delete road' });
  }
};
