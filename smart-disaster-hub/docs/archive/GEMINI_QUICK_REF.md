# 🚀 Gemini AI Quick Reference

## API Key Setup (30 seconds)

```bash
# 1. Get key: https://aistudio.google.com/apikey
# 2. Add to backend/.env:
GEMINI_API_KEY=AIzaSy...your_key...XYZ

# 3. Restart backend
npm run dev
```

## How to Use

### In Code
```typescript
import { aiService } from './services/ai.service';

const response = await aiService.chat("What to do during an earthquake?");
console.log(response);
```

### Via API
```bash
# PowerShell
$body = @{message="Your question here"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body

# curl (Git Bash/Linux)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Your question here"}'
```

## Configuration Options

### Change Model
```typescript
// In ai.service.ts, line ~48
model: 'gemini-2.0-flash-exp'  // Current (fastest, latest)
model: 'gemini-1.5-flash'      // Stable alternative
model: 'gemini-1.5-pro'        // Most capable
```

### Customize System Prompt
```typescript
// In ai.service.ts, line ~11
private systemPrompt = `Your custom instructions here...`;
```

### Switch Provider
```typescript
// In ai.service.ts, line ~434
export const aiService = new AIService({ 
  provider: 'gemini',    // Use Gemini
  // provider: 'fallback', // Use rule-based
  apiKey: process.env.GEMINI_API_KEY
});
```

## Testing Commands

### Quick Test
```powershell
# Test if Gemini is working
$test = @{message="Hi"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $test
```

### Check Provider
```bash
# Look for this in console when backend starts:
# [AI Service] Using provider: gemini ✓
# [AI Service] Using provider: fallback (no API key)
```

### Load Test
```powershell
# Send 10 requests (free tier: 15/min limit)
1..10 | ForEach-Object {
  $body = @{message="Test $_"} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
}
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Gemini AI not initialized" | Add `GEMINI_API_KEY` to `.env` |
| Getting fallback responses | Check API key is valid in [AI Studio](https://aistudio.google.com/) |
| Rate limit errors | Wait 1 minute or use fallback |
| Network timeouts | Check internet connection |

## File Locations

- **AI Service:** `backend/src/services/ai.service.ts`
- **AI Controller:** `backend/src/controllers/ai-call.controller.ts`
- **AI Routes:** `backend/src/routes/ai.routes.ts`
- **Environment:** `backend/.env`

## API Limits (Free Tier)

- **Per Minute:** 15 requests
- **Per Day:** 1,500 requests
- **Per Month:** 1,000,000 requests
- **Cost:** FREE

## Response Time

- **Gemini:** 1-3 seconds (network dependent)
- **Fallback:** <100ms (instant)

## Model Comparison

| Model | Speed | Quality | Use Case |
|-------|-------|---------|----------|
| gemini-2.0-flash-exp | ⚡⚡⚡ | ⭐⭐⭐ | Current (best) |
| gemini-1.5-flash | ⚡⚡ | ⭐⭐ | Stable production |
| gemini-1.5-pro | ⚡ | ⭐⭐⭐⭐ | Complex queries |

## Best Practices

✅ **DO:**
- Use environment variables for API keys
- Implement rate limiting for production
- Monitor API usage in AI Studio
- Keep the fallback system active
- Log errors for debugging

❌ **DON'T:**
- Commit API keys to Git
- Remove fallback system
- Ignore rate limits
- Skip error handling
- Hardcode credentials

## Useful Links

- 🔑 [Get API Key](https://aistudio.google.com/apikey)
- 📖 [Gemini Docs](https://ai.google.dev/docs)
- 💰 [Pricing](https://ai.google.dev/pricing)
- 📚 [Full Setup Guide](GEMINI_SETUP.md)
- 🧪 [Testing Guide](GEMINI_TESTING.md)

## Example Queries

```typescript
// Disaster safety
"What to do during an earthquake?"
"How to prepare for a hurricane?"
"Flood safety tips"

// Location-based
"What's happening in California?"
"Any disasters in New York today?"

// Platform help
"How do I report a disaster?"
"How does the map work?"

// Emergency info
"Emergency contacts list"
"What should be in emergency kit?"
```

## Monitoring

```typescript
// Check console logs:
[AI Service] Using provider: gemini
[Gemini] Processing message: "..."
[Gemini] Response received: "..."
// or
AI API failed, using fallback: [error details]
```

## Quick Troubleshooting

```powershell
# 1. Check if API key is set
cd backend
Get-Content .env | Select-String "GEMINI_API_KEY"

# 2. Test API key directly
$key = (Get-Content .env | Select-String "GEMINI_API_KEY").ToString().Split("=")[1]
Write-Host "Key: $key"

# 3. Restart backend
npm run dev

# 4. Test endpoint
$body = @{message="test"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

---

**Quick Start:** Get key → Add to .env → Restart → Test ✅
