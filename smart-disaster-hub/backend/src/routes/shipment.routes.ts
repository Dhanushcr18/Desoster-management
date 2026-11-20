import { Router } from 'express';
import {
  getAllShipments,
  getShipmentById,
  getShipmentByCode,
  createShipment,
  updateShipment,
  shipmentValidation,
} from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/shipments - Public
router.get('/', getAllShipments);

// GET /api/shipments/code/:code - Public for driver mobile view
router.get('/code/:code', getShipmentByCode);

// GET /api/shipments/:id - Public
router.get('/:id', getShipmentById);

// POST /api/shipments - Admin / Authenticated
router.post('/', authenticate, shipmentValidation, createShipment);

// PATCH /api/shipments/:id - Admin / Authenticated
router.patch('/:id', authenticate, updateShipment);

export default router;
