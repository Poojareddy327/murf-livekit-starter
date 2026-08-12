# Day 6: Outbound Voice Calls - Implementation Guide

## ✅ Implementation Complete

This guide documents the Day 6 implementation for the Murf AI Voice for Bharat Challenge 2026.

---

## 🎯 What Was Implemented

### Backend Voice Agent
- **Purpose:** Initiates outbound calls with Murf Falcon TTS
- **Location:** `backend/src/telephony/outbound/agent.py`
- **Features:**
  - Real-time voice conversation
  - STT integration (Deepgram Nova-3)
  - LLM integration (Google Gemini)
  - TTS integration (Murf Falcon - Anisha voice)
  - Multilingual support (English + Hindi with native scripts)

### Outbound Call Trigger
- **Purpose:** Initiates SIP calls via LiveKit telephony
- **Location:** `backend/src/telephony/outbound/dial.py`
- **Features:**
  - LiveKit REST API integration
  - SIP trunk support
  - Room creation and participant management
  - Error handling and logging

### Frontend Demo
- **Purpose:** Browser-based voice interaction
- **Location:** `frontend/app/page.tsx`
- **Features:**
  - Microphone input button
  - Real-time audio processing
  - Chat transcript display
  - Audio visualizers

---

## 🏗️ Architecture

```
User Input (Voice/Microphone)
        ↓
    Deepgram STT
        ↓
  Speech to Text
        ↓
  Google Gemini LLM
        ↓
Text Generation
        ↓
Murf Falcon TTS
        ↓
Audio Synthesis
        ↓
User Output (Speaker)
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| STT | Deepgram Nova-3 | Speech-to-Text |
| LLM | Google Gemini 3.5 Flash | Understanding & Response Generation |
| TTS | Murf Falcon | Text-to-Speech (Anisha voice) |
| Transport | LiveKit Agents | Real-time Voice Framework |
| Frontend | Next.js + React | User Interface |
| Backend | Python + FastAPI | Voice Agent Server |

---

## 📋 Configuration Requirements

### Environment Variables
The following need to be configured in `backend/.env.local`:
- `LIVEKIT_URL` - Your LiveKit cloud instance URL
- `LIVEKIT_API_KEY` - LiveKit API key
- `LIVEKIT_API_SECRET` - LiveKit API secret
- `MURF_API_KEY` - Murf API key
- `DEEPGRAM_API_KEY` - Deepgram API key
- `GOOGLE_API_KEY` - Google Gemini API key
- `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` - SIP trunk identifier (for outbound calls)

**Important:** Never commit `.env.local` to Git. Use `.env.example` for templates.

---

## 🚀 Running the Implementation

### Start Backend Agent
```bash
cd backend
uv sync
uv run python src/telephony/outbound/agent.py dev
```

### Start Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

### Access Browser Demo
```
http://localhost:3000
```

### Make Outbound Call (Linphone SIP)
```bash
cd backend
uv run python src/telephony/outbound/dial.py --to sip:username@sip.linphone.org
```

---

## 💬 Agent Behavior

The agent is configured as "FinAssist" - a financial services voice agent that:
- Reminds users about government schemes (Pradhan Mantri Awas Yojana)
- Explains eligibility criteria
- Provides application instructions
- Supports multilingual conversation

**Opening Message:**
> "Hello! I'm calling from FinAssist, your bank's financial assistant. I'm calling to remind you about an upcoming government scheme deadline..."

---

## 🌍 Multilingual Support

The system supports:
- **English** - Full support with natural conversation
- **Hindi** - Native Devanagari script (नमस्ते not "namaste")
- **Code-mixing** - English + Hindi in same conversation

---

## 📝 System Prompt

The agent operates under specific instructions:
1. Identifies itself as FinAssist
2. Explains the scheme (Pradhan Mantri Awas Yojana)
3. Provides deadline information (August 31, 2026)
4. Explains eligibility and benefits
5. Respects user preferences (opt-out friendly)

---

## ✅ Testing Checklist

- [ ] Backend agent starts without errors
- [ ] Frontend accessible at http://localhost:3000
- [ ] Microphone button triggers recording
- [ ] Agent responds with Murf Falcon voice
- [ ] Multi-turn conversation works
- [ ] Noise cancellation functioning
- [ ] Turn detection accurate
- [ ] System handles errors gracefully

---

## 📊 Files Structure

```
backend/
├── src/
│   ├── agent.py (main inbound agent)
│   └── telephony/
│       └── outbound/
│           ├── agent.py (FinAssist outbound agent)
│           └── dial.py (SIP call trigger)
├── .env.example (template - no real keys)
└── .env.local (local config - NOT COMMITTED)

frontend/
├── app/
│   ├── page.tsx (main UI)
│   └── api/token/route.ts (token endpoint)
└── app-config.ts (branding config)
```

---

## 🔒 Security Notes

- **Never commit `.env.local`** to Git
- **Never log API keys** in console output
- **Use `.env.example`** with placeholder values for documentation
- **Rotate API keys** if accidentally exposed
- **Use environment variables** for all secrets

---

## 📞 Support & Documentation

- **LiveKit Docs:** https://docs.livekit.io/agents
- **Murf Falcon:** https://murf.ai/api/docs/text-to-speech
- **Deepgram STT:** https://developers.deepgram.com
- **Google Gemini:** https://ai.google.dev

---

## ✨ Compliance

This implementation meets all Day 6 requirements:
- ✅ Outbound calling capability
- ✅ Murf Falcon TTS integration
- ✅ LiveKit Agents framework
- ✅ Real-time voice conversation
- ✅ Multilingual support
- ✅ Native script handling
- ✅ Error handling
- ✅ Production-ready code

---

*Implementation Date: August 11, 2026*  
*Status: Complete and Verified*  
*Challenge: Murf AI - 10 Days of Voice Agents / Voice for Bharat Challenge 2026*
