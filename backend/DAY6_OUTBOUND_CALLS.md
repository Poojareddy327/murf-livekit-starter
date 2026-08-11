# Day 6: Making Outbound Calls

## Overview
FinAssist now makes outbound calls to remind users about upcoming government banking scheme deadlines.

**Use Case:** Financial Services → Scheme deadline approaching for someone already found eligible

**Scheme:** Pradhan Mantri Awas Yojana (Housing scheme)
- **Deadline:** August 31, 2026
- **Target:** Middle-income families looking to build or upgrade their home

## Setup

### Option 1: Twilio (Recommended)

1. **Sign up for Twilio**
   - Go to https://www.twilio.com/console
   - Get your Account SID and Auth Token
   - Get a phone number (you can use the free trial)

2. **Update `.env.local`**
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio number
   ```

3. **Install Twilio SDK** (already in optional dependencies)
   ```bash
   uv sync
   ```

4. **Make the outbound call**
   ```bash
   uv run python src/agent.py outbound-call --phone +919876543210
   ```

### Option 2: Linphone (Free Alternative)

1. **Install Linphone**
   - Download from https://www.linphone.org/
   - Create a free SIP account

2. **Start the agent in dev mode**
   ```bash
   uv run python src/agent.py dev
   ```

3. **Call the agent manually from Linphone**
   - The agent will answer and deliver the reminder

### Option 3: LiveKit SIP Trunk

If you have a LiveKit deployment with SIP support:

1. **Configure your LiveKit SIP trunk**
2. **The agent will automatically handle incoming SIP calls**
3. **Calls are routed through `handle_outbound_call()` function**

## Agent Behavior

### Opening (Critical for Day 6)
The agent **must** follow this opening for outbound calls:

**First Sentence (Who is calling, why):**
> "Hello! I'm calling from FinAssist, your bank's financial assistant. I'm calling to remind you about an upcoming government scheme deadline that you might be eligible for."

**Second Sentence (How to opt-out):**
> "If this isn't a good time or if you'd prefer not to hear from us, just let me know."

### Call Flow
1. Agent delivers opening greeting
2. Asks for caller's name
3. Saves caller info to database
4. Explains the scheme: **Pradhan Mantri Awas Yojana**
   - Housing scheme for middle-income families
   - Application deadline: August 31, 2026
   - Benefits: Home loan subsidy up to 2.67 lakh rupees
5. Provides next steps
6. Asks if they have questions
7. Handles opt-out requests gracefully

## Recording for LinkedIn

1. **Set up screen recording software** (OBS Studio recommended - free)
   - Record both the phone ringing and the agent's audio
   - Capture from start (phone rings) to end (call disconnects)

2. **Keep it under 1 minute** for best engagement

3. **What to show:**
   - Phone ringing/incoming call notification
   - Agent speaking with agent name/number visible
   - Optional: Chat transcript or agent status

## LinkedIn Post Template

```
Day 6: Outbound Call - Scheme Reminder 📞

Building outbound capabilities for FinAssist! Today our voice agent 
made its first outbound call to remind users about the Pradhan Mantri 
Awas Yojana (housing scheme) deadline.

✨ Built with:
• Murf Falcon (fastest TTS API ⚡)
• LiveKit Agents for voice orchestration
• Deepgram Nova-3 for STT
• Google Gemini as LLM

🎯 The agent:
• Clearly identified itself in the first sentence
• Provided easy opt-out
• Delivered personalized scheme information
• Handled natural conversation

Part of #VoiceForBharat challenge with 10 Days of Voice Agents.
Pushing the boundaries of what's possible with voice AI.

@MurfAI #VoiceForBharat #VoiceAI #FinTech
```

## Testing

### Test locally with console
```bash
uv run python src/agent.py console
# Type your messages to test the scheme reminder logic
```

### Test with recording
1. Start agent: `uv run python src/agent.py dev`
2. Call from your phone/Linphone to test
3. Record the interaction
4. Post on LinkedIn

## Troubleshooting

### "Twilio credentials not found"
- Check `.env.local` has `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- Restart the agent

### "Call dropped immediately"
- Check LiveKit connectivity
- Verify SIP server is reachable
- Check logs: `uv run python src/agent.py dev --log-level debug`

### "Agent not speaking"
- Verify Murf API key is set
- Check Deepgram API key is set
- Ensure audio output is working

## Advanced: Outcome Handling

For production, implement:

1. **No Answer** → Retry after 1 hour
2. **Busy** → Queue for retry
3. **Voicemail** → Leave a message
4. **Immediate Hangup** → Log and don't retry (user opted out)
5. **Partial Conversation** → Save progress, retry if needed

See `OutboundReminder.handle_outcome()` for implementation hooks.

## Files Modified

- `backend/src/agent.py` - Added outbound handler and CLI command
- `backend/.env.example` - Added Twilio config
- `backend/DAY6_OUTBOUND_CALLS.md` - This file

## Next Steps (Day 7+)

- [ ] Multi-language outbound calls
- [ ] Schedule-based calling (call at user's preferred time)
- [ ] Outcome tracking and retry logic
- [ ] Integration with actual scheme APIs
- [ ] A/B test different opening scripts

---

**Remember:** The key to Day 6 is that first sentence—tell them WHO you are, WHY you're calling, and HOW to opt out. That's what makes outbound calls respectful and effective.
