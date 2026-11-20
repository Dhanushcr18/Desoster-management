import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Warehouse from '../models/Warehouse.model';

export const warehouseValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
  body('type')
    .isIn(['hub', 'depot', 'hospital', 'relief_camp'])
    .withMessage('Valid warehouse type is required'),
];

export const getAllWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await Warehouse.findAll({ order: [['name', 'ASC']] });
    res.json(warehouses);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve warehouses', error: err.message });
  }
};

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const warehouse = await Warehouse.create(req.body);
    res.status(201).json(warehouse);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create warehouse', error: err.message });
  }
};
