import { Router } from 'express';
import { getAllWarehouses, createWarehouse, warehouseValidation } from '../controllers/warehouse.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/warehouses - Public
router.get('/', getAllWarehouses);

// POST /api/warehouses - Admin / Authenticated
router.post('/', authenticate, warehouseValidation, createWarehouse);

export default router;
