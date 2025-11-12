import express from 'express';
import { 
  initiateAICall, 
  processAIResponse, 
  getCallTranscript, 
  endAICall,
  textToSpeech,
  speechToText
} from '../controllers/ai-call.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// AI Call Management
router.post('/initiate', initiateAICall);
router.post('/respond', processAIResponse);
router.get('/transcript/:sessionId', getCallTranscript);
router.post('/end', endAICall);

// Voice Processing
router.post('/tts', textToSpeech);
router.post('/stt', speechToText);

export default router;
