# 🤖 Quick Start Guide - AI Auto Call & Replay

## ✅ What's New

Admin dashboard now has **AI-powered automatic calling** to follow up with disaster reporters!

## 🚀 Setup (5 minutes)

### Step 1: Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or login
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### Step 2: Configure Backend
1. Open `backend/.env` file
2. Replace this line:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```
   With your actual key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Save the file

### Step 3: Install Dependencies (if needed)
```bash
cd backend
npm install openai
```

### Step 4: Restart Server
```bash
# In backend directory
npm run dev
```

## 🎯 How to Use

### For Admins:

1. **Login to Admin Dashboard** at `/admin`

2. **Find a Disaster Alert** that needs follow-up

3. **Click "AI Auto Call & Replay"** button (purple button with robot icon)

4. **AI Starts Call Automatically**
   - AI introduces itself professionally
   - Mentions the specific disaster reported
   - Asks follow-up questions

5. **Type Your Responses**
   - AI will respond intelligently
   - AI voice will speak the responses
   - Full transcript is recorded

6. **End Call**
   - Click "End Call" button
   - AI generates automatic summary
   - Review transcript and summary

## 🎨 Features

✅ **Intelligent AI Conversations** - GPT-4 powered responses  
✅ **Natural Voice** - AI speaks using realistic voice  
✅ **Live Transcript** - See conversation in real-time  
✅ **Auto Summary** - Get key points after call  
✅ **Call Duration** - Track call time  
✅ **Mute Control** - Toggle audio playback  
✅ **Full Replay** - Review complete transcript  

## 💰 Cost

- Average call: $0.10 - $0.50
- OpenAI charges per API usage
- Monitor usage at [OpenAI Dashboard](https://platform.openai.com/usage)

## 🔧 Troubleshooting

**Problem**: "OpenAI API Error"  
**Fix**: Check your API key in `.env` file

**Problem**: "Audio not playing"  
**Fix**: Check browser audio permissions

**Problem**: "Cannot find module 'openai'"  
**Fix**: Run `npm install openai` in backend folder

## 📱 Demo Scenario

1. User reports "Earthquake" at location
2. Admin clicks "AI Auto Call"
3. AI: "Hello, this is the AI assistant from the emergency response team. I'm calling about the earthquake you reported at [location]. Can you provide more details about the current situation?"
4. Admin: "The situation is stable now, but we have 5 people who need medical attention"
5. AI: "Thank you for that information. I understand there are 5 people requiring medical attention. Can you tell me about the severity of their conditions and if there are any immediate life-threatening injuries?"
6. Conversation continues...
7. Call ends with summary:
   - 5 people need medical attention
   - No life-threatening injuries
   - Recommended: Send medical team
   - Status: Under control

## 🎓 Tips

- Use AI calls for follow-ups when photos aren't enough
- AI is context-aware about disaster type and location
- Transcript is saved for future reference
- Use summaries for quick situation overview

## 📞 Example Questions AI Asks

- Current situation status
- Number of people affected
- Immediate needs (medical, food, shelter)
- Safety concerns
- Infrastructure damage
- Access routes available
- Weather conditions

## 🔐 Security

- All calls require admin authentication
- Sessions are encrypted
- Transcripts stored securely
- API key never exposed to frontend

## 📄 Full Documentation

See `AI_CALL_FEATURE.md` for complete technical documentation.

---

**Note**: This feature requires an active OpenAI API key. First-time users get free credits!
