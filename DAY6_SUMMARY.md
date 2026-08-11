# Day 6 Implementation: Outbound Calls for FinAssist

## What We Built

✅ **Outbound call capability** for FinAssist to make scheme reminder calls  
✅ **Critical opening script** - agent identifies itself, explains why, provides opt-out  
✅ **Scheme-specific messaging** - Pradhan Mantri Awas Yojana (deadline Aug 31, 2026)  
✅ **Three integration options** - Twilio, Linphone, LiveKit SIP  
✅ **Caller persistence** - saves caller info for future interactions  
✅ **Easy recording setup** - instructions for LinkedIn post  

## Key Files

### Modified
- **`backend/src/agent.py`**
  - Added Twilio import (optional)
  - Modified `SYSTEM_PROMPT` with outbound protocol
  - Added `handle_outbound_call()` function (SIP handler)
  - Added `outbound_call()` CLI command
  - Created `OutboundReminder` class with scheme-specific prompt

- **`backend/.env.example`**
  - Added Twilio configuration template

### New
- **`backend/DAY6_OUTBOUND_CALLS.md`**
  - Complete setup guide
  - Agent behavior documentation
  - Recording instructions
  - LinkedIn post template
  - Troubleshooting guide

## Critical Implementation Details

### 1. Opening Script (Non-negotiable for Day 6)
```
Agent: "Hello! I'm calling from FinAssist, your bank's financial 
assistant. I'm calling to remind you about an upcoming government 
scheme deadline that you might be eligible for. If this isn't a 
good time or if you'd prefer not to hear from us, just let me know."
```

**Why this matters:** Users didn't ask for this call, so they need to immediately know:
- WHO is calling (FinAssist)
- WHY (scheme reminder)
- HOW TO STOP IT (just say no)

### 2. Use Case Selection
**Track:** Financial Services  
**Trigger:** Scheme deadline approaching  
**Scheme:** Pradhan Mantri Awas Yojana  
**Deadline:** August 31, 2026  
**Eligibility:** Middle-income families  
**Benefit:** Home loan subsidy up to 2.67 lakh  

### 3. Integration Options

| Option | Cost | Setup | Best For |
|--------|------|-------|----------|
| Twilio | Free trial/$) | 5 min | Production demos |
| Linphone | Free | 10 min | Local testing |
| LiveKit SIP | Same as LiveKit | Config | Enterprise |

## How to Test

### Quick Test (Linphone)
```bash
# Terminal 1: Start agent
cd backend
uv run python src/agent.py dev

# Terminal 2 (or separate Linphone client)
# Call the agent from your Linphone account
```

### Full Test (Twilio)
```bash
cd backend

# Update .env.local with Twilio credentials, then:
uv run python src/agent.py outbound-call --phone +919876543210
```

### Console Test
```bash
cd backend
uv run python src/agent.py console
# Type: "hello" to trigger scheme reminder logic
```

## Recording Checklist

For your LinkedIn post:

- [ ] Phone rings/call notification visible
- [ ] Agent's opening statement plays (critical!)
- [ ] Conversation shows agent delivers scheme info
- [ ] Call completes or user opts out gracefully
- [ ] Under 1 minute total
- [ ] Good audio quality

**OBS Studio Setup:**
1. Record screen + system audio
2. Start recording before call rings
3. Stop after call ends or ~30 seconds of interaction
4. Export as MP4

## LinkedIn Post Checklist

Your post must include:

- [ ] Video of the call in action
- [ ] Mention "Murf Falcon (fastest TTS API)"
- [ ] Mention "10 Days of Voice Agents"
- [ ] Tag @MurfAI
- [ ] Hashtag #VoiceForBharat
- [ ] Brief description of what scheme you're reminding about
- [ ] Opening statement shown (who's calling, why, how to opt out)

**Example:**
```
Day 6: Outbound Calls Made ✅

FinAssist just placed its first outbound call to remind users 
about the Pradhan Mantri Awas Yojana deadline (Aug 31, 2026).

Built with Murf Falcon—the fastest TTS API ⚡—and livkit agents.

Key: The agent introduced itself in the first sentence, explained 
why it was calling, and provided an easy opt-out. That's what makes 
outbound respectful.

Part of #VoiceForBharat challenge (10 Days of Voice Agents).
@MurfAI

#VoiceAI #FinTech #CallCenter
```

## Recommended Voices

Per the challenge, for Indian context:
- **Anisha** (female, conversational)
- **Samar** (male, professional)
- **Pooja** (female, friendly)

Currently set to **Anisha** in agent.py.

## Submission Requirements

1. **LinkedIn post live** with video
2. **Post includes:**
   - Call video (phone ringing to agent speaking)
   - Proper credits (@MurfAI, Murf Falcon mention)
   - #VoiceForBharat hashtag
3. **Form submission** before 11:59 PM Aug 11 (details TBD)

## Next Steps for Production

1. **Outcome Handling**
   - No answer → retry after 1 hour
   - Voicemail → detect and leave message
   - Busy → queue for later
   - Immediate hang-up → don't retry

2. **Schedule Optimization**
   - Call during user's preferred hours
   - Avoid early morning/late night
   - Batch calls efficiently

3. **Personalization**
   - Reference previous scheme eligibility
   - Mention specific benefits they qualify for
   - Use caller's saved name

4. **Metrics**
   - Track call completion rate
   - Measure scheme applications from calls
   - Monitor opt-outs
   - Improve opening script based on data

---

## Troubleshooting Quick Links

- **Twilio not working?** → Check Account SID/Auth Token in `.env.local`
- **Agent not speaking?** → Verify Murf/Deepgram/Google API keys
- **Call drops?** → Check LiveKit URL and connectivity
- **No audio?** → Test `uv run python src/agent.py console` first

---

**Status:** ✅ Ready for Day 6 submission  
**Last Updated:** August 11, 2026  
**Track:** Financial Services  
**Deadline:** 11:59 PM August 11, 2026
