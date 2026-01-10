# Testing Gemini AI Integration

## Quick Test

1. **Set up your API key:**
   ```bash
   cd smart-disaster-hub/backend
   echo "GEMINI_API_KEY=your_actual_api_key_here" >> .env
   ```

2. **Start the backend:**
   ```bash
   npm run dev
   ```

3. **Test via API:**
   ```bash
   # Using curl (PowerShell)
   $headers = @{"Content-Type"="application/json"}
   $body = @{message="What should I do during an earthquake?"} | ConvertTo-Json
   Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" -Method POST -Headers $headers -Body $body
   ```

## Expected Behavior

### With Gemini API Key
- **Provider:** Gemini
- **Response:** Natural, conversational AI responses
- **Example:**
  ```
  Question: "What should I do during an earthquake?"
  
  Answer: "During an earthquake, immediately Drop, Cover, and Hold On. 
  Get under a sturdy desk or table, protect your head and neck, and stay 
  put until the shaking stops. If you're outdoors, move away from buildings, 
  trees, and power lines..."
  ```

### Without API Key (Fallback)
- **Provider:** Fallback
- **Response:** Rule-based structured responses
- **Example:**
  ```
  Question: "What should I do during an earthquake?"
  
  Answer: "**Earthquake Safety Guidelines:**
  🏠 **During an earthquake:**
  • Drop, Cover, and Hold On immediately
  • Stay away from windows and heavy objects..."
  ```

## Testing in the Frontend

1. **Open the application:**
   ```
   http://localhost:5173
   ```

2. **Navigate to AI Chat:**
   - Look for the chat/AI assistant feature
   - Or click on the chat icon in the navigation

3. **Test queries:**
   - "What should I do during an earthquake?"
   - "How do I prepare an emergency kit?"
   - "What's happening in New York?"
   - "Tell me about flood safety"

## Verifying Which Provider is Active

Check the console output when the backend starts:

```bash
# With Gemini API key
[AI Service] Initialized with provider: gemini

# Without API key (fallback)
[AI Service] Initialized with provider: fallback
```

## Testing the Fallback Mechanism

1. **Set an invalid API key:**
   ```env
   GEMINI_API_KEY=invalid_key_test
   ```

2. **Start the backend and send a message**

3. **Check the logs:**
   ```
   AI API failed, using fallback: [Error details]
   [AI Fallback] Received message: "..."
   [AI Fallback] Sending response: "..."
   ```

## Sample Test Queries

### General Disaster Questions
- "What are the types of natural disasters?"
- "How can I stay safe during emergencies?"
- "What should be in my emergency kit?"

### Specific Disaster Types
- "What should I do during an earthquake?"
- "How do I prepare for a hurricane?"
- "What are flood safety tips?"
- "Tell me about wildfire evacuation"

### Location-Based Queries
- "What disasters are happening in California?"
- "Are there any alerts in New York today?"
- "What's the situation in Florida?"

### Platform Help
- "How do I report a disaster?"
- "How does the map work?"
- "How do I mark myself as safe?"

## Troubleshooting

### Issue: No response from AI
**Check:**
1. Is the backend running? (`npm run dev`)
2. Is MongoDB connected?
3. Check backend console for errors

### Issue: Getting fallback responses despite having API key
**Check:**
1. Is `GEMINI_API_KEY` set in `.env`?
2. Is the key valid? Test in [AI Studio](https://aistudio.google.com/)
3. Check rate limits (15 req/min for free tier)

### Issue: "Failed to process your message"
**Possible causes:**
1. Network connectivity issues
2. Gemini API service down
3. Rate limit exceeded
4. Invalid API key format

**Solution:** The system should automatically fall back to rule-based responses

## Performance Testing

### Response Times
- **Gemini:** ~1-3 seconds (depends on network)
- **Fallback:** <100ms (instant)

### Rate Limiting
Free tier limits:
- 15 requests per minute
- 1,500 requests per day

To test rate limits:
```bash
# Send 20 requests quickly
for ($i=1; $i -le 20; $i++) {
  Write-Host "Request $i"
  $body = @{message="Test message $i"} | ConvertTo-Json
  Invoke-RestMethod -Uri "http://localhost:3000/api/ai/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
}
```

## Monitoring

### Check Gemini API Usage
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Go to your API keys section
3. View usage statistics

### Backend Logs
Watch for these log patterns:
```
[AI Service] Initialized with provider: gemini
[Gemini] Sending message to AI...
[Gemini] Received response
AI API failed, using fallback: [error]
```

## Next Steps

Once integration is verified:
1. ✅ Test various disaster-related queries
2. ✅ Verify fallback mechanism works
3. ✅ Check response quality and accuracy
4. ✅ Monitor API usage and rate limits
5. ✅ Consider implementing caching for common queries
6. ✅ Add conversation history (optional)
7. ✅ Implement user feedback mechanism
