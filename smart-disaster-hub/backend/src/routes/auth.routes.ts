import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, registerValidation, loginValidation } from '../controllers/auth.controller';

const router = Router();

// Rate limiter for auth endpoints: 50 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' }
});

router.use(authLimiter);

// POST /api/auth/register - Register new user
router.post('/register', registerValidation, register);

// POST /api/auth/login - Login user
router.post('/login', loginValidation, login);

export default router;
