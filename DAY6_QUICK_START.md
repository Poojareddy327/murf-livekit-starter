# Day 6 Quick Start - Make Your First Outbound Call

## 5-Minute Setup

### Step 1: Choose Your Method

**Option A: Linphone (Easiest for testing)**
- Free, no signup needed
- Perfect for recording demo
- Works anywhere

**Option B: Twilio (Best for production)**
- Free trial available
- Professional setup
- Easy recording

### Step 2: Install & Configure

#### Linphone Path
```bash
# 1. Download Linphone: https://www.linphone.org/
# 2. Create a free SIP account during setup
# 3. Add to your system

# 4. Start agent
cd backend
uv run python src/agent.py dev

# 5. From Linphone, call: agent@localhost or your SIP URL
```

#### Twilio Path
```bash
# 1. Go to https://www.twilio.com/console
# 2. Note your: Account SID, Auth Token, Phone Number

# 3. Add to backend/.env.local
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# 4. Install SDK (usually already there)
cd backend
uv sync

# 5. Make the call
uv run python src/agent.py outbound-call --phone +919876543210
```

### Step 3: Record the Call

Use OBS Studio (free):
1. Download: https://obsproject.com/
2. Add Source → Screen Capture (or specific window)
3. Add Source → Audio Input Capture (or System Audio)
4. Click "Start Recording"
5. Make/take the call
6. Click "Stop Recording"
7. Video saved to ~/Videos/ by default

### Step 4: Post on LinkedIn

**Minimum requirements:**
- 10-second video of phone ringing + agent speaking
- Text mentioning Murf Falcon, 10 Days of Voice Agents
- Tag @MurfAI
- Hashtag #VoiceForBharat

**Copy-paste template:**
```
🎉 Day 6 Complete: FinAssist making outbound calls!

Our voice agent just called to remind users about 
Pradhan Mantri Awas Yojana (housing scheme deadline Aug 31).

Built with:
✨ Murf Falcon - fastest TTS API
🎙️ LiveKit Agents  
🧠 Google Gemini
👂 Deepgram STT

The opening is critical: agent identifies itself, explains why, 
and gives easy opt-out. That's what makes outbound respectful.

#VoiceForBharat @MurfAI
```

### Step 5: Submit Form

Form link will be shared by 9 AM on Aug 11.

---

## Testing the Agent

### Before you record, test locally:

```bash
cd backend

# Option 1: Console test (no phone needed)
uv run python src/agent.py console
# Type: "hello"
# Agent should deliver scheme reminder

# Option 2: Full dev mode
uv run python src/agent.py dev
# Then call from phone/Linphone to see full interaction
```

---

## What the Agent Says (Exact Script)

**Opening (Non-negotiable):**
> "Hello! I'm calling from FinAssist, your bank's financial assistant. I'm calling to remind you about an upcoming government scheme deadline that you might be eligible for. If this isn't a good time or if you'd prefer not to hear from us, just let me know."

**Then:**
- Asks for your name
- Saves it to database
- Explains Pradhan Mantri Awas Yojana
- Provides deadline and eligibility info
- Gives next steps
- Handles opt-out request

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "Phone number required" | Use: `--phone +919876543210` |
| "No audio from agent" | Check Murf API key in `.env.local` |
| "Call won't connect" | Verify LiveKit URL is correct |
| "Agent keeps saying opening" | It's testing mode - let it complete |

---

## Final Checklist Before Posting

- [ ] Call video recorded (phone ring to agent speaking)
- [ ] Audio is clear
- [ ] Agent says opening correctly
- [ ] Under 1 minute
- [ ] LinkedIn post has:
  - [ ] "Murf Falcon" mentioned
  - [ ] "10 Days of Voice Agents"
  - [ ] @MurfAI tag
  - [ ] #VoiceForBharat hashtag
- [ ] Post link saved for form submission

---

## Support Resources

- **Linphone Help:** https://www.linphone.org/
- **Twilio Docs:** https://www.twilio.com/docs/
- **LiveKit Docs:** https://docs.livekit.io/
- **Murf Docs:** https://murf.ai/api/docs/

---

**You've got this! 🎤💪**

Remember: The goal is to show an AI agent making a real phone call, identifying itself immediately, and delivering valuable information. That's Day 6 done.
