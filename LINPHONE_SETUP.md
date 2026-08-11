# Linphone Setup for Day 6 Outbound Calls

Linphone is the **easiest, free way** to test Day 6 outbound calls. No signup required, no credits needed.

## Installation

### Windows
1. Download: https://www.linphone.org/
2. Choose "Linphone for Windows"
3. Run installer
4. Accept default settings
5. Launch Linphone

### macOS
1. Download: https://www.linphone.org/
2. Choose "Linphone for macOS"
3. Drag to Applications
4. Launch

### Linux
```bash
sudo apt install linphone  # Ubuntu/Debian
sudo dnf install linphone  # Fedora
```

## Initial Setup

1. **Open Linphone**
2. You'll see the settings wizard
3. Choose: "I'll use a SIP account"
4. Create a test account:
   - Username: `test123` (or any name)
   - Domain: `sipopen.orca.fr` (or any public SIP server)
   - Create account
5. Click "Done"

Now you're registered and ready to call.

## Running the Agent

### Terminal 1: Start the Agent
```bash
cd backend
uv run python src/agent.py dev
```

You'll see:
```
INFO:agent:Starting voice pipeline...
INFO:agent:Voice pipeline initialized successfully
```

### Terminal 2 (or same terminal, new tab): Check for SIP URL

Look at the output for something like:
```
SIP connection ready at sip://localhost:5060
```

If it says `localhost`, you'll call locally. Note the port.

## Making the Call from Linphone

### Local Call (if agent is on same machine)
1. In Linphone, the "Phone" field on the left
2. Type: `sip:agent@localhost:5060`
3. Press Enter or click the call button
4. Wait for agent to answer

### Remote Call (if agent is on different machine)
1. Type: `sip:agent@YOUR_IP:5060`
   - Replace `YOUR_IP` with your machine's IP
   - Find it: 
     - Windows: `ipconfig` (look for IPv4)
     - Mac/Linux: `ifconfig` (look for inet)

### Example
```
My machine IP: 192.168.1.100
In Linphone type: sip:agent@192.168.1.100:5060
```

## Recording the Call in Linphone

### Built-in Recording
1. During an active call, look for the record button (usually red circle)
2. Click to start recording
3. Click again to stop
4. Recording saved automatically

### Using OBS Studio (Better Quality)
1. Download OBS: https://obsproject.com/
2. Add Source → Screen Capture
3. Select Linphone window
4. Add Source → Audio Input Capture
5. Start Recording
6. Make the call in Linphone
7. Stop recording when done
8. File saved to ~/Videos/

## What You'll Hear

When you call, the agent will say:

> "Hello! I'm calling from FinAssist, your bank's financial assistant. I'm calling to remind you about an upcoming government scheme deadline that you might be eligible for. If this isn't a good time or if you'd prefer not to hear from us, just let me know."

Then it will:
1. Ask for your name
2. Save your name
3. Explain the scheme (Pradhan Mantri Awas Yojana)
4. Tell you the deadline (Aug 31, 2026)
5. Provide next steps
6. Ask if you have questions
7. Let you opt out if you want

## Troubleshooting

### "Can't connect to agent"
- Check agent is running (you should see logs)
- Try: `sip:agent@localhost:5060` (with actual port from logs)
- Check firewall isn't blocking port 5060

### "No audio from agent"
- Check Murf API key in `.env.local`
- Check system volume is on
- Try: `uv run python src/agent.py console` to test audio

### "Agent isn't speaking"
- Check GOOGLE_API_KEY is set (LLM)
- Check MURF_API_KEY is set (TTS)
- Check DEEPGRAM_API_KEY is set (STT)
- Restart agent: Stop and run `uv run python src/agent.py dev` again

### "I can't hear myself"
- That's normal - speaker phone doesn't echo back your own voice
- The agent can hear you fine
- Check the OBS recording has your voice (should be there)

## Recording Tips for LinkedIn

**What makes a good Day 6 video:**

✅ DO:
- Start recording BEFORE call rings
- Show caller ID or incoming notification
- Play audio clearly
- Let agent's opening play fully (most important part)
- ~15-30 seconds is perfect

❌ DON'T:
- Start recording after call is already connected
- Mute the agent's voice
- Cut off during opening
- Include personal info/numbers

**OBS Settings for best video:**
```
Resolution: 1920x1080 (or 1280x720)
FPS: 30
Bitrate: 5000 kbps
Audio: System Audio Capture
Format: MP4
```

## After Recording

1. **Export video** from OBS
   - File → Export Video
   - Save as MP4
   - Choose Desktop

2. **Upload to LinkedIn**
   - New post
   - Click image/video icon
   - Upload MP4
   - Add caption (see templates below)
   - Post!

## LinkedIn Caption Template

```
🎯 Day 6: Outbound Calls Complete

FinAssist just made its first outbound call! 

This agent calls users about the Pradhan Mantri Awas Yojana 
(housing scheme) with a deadline of August 31, 2026.

Key points:
✅ Agent identifies itself immediately 
✅ Explains why it's calling
✅ Provides easy opt-out

Built with Murf Falcon—the fastest TTS API ⚡—for natural voice, 
plus LiveKit Agents orchestration.

This is Day 6 of the #VoiceForBharat challenge.

@MurfAI #VoiceAI #FinTech #LiveKit
```

---

## Quick Timeline

- **Download Linphone:** 2 min
- **Setup SIP account:** 2 min  
- **Start agent:** 1 min
- **Make call & record:** 5 min
- **Post on LinkedIn:** 3 min

**Total: ~13 minutes to complete Day 6!**

---

## Next Steps

1. Install Linphone ✅
2. Start agent on Terminal: `uv run python src/agent.py dev`
3. Call from Linphone: `sip:agent@localhost:5060`
4. Record with OBS
5. Post on LinkedIn
6. Submit form

**That's it! You've completed Day 6.** 🎉
