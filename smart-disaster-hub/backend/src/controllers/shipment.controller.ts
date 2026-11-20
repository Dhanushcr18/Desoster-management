import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Shipment from '../models/Shipment.model';
import Warehouse from '../models/Warehouse.model';
import AgentDecision from '../models/AgentDecision.model';
import Road from '../models/Road.model';
import { getRoutes } from '../services/routing.service';
import { io } from '../server';

export const shipmentValidation = [
  body('code').trim().notEmpty().withMessage('Shipment code is required'),
  body('cargoType')
    .isIn(['medicine', 'food', 'fuel', 'water', 'general'])
    .withMessage('Valid cargoType is required'),
  body('priority')
    .isIn(['critical', 'high', 'normal'])
    .withMessage('Valid priority is required'),
  body('originWarehouseId').isInt().withMessage('Valid originWarehouseId is required'),
  body('destinationWarehouseId').isInt().withMessage('Valid destinationWarehouseId is required'),
];

export const getAllShipments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, cargoType, priority } = req.query;
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (cargoType) whereClause.cargoType = cargoType;
    if (priority) whereClause.priority = priority;

    const shipments = await Shipment.findAll({
      where: whereClause,
      include: [
        { model: Warehouse, as: 'originWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        {
          model: AgentDecision,
          as: 'decisions',
          limit: 5,
          order: [['createdAt', 'DESC']],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(shipments);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve shipments', error: err.message });
  }
};

export const getShipmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findByPk(id, {
      include: [
        { model: Warehouse, as: 'originWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        {
          model: AgentDecision,
          as: 'decisions',
          include: [{ model: Road, as: 'road' }],
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }

    res.json(shipment);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve shipment', error: err.message });
  }
};

export const getShipmentByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const shipment = await Shipment.findOne({
      where: { code },
      include: [
        { model: Warehouse, as: 'originWarehouse' },
        { model: Warehouse, as: 'destinationWarehouse' },
        {
          model: AgentDecision,
          as: 'decisions',
          order: [['createdAt', 'DESC']],
          limit: 1,
        },
      ],
    });

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }

    res.json(shipment);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve shipment by code', error: err.message });
  }
};

export const createShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      code,
      cargoType,
      priority,
      perishable,
      originWarehouseId,
      destinationWarehouseId,
      driverName,
      driverPhone,
      telegramChatId,
    } = req.body;

    const origin = await Warehouse.findByPk(originWarehouseId);
    const dest = await Warehouse.findByPk(destinationWarehouseId);

    if (!origin || !dest) {
      res.status(400).json({ message: 'Invalid origin or destination warehouse' });
      return;
    }

    // Compute route via routing service
    const routes = await getRoutes([origin.lat, origin.lng], [dest.lat, dest.lng]);
    const fastest = routes[0];

    const shipment = await Shipment.create({
      code,
      cargoType,
      priority: priority || 'normal',
      perishable: perishable ?? (cargoType === 'food'),
      originWarehouseId,
      destinationWarehouseId,
      status: 'scheduled',
      departureTime: new Date(),
      etaMinutes: fastest.durationMin,
      currentLat: origin.lat,
      currentLng: origin.lng,
      progress: 0.0,
      originalRoute: fastest.geometry,
      activeRoute: fastest.geometry,
      originalDurationMin: fastest.durationMin,
      activeDurationMin: fastest.durationMin,
      driverName: driverName || 'Assigned Driver',
      driverPhone: driverPhone || null,
      telegramChatId: telegramChatId || null,
    });

    io?.emit('shipment:update', shipment);
    res.status(201).json(shipment);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create shipment', error: err.message });
  }
};

export const updateShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findByPk(id);

    if (!shipment) {
      res.status(404).json({ message: 'Shipment not found' });
      return;
    }

    await shipment.update(req.body);
    io?.emit('shipment:update', shipment);
    res.json(shipment);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update shipment', error: err.message });
  }
};
