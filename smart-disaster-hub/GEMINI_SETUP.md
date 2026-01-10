# Google Gemini AI Integration Guide

## Overview

The Smart Disaster Hub chatbot now uses Google Gemini AI for more intelligent and context-aware responses about disaster management, safety procedures, and emergency information.

## Features

- **Advanced AI Responses**: Powered by Gemini 2.0 Flash model
- **Disaster-Specific Knowledge**: Specialized in emergency management
- **Fallback System**: Automatically falls back to rule-based responses if API is unavailable
- **Free Tier Available**: Google offers generous free quotas

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure the Backend

1. Navigate to the backend directory:
   ```bash
   cd smart-disaster-hub/backend
   ```

2. Create a `.env` file (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

3. Open the `.env` file and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### 3. Verify Installation

The `@google/generative-ai` package is already included in `package.json`. If you need to reinstall dependencies:

```bash
npm install
```

### 4. Start the Backend

```bash
npm run dev
```

## How It Works

### AI Service Architecture

The AI service now supports three providers:

1. **Gemini** (Primary): Uses Google's Gemini 2.0 Flash model
2. **HuggingFace** (Alternative): Free inference API  
3. **Fallback** (Default): Enhanced keyword-based responses

### Provider Selection Logic

```typescript
// In ai.service.ts
const geminiApiKey = process.env.GEMINI_API_KEY;
export const aiService = new AIService({ 
  provider: geminiApiKey ? 'gemini' : 'fallback',
  apiKey: geminiApiKey
});
```

- If `GEMINI_API_KEY` is set: Uses Gemini
- If API fails: Falls back to rule-based system
- If no key: Uses enhanced fallback directly

## Testing the Chatbot

1. Start the backend server
2. Open the frontend application
3. Navigate to the AI Chat section
4. Try these example queries:

   - "What should I do during an earthquake?"
   - "How do I prepare an emergency kit?"
   - "What are the current alerts in my area?"
   - "Tell me about flood safety procedures"

## API Rate Limits

**Gemini 2.0 Flash Free Tier:**
- 15 requests per minute
- 1,500 requests per day
- 1 million requests per month

For production use with higher traffic, consider:
- Implementing rate limiting
- Using Gemini 1.5 Flash (higher limits)
- Upgrading to paid tier

## Troubleshooting

### Issue: "Gemini AI not initialized"

**Solution:** Verify your API key is correctly set in `.env`

```bash
# Check if the key is loaded
echo $env:GEMINI_API_KEY  # PowerShell
```

### Issue: API calls failing

**Possible causes:**
1. Invalid API key
2. Rate limit exceeded
3. Network connectivity issues

**Solution:** The system will automatically fall back to rule-based responses

### Issue: Slow responses

**Solution:** 
- Gemini 2.0 Flash is optimized for speed
- Consider upgrading to Gemini 1.5 Flash for even faster responses
- Check your internet connection

## Customizing the System Prompt

Edit the `systemPrompt` in [ai.service.ts](smart-disaster-hub/backend/src/services/ai.service.ts#L11-L22):

```typescript
private systemPrompt = `You are a helpful disaster management AI assistant...`;
```

## Model Options

You can change the Gemini model in [ai.service.ts](smart-disaster-hub/backend/src/services/ai.service.ts#L48-L51):

```typescript
const model = this.genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',  // Change this
  systemInstruction: this.systemPrompt
});
```

Available models:
- `gemini-2.0-flash-exp` - Latest, fastest (recommended)
- `gemini-1.5-flash` - Stable, fast
- `gemini-1.5-pro` - Most capable, slower

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** in production
3. **Rotate API keys regularly**
4. **Monitor API usage** in Google AI Studio
5. **Implement rate limiting** for production

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Pricing Information](https://ai.google.dev/pricing)
- [Best Practices](https://ai.google.dev/docs/best_practices)

## Support

For issues related to:
- **Gemini API**: Check [Google AI Documentation](https://ai.google.dev/docs)
- **Integration**: Review this guide and check logs
- **Feature requests**: Create an issue in the repository
