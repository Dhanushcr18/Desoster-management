import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { aiService } from '../services/ai.service';

// AI Chat validation rules
export const chatValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
];

// Chat with AI assistant
export const chatWithAI = async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    // Use AI service to get response
    const response = await aiService.chat(message);
    
    res.json({ response });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to process your message. Please try again.' });
  }
};
