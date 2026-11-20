import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { chatWithAI, chatValidation } from '../controllers/ai-call.controller';

const router = Router();

// Rate limiter for AI chat: 60 requests per minute
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests. Please slow down.' }
});

router.use(aiLimiter);

// POST /api/ai/chat - Send message to AI assistant
// This endpoint is public so users can get help even before logging in.
router.post('/chat', chatValidation, chatWithAI);

export default router;
