# AI Auto Call & Replay Feature

## Overview
The AI Auto Call & Replay feature enables admins to automatically initiate AI-powered calls to disaster reporters for gathering additional information and providing real-time assistance.

## Features

### 🤖 AI-Powered Conversations
- Intelligent AI assistant that conducts natural conversations
- Context-aware responses based on disaster type and location
- Professional and empathetic communication style

### 🎙️ Voice Integration
- **Text-to-Speech (TTS)**: AI responses are converted to natural-sounding speech
- **Speech-to-Text (STT)**: Support for voice input (coming soon)
- Real-time audio playback of AI responses

### 📝 Transcript & Replay
- Complete conversation transcript saved automatically
- Replay functionality to review past calls
- Timestamps for each message
- Full call duration tracking

### 📊 AI-Generated Summary
- Automatic call summary generation after call ends
- Key information extraction
- Recommended actions
- Safety status assessment

## How to Use

### 1. Setup OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to `backend/.env`:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

### 2. Initiate a Call

1. Navigate to Admin Dashboard
2. Find the disaster alert you want to follow up on
3. Click the **"AI Auto Call & Replay"** button (purple gradient button)
4. The AI will automatically initiate a call with a professional greeting

### 3. During the Call

- **View Transcript**: Real-time transcript appears in the modal
- **Listen to AI**: AI responses are spoken using natural voice
- **Respond**: Type your responses in the input field
- **Mute/Unmute**: Toggle audio playback
- **Monitor Duration**: See call duration in real-time

### 4. End the Call

1. Click the **"End Call"** button (red button)
2. AI will generate an automatic summary
3. Review the full transcript and summary
4. Summary includes:
   - Key information gathered
   - Number of people affected
   - Immediate needs identified
   - Safety status
   - Recommended actions

## API Endpoints

### Initiate Call
```http
POST /api/ai-call/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertId": "string",
  "reporterPhone": "string",
  "reporterName": "string",
  "disasterType": "string",
  "location": "string"
}
```

### Send Response
```http
POST /api/ai-call/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "string",
  "userInput": "string"
}
```

### End Call
```http
POST /api/ai-call/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "string"
}
```

### Get Transcript
```http
GET /api/ai-call/transcript/:sessionId
Authorization: Bearer <token>
```

### Text-to-Speech
```http
POST /api/ai-call/tts
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "string"
}
```

## Technical Details

### AI Model
- **Model**: GPT-4 (for intelligent responses)
- **Voice**: OpenAI TTS-1 with "alloy" voice
- **Temperature**: 0.7 (balanced creativity and consistency)

### Call Session Management
- Sessions stored in-memory (use Redis for production)
- Unique session ID for each call
- Automatic cleanup after call ends

### Voice Processing
- **TTS Engine**: OpenAI Text-to-Speech
- **Audio Format**: MP3
- **Voice Quality**: High-quality natural speech

## Configuration

### System Prompt
The AI is configured with a specific system prompt that ensures:
- Professional and empathetic tone
- Focus on emergency response
- Efficient information gathering
- Safety-first approach

### Customization
You can customize the AI behavior by modifying the system prompt in:
```typescript
backend/src/controllers/ai-call.controller.ts
```

## Best Practices

1. **API Key Security**: Never commit your OpenAI API key to version control
2. **Rate Limiting**: Implement rate limiting for production use
3. **Session Management**: Use Redis or database for production instead of in-memory storage
4. **Error Handling**: Always handle API errors gracefully
5. **Cost Monitoring**: Monitor OpenAI API usage to control costs

## Future Enhancements

- [ ] Real-time voice input (Speech-to-Text)
- [ ] Multi-language support
- [ ] Automatic call scheduling
- [ ] Call analytics dashboard
- [ ] Integration with phone systems (Twilio)
- [ ] Voice emotion detection
- [ ] Automatic priority escalation

## Troubleshooting

### Common Issues

**Issue**: "Cannot find module 'openai'"
**Solution**: Run `npm install openai` in backend directory

**Issue**: "OpenAI API Error"
**Solution**: Verify your API key is correct in `.env` file

**Issue**: "Audio not playing"
**Solution**: Check browser permissions for audio playback

**Issue**: "Call session not found"
**Solution**: Session may have expired, restart the call

## Cost Considerations

OpenAI API pricing (as of 2024):
- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- TTS: ~$15 per 1M characters

Average call cost: $0.10 - $0.50 depending on conversation length

## Security Notes

- All API calls require authentication
- Sessions are user-specific
- Transcripts contain sensitive information - handle appropriately
- Consider GDPR/privacy regulations when storing call data

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
