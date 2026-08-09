import logging
import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path

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
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

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

FIRST GREETING (New Caller)
"Hello! I'm FinAssist, your Financial Services Voice Assistant. I can help with general banking information, digital banking guidance, card services, and security tips. How may I assist you today?"
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


if __name__ == "__main__":
    cli.run_app(server)
