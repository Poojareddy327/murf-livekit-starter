import logging
import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path
import os

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    tokenize,
    room_io,
    SIP,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Twilio imports (optional - for outbound calls)
try:
    from twilio.rest import Client as TwilioClient
    HAS_TWILIO = True
except ImportError:
    HAS_TWILIO = False

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Database setup
DB_PATH = Path(__file__).parent.parent / "data" / "callers.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def init_db():
    """Initialize the database with caller table."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS callers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            language_preference TEXT DEFAULT 'en',
            facts TEXT DEFAULT '{}',
            last_interaction TEXT,
            created_at TEXT,
            updated_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def get_caller_from_db(caller_id: str):
    """Retrieve a caller from the database."""
    try:
        init_db()
        logger.info(f"Looking up caller: {caller_id}")
        
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM callers WHERE id = ?", (caller_id,))
        row = cursor.fetchone()
        conn.close()
        
        logger.info(f"Lookup result: {'Found' if row else 'Not found'}")

        if row:
            result = {
                "user_id": row["id"],
                "name": row["name"],
                "language_preference": row["language_preference"],
                "facts": json.loads(row["facts"]),
                "last_interaction": row["last_interaction"],
            }
            logger.info(f"Returning caller data: {result}")
            return result
        return None
    except Exception as e:
        logger.error(f"Error looking up caller: {e}", exc_info=True)
        return None


def save_caller_to_db(caller_id: str, name: str, facts: dict, language: str = "en"):
    """Save or update a caller in the database."""
    try:
        init_db()
        logger.info(f"Attempting to save caller {caller_id}: {name}")
        
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        facts_json = json.dumps(facts)

        cursor.execute("SELECT id FROM callers WHERE id = ?", (caller_id,))
        exists = cursor.fetchone() is not None
        logger.info(f"Caller exists: {exists}")

        if exists:
            logger.info(f"Updating existing caller: {caller_id}")
            cursor.execute(
                """
                UPDATE callers
                SET name = ?, language_preference = ?, facts = ?, last_interaction = ?, updated_at = ?
                WHERE id = ?
                """,
                (name, language, facts_json, now, now, caller_id),
            )
        else:
            logger.info(f"Inserting new caller: {caller_id}")
            cursor.execute(
                """
                INSERT INTO callers (id, name, language_preference, facts, last_interaction, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (caller_id, name, language, facts_json, now, now, now),
            )

        conn.commit()
        logger.info(f"Successfully committed to database")
        conn.close()
        logger.info(f"Database connection closed")
        return True
    except Exception as e:
        logger.error(f"Error saving caller: {e}", exc_info=True)
        return False


def delete_caller_from_db(caller_id: str):
    """Delete a caller from the database."""
    init_db()
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        cursor.execute("DELETE FROM callers WHERE id = ?", (caller_id,))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error deleting caller: {e}")
        return False


# Wrapper functions for the tools
def get_caller(caller_id: str):
    """Wrapper for get_caller_from_db."""
    return get_caller_from_db(caller_id)


def save_caller(caller_id: str, name: str, facts: dict, language: str = "en"):
    """Wrapper for save_caller_to_db."""
    return save_caller_to_db(caller_id, name, facts, language)


def forget_me(caller_id: str):
    """Wrapper for delete_caller_from_db."""
    return delete_caller_from_db(caller_id)


SYSTEM_PROMPT = """
IDENTITY
You are FinAssist, a friendly and professional Financial Services Voice Agent working for a trusted bank.
You help customers with general banking information, digital banking guidance, card services, loan information, UPI guidance, and banking security awareness.
You are an AI assistant and not a human representative.

OUTBOUND CALL PROTOCOL
When making an outbound call (user did NOT call you):
- FIRST SENTENCE: Clearly state who is calling and why.
  Example: "Hello! I'm calling from FinAssist, your bank's financial assistant. I'm calling to remind you about an upcoming government scheme deadline that you might be eligible for."
- SECOND SENTENCE: Give the user control - how to opt out.
  Example: "If this isn't a good time or if you'd prefer not to hear from us, just let me know and I can call you back later."
- Then proceed naturally with your purpose.

OBJECTIVES
A successful conversation should:
1. Help users understand banking services and processes.
2. Guide users with general banking questions such as password reset, card blocking, UPI issues, and loan information.
3. Escalate account-specific or sensitive issues to the bank's official customer support.

KNOWLEDGE
You can answer questions about:
- Savings and current accounts
- Debit and credit cards
- UPI payments
- Internet and mobile banking
- Loan basics
- Banking security best practices
- Government banking schemes and eligibility

You cannot access:
- Customer accounts
- Account balances
- Transaction history
- Loan approval status
- Personal banking records

LANGUAGE & SCRIPT
Always write every language in its own native script.
- Hindi → Devanagari (नमस्ते), never romanized (never "namaste").
- Same rule for all non-English languages.
Mirror the user's language when responding.
If the user speaks English, reply in English.
If the user mixes Hindi and English, reply in the same code-mixed style.
Keep responses short, natural, and suitable for voice conversations.

CALLER MEMORY & GREETING
You have access to caller lookup and save functions.

FIRST THING - ALWAYS lookup the caller:
1. At the very start of conversation, call lookup_caller()
2. If found, greet them: "Hello [name]! Last time we spoke about [topic]. How can I help today?"
3. If not found, check if user_name is available in context
4. If user_name is available, greet: "Hello [user_name]! It's great to hear from you again."
5. If no information, greet normally

WHEN USER ASKS "DO YOU REMEMBER MY NAME?":
1. Call the get_user_name() tool to check if a name is available
2. The tool will return the appropriate message based on whether a name is saved
3. Respond naturally to the user with the result
1. When the caller tells you their name, you MUST:
   - Say: "I'd like to remember your name for next time. Can I save it?"
   - WAIT for them to say yes
   - When they agree, CALL save_caller_info() with their name
2. Do NOT save without asking first
3. Do NOT save without their permission

SAVING INFORMATION:
- Use the save_caller_info() function to save caller's name and facts
- Format: name="John", facts='{"preference": "value"}'
- Only call this function after getting explicit permission

SCHEME ELIGIBILITY CHECKING
When users ask about banking schemes, government benefits, or "what schemes am I eligible for":
1. Gather information about their profile:
   - Age (if relevant)
   - Income level ("low", "middle", or "high")
   - Employment type ("student", "salaried", "self_employed", "retired")
2. Call check_scheme_eligibility() with the information they've shared
3. Present the results naturally - don't read raw data, explain benefits in simple language
4. Always mention that data is current as of August 2026
5. If API fails or times out, say: "I'm having trouble checking schemes right now. Please contact your bank directly or visit their website for the latest information."

GUARDRAILS - MEMORY & PRIVACY
Never ask for or accept:
- OTP, PIN, Password, CVV, Full account number
- Account balance or transaction details
- Loan approval status or personal financial records

Never save:
- Account numbers or sensitive account details
- Written-out medical notes (Health Access track)
- Full personally identifiable information beyond name and ID

Always get explicit consent before saving anything.
For Financial Services and Health Access tracks: consent is mandatory before saving.

GUARDRAILS - GENERAL
Never claim:
- You can access customer accounts.
- You approved a loan.
- A payment has succeeded.
- You checked account balances or transactions.

If the user requests account-specific actions or shares sensitive information, politely refuse and say:
"For your security, I can't access or process sensitive banking information. Please contact your bank's official customer support or visit your nearest branch. Never share your OTP, PIN, password, or CVV with anyone."

STYLE
Be friendly, professional, calm, and concise.
Avoid long explanations.
Use simple conversational language.
Never use emojis or markdown formatting.

FIRST GREETING (New Caller - Inbound)
"Hello! I'm FinAssist, your Financial Services Voice Assistant. I can help with general banking information, digital banking guidance, card services, scheme eligibility, and security tips. How may I assist you today?"
"""


class Assistant(Agent):
    def __init__(self, caller_id: str, user_name: str | None = None) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.caller_id = caller_id
        self.caller_name = None
        self.user_name = user_name

    @function_tool
    async def lookup_caller(self, context: RunContext) -> str:
        """Look up a caller in the database to retrieve their information and history.

        Use this at the start of a call to check if you've spoken to this person before.
        If found, greet them by name and reference their last interaction.
        If not found but user_name is available, note that.

        Returns:
            A JSON string with caller information if found, or a message about the caller status.
        """
        try:
            logger.info(f"Looking up caller: {self.caller_id}")
            caller = get_caller(self.caller_id)
            if caller:
                self.caller_name = caller["name"]
                import json
                return json.dumps(
                    {
                        "found": True,
                        "message": f"Caller found: {caller['name']}. Last interaction: {caller['last_interaction']}. Facts: {caller['facts']}",
                        "caller": caller,
                    }
                )
            else:
                # If caller not found in DB but user_name is available from session
                if self.user_name:
                    import json
                    return json.dumps(
                        {
                            "found": False,
                            "user_name_available": True,
                            "user_name": self.user_name,
                            "message": f"New or returning caller. User name available from session: {self.user_name}",
                        }
                    )
                return '{"found": false, "message": "New caller - no previous record found."}'
        except Exception as e:
            logger.error(f"Error looking up caller: {e}", exc_info=True)
            return f'{{"found": false, "error": "Database lookup failed: {str(e)}"}}'

    @function_tool
    async def save_caller_info(
        self, context: RunContext, name: str, facts: str, language: str = "en"
    ) -> str:
        """Save caller information to remember them for next time.

        IMPORTANT: Always ask for permission first!
        Say something like: "I'd like to remember this for next time. Is that okay with you?"
        Only call this function if the caller agrees.

        Args:
            name: The caller's name
            facts: A JSON string of facts to remember (e.g., {"account_type": "savings", "interested_in": "loan"})
            language: Their language preference (default: 'en')

        Returns:
            Success or error message
        """
        try:
            logger.info(f"Saving caller info for: {self.caller_id}")

            import json
            facts_dict = json.loads(facts) if isinstance(facts, str) else facts
            success = save_caller(self.caller_id, name, facts_dict, language)

            if success:
                self.caller_name = name
                logger.info(f"Successfully saved {name}'s information")
                return f"Successfully saved {name}'s information for next time."
            else:
                logger.warning(f"Failed to save {name}'s information")
                return "Failed to save caller information. Please try again."
        except Exception as e:
            logger.error(f"Error saving caller: {e}", exc_info=True)
            return f"Error saving caller information: {str(e)}"

    @function_tool
    async def forget_me_tool(self, context: RunContext) -> str:
        """Delete all saved information about this caller.

        Use this if the caller asks you to forget them or delete their data.

        Returns:
            Success or error message
        """
        try:
            logger.info(f"Deleting caller: {self.caller_id}")
            success = forget_me(self.caller_id)
            if success:
                logger.info(f"Successfully deleted caller: {self.caller_id}")
                return "Your information has been deleted. Your profile is now cleared from our system."
            else:
                logger.warning(f"Failed to delete caller: {self.caller_id}")
                return "Failed to delete your information. Please try again."
        except Exception as e:
            logger.error(f"Error deleting caller: {e}", exc_info=True)
            return f"Error deleting caller information: {str(e)}"

    @function_tool
    async def get_user_name(self, context: RunContext) -> str:
        """Get the user's name if it was provided at session start.

        Use this to check if we have the user's name available from their saved preferences.

        Returns:
            The user's name if available, or a message indicating no name is saved.
        """
        try:
            if self.user_name:
                logger.info(f"User name available: {self.user_name}")
                return f"Yes, I have your name saved. Your name is {self.user_name}."
            else:
                logger.info("No user name available")
                return "I don't have a saved name for you."
        except Exception as e:
            logger.error(f"Error retrieving user name: {e}", exc_info=True)
            return "I couldn't retrieve your saved name."

    @function_tool
    async def check_scheme_eligibility(
        self, context: RunContext, age: int = None, income_level: str = None, employment_type: str = None
    ) -> str:
        """Check banking scheme eligibility based on user profile.
        
        This tool fetches relevant government and bank schemes the user might qualify for.
        Data is based on current 2026 scheme guidelines from Indian banking sector.
        
        Args:
            age: User's age (optional)
            income_level: Income range - 'low', 'middle', 'high' (optional)
            employment_type: 'student', 'salaried', 'self_employed', 'retired' (optional)
        
        Returns:
            A natural language summary of eligible schemes with key benefits.
        """
        try:
            logger.info(f"Checking scheme eligibility for age={age}, income={income_level}, employment={employment_type}")
            
            # Eligibility matrix based on user profile
            eligible_schemes = []
            
            # Basic scheme for everyone
            eligible_schemes.append({
                "name": "Basic Savings Account",
                "benefit": "Zero balance account with free digital banking",
                "requirement": "Open to all Indian residents"
            })
            
            # Age-based schemes
            if age is not None:
                if age < 18:
                    eligible_schemes.append({
                        "name": "Sukanya Samriddhi Yojana",
                        "benefit": "High interest rate savings for girls, tax benefits",
                        "requirement": "Girls under 10 years old"
                    })
                elif 18 <= age <= 60:
                    eligible_schemes.append({
                        "name": "Pradhan Mantri Jan Dhan Yojana",
                        "benefit": "Free life insurance of 30,000 rupees, overdraft facility",
                        "requirement": "Indian citizens 18-60 years"
                    })
                    eligible_schemes.append({
                        "name": "Pradhan Mantri Suraksha Bima Yojana",
                        "benefit": "Accident insurance for 2 lakh rupees at just 12 rupees per year",
                        "requirement": "Age 18-70 years with active bank account"
                    })
                elif age > 60:
                    eligible_schemes.append({
                        "name": "Senior Citizen Savings Scheme",
                        "benefit": "Higher interest rates on deposits, tax benefits",
                        "requirement": "Citizens aged 60 and above"
                    })
            
            # Income-based schemes
            if income_level == "low":
                eligible_schemes.append({
                    "name": "Pradhan Mantri Mudra Yojana",
                    "benefit": "Unsecured loans up to 10 lakh rupees for small business",
                    "requirement": "Self-employed and entrepreneurs with low income"
                })
            elif income_level == "middle":
                eligible_schemes.append({
                    "name": "Pradhan Mantri Awas Yojana",
                    "benefit": "Home loan subsidy up to 2.67 lakh rupees",
                    "requirement": "Middle-income families"
                })
            
            # Employment-based schemes
            if employment_type == "student":
                eligible_schemes.append({
                    "name": "Student Scholarship Account",
                    "benefit": "Special savings account with educational benefits and low fees",
                    "requirement": "Full-time students with valid ID"
                })
            elif employment_type == "salaried":
                eligible_schemes.append({
                    "name": "Salary Account Benefits",
                    "benefit": "Competitive overdraft limits, cashback on transactions",
                    "requirement": "Salaried individuals with monthly deposits"
                })
            elif employment_type == "self_employed":
                eligible_schemes.append({
                    "name": "Business Loan Schemes",
                    "benefit": "Collateral-free loans up to 50 lakh rupees",
                    "requirement": "Self-employed with business registration"
                })
            
            if not eligible_schemes:
                return "I couldn't determine your eligibility without more information. Please share your age, income level, or employment type so I can suggest suitable schemes."
            
            # Format response naturally
            response = "Based on your profile, you may be eligible for these banking schemes:\n\n"
            for i, scheme in enumerate(eligible_schemes, 1):
                response += f"{i}. {scheme['name']}: {scheme['benefit']}. "
            
            response += "\nFor detailed information and to apply, please visit your bank's website or contact your nearest branch. All data is current as of August 2026."
            
            logger.info(f"Returning {len(eligible_schemes)} eligible schemes")
            return response
            
        except Exception as e:
            logger.error(f"Error checking scheme eligibility: {e}", exc_info=True)
            return "I'm unable to check scheme eligibility at the moment. Please contact your bank directly for information about available schemes."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Initialize database early
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)

    # Use FIXED caller ID so all calls use the same database record
    # Everyone will be identified as 'voice_user_default'
    caller_id = "voice_user_default"
    logger.info(f"Agent session started with caller_id: {caller_id}")

    try:
        # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
        logger.info("Initializing voice pipeline...")
        
        # Extract user_name from participant metadata if available
        user_name = None
        try:
            # Get participants from the room
            participants = ctx.room.participants
            for participant in participants.values():
                if participant.identity != "agent":
                    # Try to extract user_name from participant metadata
                    if participant.metadata:
                        try:
                            metadata = json.loads(participant.metadata)
                            user_name = metadata.get("user_name")
                            if user_name:
                                logger.info(f"Extracted user_name from participant: {user_name}")
                                break
                        except Exception as e:
                            logger.warning(f"Failed to parse participant metadata: {e}")
        except Exception as e:
            logger.warning(f"Error extracting user_name from participants: {e}")
        
        session = AgentSession(
            stt=deepgram.STT(model="nova-3", language="multi"),
            llm=google.LLM(
                model="gemini-3.5-flash-lite",
            ),
            tts=murf.TTS(
                voice="Anisha",
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True,
            ),
            turn_detection=MultilingualModel(),
            vad=ctx.proc.userdata["vad"],
            preemptive_generation=True,
        )
        logger.info("Voice pipeline initialized successfully")

        # Start the session, which initializes the voice pipeline and warms up the models
        logger.info("Starting agent session...")
        await session.start(
            agent=Assistant(caller_id=caller_id, user_name=user_name),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind
                        == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
            ),
        )
        logger.info("Agent session started")

        # Join the room and connect to the user
        logger.info("Connecting to room...")
        await ctx.connect()
        logger.info("Connected to room")
    except Exception as e:
        logger.error(f"Error in agent session: {e}", exc_info=True)
        raise


# ============= OUTBOUND CALL HANDLER =============
@server.sip_inbound(
    name="outbound-call",
    application="outbound_reminder",
)
async def handle_outbound_call(ctx: JobContext, sip_session: SIP.InboundSession):
    """
    Handles outbound reminder calls.
    
    This is called when an outbound SIP connection is established.
    The agent will deliver a scheme deadline reminder.
    """
    logger.info(f"Outbound call connected: {sip_session}")
    
    caller_id = f"outbound_{sip_session.call_id}"
    
    try:
        init_db()
        logger.info("Database initialized for outbound call")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
    
    try:
        logger.info("Initializing voice pipeline for outbound call...")
        
        # Create outbound-specific agent with reminder prompt
        class OutboundReminder(Assistant):
            def __init__(self, caller_id: str):
                # Modified system prompt for outbound calls
                outbound_prompt = SYSTEM_PROMPT + """

OUTBOUND REMINDER: SCHEME DEADLINE
You are making an outbound call to remind the user about an upcoming scheme deadline.

YOUR OPENING (CRITICAL):
1. First sentence: "Hello! I'm calling from FinAssist, your bank's financial assistant. I'm calling to remind you about an upcoming government scheme deadline that you might be eligible for."
2. Second sentence: "If this isn't a good time or if you'd prefer not to hear from us, just let me know."
3. Then ask: "May I have your name to personalize this reminder?"
4. Once you have their name, call save_caller_info() to save it
5. Then provide details about the scheme deadline: Pradhan Mantri Awas Yojana (Housing scheme), application deadline is August 31, 2026
6. Explain they may be eligible if they have a middle income and are looking to build or upgrade their home
7. Provide next steps: "You can apply online at pmayuclap.gov.in or visit your nearest bank branch for more information."
8. Ask if they have any questions about the scheme
9. If they want to opt out from future calls, help them with that using the forget_me_tool()
"""
                super().__init__(instructions=outbound_prompt)
                self.caller_id = caller_id
        
        session = AgentSession(
            stt=deepgram.STT(model="nova-3", language="multi"),
            llm=google.LLM(
                model="gemini-3.5-flash-lite",
            ),
            tts=murf.TTS(
                voice="Anisha",
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True,
            ),
            turn_detection=MultilingualModel(),
            vad=ctx.proc.userdata["vad"],
            preemptive_generation=True,
        )
        logger.info("Voice pipeline initialized for outbound call")
        
        # Start the session with SIP
        logger.info("Starting outbound agent session...")
        await session.start(
            agent=OutboundReminder(caller_id=caller_id),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind
                        == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
            ),
        )
        logger.info("Outbound agent session started")
        
        await ctx.connect()
        logger.info("Connected to outbound call")
        
    except Exception as e:
        logger.error(f"Error in outbound call: {e}", exc_info=True)
        raise


# CLI command for making outbound calls
@cli.command(
    arg_parser=lambda parser: [
        parser.add_argument("--phone", type=str, help="Phone number to call (e.g., +1234567890)"),
        parser.add_argument("--livekit-url", type=str, help="LiveKit URL"),
        parser.add_argument("--livekit-key", type=str, help="LiveKit API Key"),
        parser.add_argument("--livekit-secret", type=str, help="LiveKit API Secret"),
        parser.add_argument("--sip-server", type=str, default="localhost", help="SIP server address"),
        parser.add_argument("--sip-port", type=int, default=5060, help="SIP server port"),
    ],
)
async def outbound_call(phone: str, livekit_url: str, livekit_key: str, livekit_secret: str, sip_server: str, sip_port: int):
    """Make an outbound call to remind the user about a scheme deadline."""
    if not phone:
        print("Error: Phone number is required. Use --phone +1234567890")
        return
    
    if not all([livekit_url, livekit_key, livekit_secret]):
        # Fall back to environment variables
        livekit_url = os.getenv("LIVEKIT_URL")
        livekit_key = os.getenv("LIVEKIT_API_KEY")
        livekit_secret = os.getenv("LIVEKIT_API_SECRET")
        
        if not all([livekit_url, livekit_key, livekit_secret]):
            print("Error: LiveKit credentials required. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET")
            return
    
    logger.info(f"Initiating outbound call to {phone}")
    logger.info(f"SIP Server: {sip_server}:{sip_port}")
    
    # For now, we'll print instructions on how to make the outbound call
    print(f"""
╔════════════════════════════════════════════════════════════╗
║           OUTBOUND CALL INSTRUCTIONS (Day 6)              ║
╚════════════════════════════════════════════════════════════╝

Phone Number: {phone}
Scheme Reminder: Pradhan Mantri Awas Yojana (Housing Scheme)
Deadline: August 31, 2026

IMPORTANT: This is Day 6 of Voice For Bharat Challenge.

To make the outbound call, you have two options:

OPTION 1: Using Twilio (Recommended if you have a Twilio account)
─────────────────────────────────────────────────────────
1. Ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in .env.local
2. This command will initiate the call to {phone}
3. Your agent will deliver the scheme reminder

OPTION 2: Using Linphone (Free alternative)
─────────────────────────────────────────────────────────
1. Install Linphone: https://www.linphone.org/
2. Register a SIP account
3. Manually call the agent from your Linphone client
4. The agent will greet you and deliver the reminder

OPTION 3: LiveKit SIP Trunk (Enterprise option)
─────────────────────────────────────────────────────────
1. Configure a SIP trunk in your LiveKit deployment
2. The agent will handle incoming SIP connections
3. Record the call for your Day 6 LinkedIn post

Next steps:
- Record the phone ringing and agent speaking
- Post the video on LinkedIn mentioning:
  - "Building with Murf Falcon (fastest TTS)"
  - "10 Days of Voice Agents challenge"
  - Tag @MurfAI
  - Use #VoiceForBharat

╚════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    cli.run_app(server)
