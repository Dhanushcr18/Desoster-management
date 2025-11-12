import { Request, Response } from 'express';
import OpenAI from 'openai';

// Initialize OpenAI (you'll need to set OPENAI_API_KEY in .env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Store call sessions in memory (in production, use Redis or database)
const callSessions = new Map<string, any>();

export const initiateAICall = async (req: Request, res: Response) => {
  try {
    const { alertId, reporterPhone, reporterName, disasterType, location } = req.body;

    // Create AI call session
    const sessionId = `call_${Date.now()}_${alertId}`;
    
    const systemPrompt = `You are an AI emergency response assistant for a disaster management system. 
    
Context:
- You are calling ${reporterName} who reported a ${disasterType} at ${location}
- Your goal is to gather additional information about the disaster
- Be empathetic, clear, and professional
- Ask about: current situation, number of people affected, immediate needs, safety status
- Keep the conversation focused and efficient
- Provide reassurance that help is on the way

Guidelines:
- Start by introducing yourself as an AI assistant from the emergency response team
- Confirm the disaster details
- Ask follow-up questions about the situation
- Provide safety instructions if needed
- Let them know when help will arrive
- End the call professionally`;

    callSessions.set(sessionId, {
      alertId,
      reporterPhone,
      reporterName,
      disasterType,
      location,
      startTime: new Date(),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      status: 'initiated',
      transcript: []
    });

    // Generate initial AI greeting
    const greeting = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: 'Start the call with a professional greeting.'
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const aiGreeting = greeting.choices[0].message.content;

    // Update session
    const session = callSessions.get(sessionId);
    if (session) {
      session.messages.push({
        role: 'assistant',
        content: aiGreeting
      });
      session.transcript.push({
        speaker: 'AI',
        text: aiGreeting,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      sessionId,
      aiGreeting,
      message: 'AI call initiated successfully'
    });

  } catch (error: any) {
    console.error('AI Call Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate AI call'
    });
  }
};

export const processAIResponse = async (req: Request, res: Response) => {
  try {
    const { sessionId, userInput } = req.body;

    const session = callSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    // Add user input to conversation
    session.messages.push({
      role: 'user',
      content: userInput
    });

    session.transcript.push({
      speaker: 'User',
      text: userInput,
      timestamp: new Date()
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: session.messages,
      temperature: 0.7,
      max_tokens: 200
    });

    const aiResponse = completion.choices[0].message.content;

    // Update session
    session.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    session.transcript.push({
      speaker: 'AI',
      text: aiResponse,
      timestamp: new Date()
    });

    session.lastUpdate = new Date();

    res.json({
      success: true,
      aiResponse,
      transcript: session.transcript
    });

  } catch (error: any) {
    console.error('AI Response Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI response'
    });
  }
};

export const getCallTranscript = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = callSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    res.json({
      success: true,
      transcript: session.transcript,
      metadata: {
        alertId: session.alertId,
        reporterName: session.reporterName,
        disasterType: session.disasterType,
        startTime: session.startTime,
        duration: Date.now() - new Date(session.startTime).getTime()
      }
    });

  } catch (error: any) {
    console.error('Get Transcript Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transcript'
    });
  }
};

export const endAICall = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    const session = callSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    // Generate call summary using AI
    const summaryPrompt = `Based on this emergency call transcript, provide a concise summary including:
1. Key information gathered
2. Number of people affected
3. Immediate needs identified
4. Safety status
5. Recommended actions

Transcript:
${session.transcript.map((t: any) => `${t.speaker}: ${t.text}`).join('\n')}`;

    const summary = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: summaryPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    const callSummary = summary.choices[0].message.content;

    session.status = 'completed';
    session.endTime = new Date();
    session.summary = callSummary;

    res.json({
      success: true,
      summary: callSummary,
      duration: Date.now() - new Date(session.startTime).getTime(),
      transcript: session.transcript
    });

  } catch (error: any) {
    console.error('End Call Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to end call'
    });
  }
};

// Text-to-Speech conversion
export const textToSpeech = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);

  } catch (error: any) {
    console.error('TTS Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert text to speech'
    });
  }
};

// Speech-to-Text conversion
export const speechToText = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: req.file as any,
      model: "whisper-1",
    });

    res.json({
      success: true,
      text: transcription.text
    });

  } catch (error: any) {
    console.error('STT Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert speech to text'
    });
  }
};
