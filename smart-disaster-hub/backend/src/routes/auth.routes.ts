import { Router } from 'express';
import { register, login, registerValidation, loginValidation } from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', registerValidation, register);

// POST /api/auth/login - Login user
router.post('/login', loginValidation, login);

export default router;
