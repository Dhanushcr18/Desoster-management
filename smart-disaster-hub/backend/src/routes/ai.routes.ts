import { Router } from 'express';
import { chatWithAI, chatValidation } from '../controllers/ai-call.controller';

const router = Router();

// POST /api/ai/chat - Send message to AI assistant
// This endpoint is public so users can get help even before logging in.
router.post('/chat', chatValidation, chatWithAI);

export default router;
