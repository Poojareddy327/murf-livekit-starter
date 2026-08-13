import json
import logging
import os
import random
import re
import sqlite3
import urllib.error
import urllib.request
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
    room_io,
    tokenize,
)

try:
    from livekit.agents import sip
except ImportError:
    sip = None
from livekit.plugins import stt, llm, tts, noise_cancellation, vad
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Optional telephony imports
try:
    from telephony.rest import Client as TelephonyClient
    HAS_TELEPHONY = True
except ImportError:
    HAS_TELEPHONY = False

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Database setup
DB_PATH = Path(__file__).parent.parent / "data" / "callers.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def init_db():
    """Initialize the database with caller, escalation, and call log tables."""
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
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS escalations (
            id TEXT PRIMARY KEY,
            caller_id TEXT NOT NULL,
            caller_name TEXT NOT NULL,
            category TEXT NOT NULL,
            summary TEXT NOT NULL,
            agent_actions TEXT,
            urgency TEXT DEFAULT 'medium',
            language TEXT DEFAULT 'en',
            preferred_followup TEXT DEFAULT 'phone',
            status TEXT DEFAULT 'open',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS calls (
            id TEXT PRIMARY KEY,
            room_name TEXT NOT NULL,
            caller_id TEXT NOT NULL,
            caller_name TEXT DEFAULT 'Anonymous Caller',
            track TEXT DEFAULT 'Financial Services',
            status TEXT NOT NULL,
            outcome_reason TEXT NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT NOT NULL,
            duration_seconds INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()

    # Seed sample call analytics data if table is empty
    cursor.execute("SELECT COUNT(*) FROM calls")
    count = cursor.fetchone()[0]
    if count == 0:
        seed_sample_calls(cursor)
        conn.commit()

    conn.close()


def seed_sample_calls(cursor):
    """Seed initial sample call logs for Financial Services track analytics demonstration."""
    sample_calls = [
        (
            "call_sample_01",
            "room_fin_01",
            "voice_user_default",
            "Pooja Sharma",
            "Financial Services",
            "success",
            "Completed scheme eligibility check (PM Awas Yojana)",
            "2026-08-13T09:15:00",
            "2026-08-13T09:17:15",
            135,
        ),
        (
            "call_sample_02",
            "room_fin_02",
            "usr_rajesh_92",
            "Rajesh Kumar",
            "Financial Services",
            "success",
            "Created human escalation request (ESC-84920 - Fraud alert)",
            "2026-08-13T10:30:00",
            "2026-08-13T10:32:45",
            165,
        ),
        (
            "call_sample_03",
            "room_fin_03",
            "usr_ananya_41",
            "Ananya Patel",
            "Financial Services",
            "success",
            "Provided digital banking & UPI security guidance",
            "2026-08-13T11:05:00",
            "2026-08-13T11:06:30",
            90,
        ),
        (
            "call_sample_04",
            "room_fin_04",
            "usr_vikram_18",
            "Vikram Singh",
            "Financial Services",
            "failed",
            "Call disconnected before completing inquiry",
            "2026-08-13T12:10:00",
            "2026-08-13T12:10:25",
            25,
        ),
        (
            "call_sample_05",
            "room_fin_05",
            "usr_priya_63",
            "Priya Nair",
            "Financial Services",
            "success",
            "Completed scheme eligibility check (PM Jeevan Jyoti Bima)",
            "2026-08-13T13:40:00",
            "2026-08-13T13:42:10",
            130,
        ),
        (
            "call_sample_06",
            "room_fin_06",
            "usr_amit_07",
            "Amit Verma",
            "Financial Services",
            "failed",
            "Caller declined consent for saving details",
            "2026-08-13T14:20:00",
            "2026-08-13T14:20:40",
            40,
        ),
        (
            "call_sample_07",
            "room_fin_07",
            "voice_user_default",
            "Pooja Sharma",
            "Financial Services",
            "success",
            "Saved caller memory & preferred communication language",
            "2026-08-13T15:15:00",
            "2026-08-13T15:16:40",
            100,
        ),
        (
            "call_sample_08",
            "room_fin_08",
            "usr_suresh_55",
            "Suresh Joshi",
            "Financial Services",
            "success",
            "Created human escalation request (ESC-91024 - Card block)",
            "2026-08-13T16:00:00",
            "2026-08-13T16:02:50",
            170,
        ),
        (
            "call_sample_09",
            "room_fin_09",
            "usr_kavita_33",
            "Kavita Mehta",
            "Financial Services",
            "success",
            "Completed scheme eligibility check (Sukanya Samriddhi)",
            "2026-08-13T17:10:00",
            "2026-08-13T17:12:00",
            120,
        ),
        (
            "call_sample_10",
            "room_fin_10",
            "usr_unknown_12",
            "Anonymous Caller",
            "Financial Services",
            "failed",
            "Call dropped due to network issue",
            "2026-08-13T18:05:00",
            "2026-08-13T18:05:15",
            15,
        ),
    ]
    cursor.executemany(
        """
        INSERT INTO calls (id, room_name, caller_id, caller_name, track, status, outcome_reason, started_at, ended_at, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        sample_calls,
    )


def save_call_log_to_db(
    call_id: str,
    room_name: str,
    caller_id: str,
    caller_name: str,
    status: str,
    outcome_reason: str,
    started_at: str,
    ended_at: str,
    duration_seconds: int,
    track: str = "Financial Services",
) -> bool:
    """Save or update a call outcome record in SQLite."""
    try:
        init_db()
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO calls (id, room_name, caller_id, caller_name, track, status, outcome_reason, started_at, ended_at, duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status,
                outcome_reason=excluded.outcome_reason,
                ended_at=excluded.ended_at,
                duration_seconds=excluded.duration_seconds
            """,
            (
                call_id,
                room_name,
                caller_id,
                caller_name or "Anonymous Caller",
                track,
                status,
                outcome_reason,
                started_at,
                ended_at,
                duration_seconds,
            ),
        )
        conn.commit()
        conn.close()
        logger.info(f"Call log saved to DB: {call_id} [{status}] - {outcome_reason}")
        return True
    except Exception as e:
        logger.error(f"Error saving call log to DB: {e}", exc_info=True)
        return False


def get_analytics_summary_from_db():
    """Retrieve call metrics summary from SQLite database."""
    try:
        init_db()
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as total FROM calls")
        total_calls = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as success FROM calls WHERE status = 'success'")
        successful_calls = cursor.fetchone()["success"]

        cursor.execute("SELECT COUNT(*) as failed FROM calls WHERE status = 'failed'")
        failed_calls = cursor.fetchone()["failed"]

        cursor.execute("SELECT AVG(duration_seconds) as avg_dur FROM calls")
        avg_row = cursor.fetchone()
        avg_duration = (
            round(avg_row["avg_dur"], 1) if avg_row and avg_row["avg_dur"] else 0.0
        )

        cursor.execute("SELECT * FROM calls ORDER BY started_at DESC LIMIT 50")
        rows = cursor.fetchall()
        calls = [dict(r) for r in rows]

        conn.close()

        success_rate = (
            round((successful_calls / total_calls * 100), 1) if total_calls > 0 else 0.0
        )

        return {
            "total_calls": total_calls,
            "successful_calls": successful_calls,
            "failed_calls": failed_calls,
            "success_rate": success_rate,
            "avg_duration": avg_duration,
            "track": "Financial Services",
            "calls": calls,
        }
    except Exception as e:
        logger.error(f"Error fetching analytics summary: {e}", exc_info=True)
        return {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "success_rate": 0.0,
            "avg_duration": 0.0,
            "track": "Financial Services",
            "calls": [],
        }


def sanitize_sensitive_info(text: str) -> str:
    """Sanitize sensitive PII such as 16-digit card/account numbers, PINs, OTPs, CVVs, and passwords."""
    if not text:
        return ""
    # Mask 16-digit credit card or account numbers (with optional spaces or hyphens)
    text = re.sub(
        r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[REDACTED ACCOUNT/CARD]", text
    )
    # Mask 10 to 18 digit account numbers
    text = re.sub(r"\b\d{10,18}\b", "[REDACTED ACCOUNT]", text)
    # Mask OTP, PIN, CVV, Password declarations (case-insensitive)
    text = re.sub(
        r"(?i)\b(otp|pin|cvv|password|passcode)[:\s=]*[A-Za-z0-9@#$%^&*]{3,10}\b",
        r"\1: [REDACTED]",
        text,
    )
    # Mask standalone 4 to 6 digit numbers preceded by keywords
    text = re.sub(
        r"(?i)\b(code|pin|otp|cvv)\s+(\d{3,6})\b",
        r"\1 [REDACTED]",
        text,
    )
    return text


def get_open_escalation_for_caller(caller_id: str, category: str):
    """Retrieve an existing open escalation for a caller in the same category."""
    try:
        init_db()
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM escalations
            WHERE caller_id = ? AND category = ? AND status = 'open'
            ORDER BY created_at DESC LIMIT 1
            """,
            (caller_id, category),
        )
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        logger.error(f"Error fetching open escalation: {e}")
        return None


def save_escalation_to_db(
    escalation_id: str,
    caller_id: str,
    caller_name: str,
    category: str,
    summary: str,
    agent_actions: str,
    urgency: str = "medium",
    language: str = "en",
    preferred_followup: str = "phone",
) -> bool:
    """Save a new human escalation request to the database."""
    try:
        init_db()
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute(
            """
            INSERT INTO escalations (
                id, caller_id, caller_name, category, summary, agent_actions,
                urgency, language, preferred_followup, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
            """,
            (
                escalation_id,
                caller_id,
                caller_name,
                category,
                summary,
                agent_actions,
                urgency,
                language,
                preferred_followup,
                now,
                now,
            ),
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error saving escalation: {e}", exc_info=True)
        return False


def update_escalation_in_db(
    escalation_id: str,
    additional_summary: str,
    additional_actions: str,
    new_urgency: str = "medium",
) -> bool:
    """Update an existing open escalation request to prevent duplicates."""
    try:
        init_db()
        conn = sqlite3.connect(str(DB_PATH), timeout=5.0)
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        cursor.execute(
            "SELECT summary, agent_actions, urgency FROM escalations WHERE id = ?",
            (escalation_id,),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            return False

        old_summary, old_actions, old_urgency = row[0], row[1], row[2]

        urgency_levels = {"low": 1, "medium": 2, "high": 3, "emergency": 4}
        merged_urgency = (
            new_urgency
            if urgency_levels.get(new_urgency, 2) > urgency_levels.get(old_urgency, 2)
            else old_urgency
        )

        merged_summary = f"{old_summary} | Update: {additional_summary}"
        merged_actions = f"{old_actions} | Update: {additional_actions}"

        cursor.execute(
            """
            UPDATE escalations
            SET summary = ?, agent_actions = ?, urgency = ?, updated_at = ?
            WHERE id = ?
            """,
            (merged_summary, merged_actions, merged_urgency, now, escalation_id),
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error updating escalation: {e}", exc_info=True)
        return False


def send_webhook_notification(escalation_data: dict):
    """Send an optional webhook notification to Discord or external URL."""
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL") or os.getenv(
        "ESCALATION_WEBHOOK_URL"
    )
    if not webhook_url:
        logger.info("No webhook URL configured; skipping external notification.")
        return

    try:
        payload = {
            "content": f"🚨 **New Human Escalation [{escalation_data['id']}]**\n"
            f"**Caller**: {escalation_data['caller_name']} ({escalation_data['caller_id']})\n"
            f"**Category**: {escalation_data['category']} | **Urgency**: {escalation_data['urgency'].upper()}\n"
            f"**Language**: {escalation_data['language']} | **Follow-up**: {escalation_data['preferred_followup']}\n"
            f"**Summary**: {escalation_data['summary']}\n"
            f"**Actions Taken**: {escalation_data['agent_actions']}"
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "FinAssist-Agent",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            logger.info(f"Webhook notification sent successfully: {response.status}")
    except Exception as e:
        logger.warning(f"Failed to send webhook notification: {e}")


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
        logger.info("Successfully committed to database")
        conn.close()
        logger.info("Database connection closed")
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

HUMAN ESCALATION PROTOCOL (DAY 7)
You must recognize situations when you CANNOT solve a problem on your own and MUST ask a human specialist for help.

WHEN TO ASK FOR HUMAN HELP (Trigger Scenarios):
1. FRAUD OR SECURITY ALERT: The caller reports possible fraud, stolen/lost debit or credit card, unauthorized account access, compromised credentials, or suspicious account activity. Set urgency='emergency' or 'high'.
2. UNRESOLVED TRANSACTION / PAYMENT DISPUTE: The caller reports a failed UPI/bank transfer where money was debited but recipient did not receive it, or an order/refund dispute requiring human intervention. Set urgency='high' or 'medium'.

MANDATORY STEP - ASK FOR PERMISSION FIRST:
Before creating an escalation request, you MUST explain to the caller why human assistance is required and ask for their explicit permission to share issue details.
Say something like: "For your security and to get this resolved, I need to create a support request for a human specialist. May I have your permission to share your name, contact preference, and a summary of this issue with our support team?"

DO NOT call create_escalation() without explicit permission!
- If the caller agrees (says yes / sure / ok) -> CALL create_escalation(permission_granted=True, ...)
- If the caller refuses (says no / don't share) -> DO NOT call create_escalation(). Politely say: "I understand. I won't create a support request. You can reach our official customer support line directly at 1800-123-4567."

SUMMARY & PRIVACY RULES:
- Never include sensitive financial numbers such as OTPs, PINs, Passwords, CVV, or full 16-digit card/account numbers.
- Keep summaries brief and professional: who needs help, what happened, what was checked, urgency level, language, and follow-up method.

EXPECTATION SETTING & REFERENCE ID:
When an escalation request is successfully created:
1. Provide the exact Reference ID returned by the tool (e.g. ESC-84920).
2. Give honest next steps: "Our human support team will review request ESC-84920 and follow up with you via phone within 24 to 48 business hours."
3. Do NOT promise immediate live transfer or instant call backs.

STYLE
Be friendly, professional, calm, and concise.
Avoid long explanations.
Use simple conversational language.
Never use emojis or markdown formatting.

FIRST GREETING (New Caller - Inbound)
"Hello! I'm FinAssist, your Financial Services Voice Assistant. I can help with general banking information, digital banking guidance, card services, scheme eligibility, and security tips. How may I assist you today?"
"""


class Assistant(Agent):
    def __init__(
        self, caller_id: str = "voice_user_default", user_name: str | None = None
    ) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.caller_id = caller_id
        self.caller_name = None
        self.user_name = user_name
        self.call_id = f"call_{uuid.uuid4().hex[:10]}"
        self.room_name = "room_live"
        self.started_at = datetime.now().isoformat()
        self.status = "failed"
        self.outcome_reason = (
            "Call ended before completing an eligibility check, inquiry, or escalation"
        )

    def mark_success(self, reason: str):
        """Mark the current call session as successful with a specific outcome reason."""
        self.status = "success"
        self.outcome_reason = reason
        logger.info(f"Call session {self.call_id} marked SUCCESS: {reason}")

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
            return f'{{"found": false, "error": "Database lookup failed: {e!s}"}}'

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
                self.mark_success(f"Saved caller profile & preferences ({name})")
                logger.info(f"Successfully saved {name}'s information")
                return f"Successfully saved {name}'s information for next time."
            else:
                logger.warning(f"Failed to save {name}'s information")
                return "Failed to save caller information. Please try again."
        except Exception as e:
            logger.error(f"Error saving caller: {e}", exc_info=True)
            return f"Error saving caller information: {e!s}"

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
            return f"Error deleting caller information: {e!s}"

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
        self,
        context: RunContext,
        age: int | None = None,
        income_level: str | None = None,
        employment_type: str | None = None,
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
            logger.info(
                f"Checking scheme eligibility for age={age}, income={income_level}, employment={employment_type}"
            )

            # Eligibility matrix based on user profile
            eligible_schemes = []

            # Basic scheme for everyone
            eligible_schemes.append(
                {
                    "name": "Basic Savings Account",
                    "benefit": "Zero balance account with free digital banking",
                    "requirement": "Open to all Indian residents",
                }
            )

            # Age-based schemes
            if age is not None:
                if age < 18:
                    eligible_schemes.append(
                        {
                            "name": "Sukanya Samriddhi Yojana",
                            "benefit": "High interest rate savings for girls, tax benefits",
                            "requirement": "Girls under 10 years old",
                        }
                    )
                elif 18 <= age <= 60:
                    eligible_schemes.append(
                        {
                            "name": "Pradhan Mantri Jan Dhan Yojana",
                            "benefit": "Free life insurance of 30,000 rupees, overdraft facility",
                            "requirement": "Indian citizens 18-60 years",
                        }
                    )
                    eligible_schemes.append(
                        {
                            "name": "Pradhan Mantri Suraksha Bima Yojana",
                            "benefit": "Accident insurance for 2 lakh rupees at just 12 rupees per year",
                            "requirement": "Age 18-70 years with active bank account",
                        }
                    )
                elif age > 60:
                    eligible_schemes.append(
                        {
                            "name": "Senior Citizen Savings Scheme",
                            "benefit": "Higher interest rates on deposits, tax benefits",
                            "requirement": "Citizens aged 60 and above",
                        }
                    )

            # Income-based schemes
            if income_level == "low":
                eligible_schemes.append(
                    {
                        "name": "Pradhan Mantri Mudra Yojana",
                        "benefit": "Unsecured loans up to 10 lakh rupees for small business",
                        "requirement": "Self-employed and entrepreneurs with low income",
                    }
                )
            elif income_level == "middle":
                eligible_schemes.append(
                    {
                        "name": "Pradhan Mantri Awas Yojana",
                        "benefit": "Home loan subsidy up to 2.67 lakh rupees",
                        "requirement": "Middle-income families",
                    }
                )

            # Employment-based schemes
            if employment_type == "student":
                eligible_schemes.append(
                    {
                        "name": "Student Scholarship Account",
                        "benefit": "Special savings account with educational benefits and low fees",
                        "requirement": "Full-time students with valid ID",
                    }
                )
            elif employment_type == "salaried":
                eligible_schemes.append(
                    {
                        "name": "Salary Account Benefits",
                        "benefit": "Competitive overdraft limits, cashback on transactions",
                        "requirement": "Salaried individuals with monthly deposits",
                    }
                )
            elif employment_type == "self_employed":
                eligible_schemes.append(
                    {
                        "name": "Business Loan Schemes",
                        "benefit": "Collateral-free loans up to 50 lakh rupees",
                        "requirement": "Self-employed with business registration",
                    }
                )

            if not eligible_schemes:
                return "I couldn't determine your eligibility without more information. Please share your age, income level, or employment type so I can suggest suitable schemes."

            # Mark call session as successful
            scheme_names = ", ".join([s["name"] for s in eligible_schemes[:2]])
            self.mark_success(f"Completed scheme eligibility check ({scheme_names})")

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

    @function_tool
    async def create_escalation(
        self,
        context: RunContext,
        category: str,
        issue_summary: str,
        agent_actions_taken: str,
        urgency: str = "medium",
        language: str = "en",
        preferred_followup: str = "phone",
        permission_granted: bool = True,
    ) -> str:
        """Create or update a human help escalation request when a problem cannot be resolved by the AI.

        CRITICAL REQUIREMENTS:
        1. Always ask the caller for explicit permission BEFORE calling this tool!
        2. If permission_granted is False, do NOT create the request.
        3. Never include passwords, OTPs, PINs, CVV, or full 16-digit card/account numbers in issue_summary or agent_actions_taken.

        Args:
            category: Reason category - 'fraud_security' or 'transaction_dispute'
            issue_summary: Brief description of the issue
            agent_actions_taken: What the agent checked or attempted
            urgency: Urgency level - 'low', 'medium', 'high', or 'emergency'
            language: Caller's language preference (e.g. 'en', 'hi')
            preferred_followup: Follow-up method ('phone', 'email', 'sms')
            permission_granted: True if caller gave consent to share info, False otherwise

        Returns:
            Confirmation string with Reference ID and next steps, or cancellation notice.
        """
        try:
            logger.info(
                f"create_escalation tool called for caller_id={self.caller_id}, permission={permission_granted}"
            )

            if not permission_granted:
                logger.info("Permission not granted by caller. Cancelling escalation.")
                return "Escalation request cancelled. Permission was not granted by the caller to share their information with support."

            # Sanitize inputs to remove sensitive info / PII
            clean_summary = sanitize_sensitive_info(issue_summary)
            clean_actions = sanitize_sensitive_info(agent_actions_taken)

            # Determine caller name
            caller_name = self.caller_name or self.user_name or "Valued Customer"

            # Check for existing open escalation to prevent duplicates
            existing = get_open_escalation_for_caller(self.caller_id, category)
            if existing:
                esc_id = existing["id"]
                logger.info(
                    f"Existing open escalation found: {esc_id}. Updating record."
                )
                success = update_escalation_in_db(
                    escalation_id=esc_id,
                    additional_summary=clean_summary,
                    additional_actions=clean_actions,
                    new_urgency=urgency,
                )
                if success:
                    return (
                        f"Updated existing support request {esc_id}. "
                        f"Urgency updated to {urgency.upper()}. "
                        f"Our human support team will contact you via {preferred_followup} within 24 to 48 hours."
                    )

            # Generate new Escalation Reference ID (e.g., ESC-84920)
            esc_id = f"ESC-{random.randint(10000, 99999)}"
            logger.info(f"Creating new escalation {esc_id} for {caller_name}")

            success = save_escalation_to_db(
                escalation_id=esc_id,
                caller_id=self.caller_id,
                caller_name=caller_name,
                category=category,
                summary=clean_summary,
                agent_actions=clean_actions,
                urgency=urgency,
                language=language,
                preferred_followup=preferred_followup,
            )

            if success:
                self.mark_success(
                    f"Created human escalation request ({esc_id} - {category})"
                )
                escalation_data = {
                    "id": esc_id,
                    "caller_id": self.caller_id,
                    "caller_name": caller_name,
                    "category": category,
                    "summary": clean_summary,
                    "agent_actions": clean_actions,
                    "urgency": urgency,
                    "language": language,
                    "preferred_followup": preferred_followup,
                }
                # Dispatch webhook notification if configured
                send_webhook_notification(escalation_data)

                return (
                    f"Human help request {esc_id} created successfully! "
                    f"Category: {category}. Urgency: {urgency.upper()}. "
                    f"A support specialist will review your request and contact you via {preferred_followup} within 24 to 48 business hours."
                )
            else:
                return "Failed to save escalation request due to a database error. Please call customer care directly."

        except Exception as e:
            logger.error(f"Error creating escalation request: {e}", exc_info=True)
            return f"Error creating escalation request: {e!s}"


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
        # Set up a voice AI pipeline with text-to-speech, speech-to-text, LLM, and turn detection
        logger.info("Initializing voice pipeline...")

        # Extract user_name from participant metadata if available
        user_name = None
        try:
            # Get participants from the room
            participants = ctx.room.remote_participants
            for participant in participants.values():
                if participant.identity != "agent":
                    # Try to extract user_name from participant metadata
                    if participant.metadata:
                        try:
                            metadata = json.loads(participant.metadata)
                            user_name = metadata.get("user_name")
                            if user_name:
                                logger.info(
                                    f"Extracted user_name from participant: {user_name}"
                                )
                                break
                        except Exception as e:
                            logger.warning(f"Failed to parse participant metadata: {e}")
        except Exception as e:
            logger.warning(f"Error extracting user_name from participants: {e}")

        session = AgentSession(
            stt=stt.STT(model="nova-3", language="multi"),
            llm=llm.LLM(
                model="flash-lite",
            ),
            tts=tts.TTS(
                voice="default",
                style="Conversation",
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True,
            ),
            turn_detection=MultilingualModel(),
            vad=ctx.proc.userdata["vad"],
            preemptive_generation=True,
        )
        logger.info("Voice pipeline initialized successfully")

        # Initialize agent instance and setup shutdown callback for analytics logging
        start_time = datetime.now()
        agent_instance = Assistant(caller_id=caller_id, user_name=user_name)
        agent_instance.room_name = ctx.room.name

        def log_call_completion():
            ended_at = datetime.now().isoformat()
            duration = max(1, int((datetime.now() - start_time).total_seconds()))
            save_call_log_to_db(
                call_id=agent_instance.call_id,
                room_name=agent_instance.room_name,
                caller_id=agent_instance.caller_id,
                caller_name=agent_instance.caller_name
                or user_name
                or "Anonymous Caller",
                status=agent_instance.status,
                outcome_reason=agent_instance.outcome_reason,
                started_at=agent_instance.started_at,
                ended_at=ended_at,
                duration_seconds=duration,
                track="Financial Services",
            )
            logger.info(
                f"Session {agent_instance.call_id} log finalized [{agent_instance.status}] - {agent_instance.outcome_reason}"
            )

        ctx.add_shutdown_callback(log_call_completion)

        # Start the session, which initializes the voice pipeline and warms up the models
        logger.info("Starting agent session...")
        await session.start(
            agent=agent_instance,
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
if hasattr(server, "sip_inbound"):

    @server.sip_inbound(
        name="outbound-call",
        application="outbound_reminder",
    )
    async def handle_outbound_call(ctx: JobContext, sip_session):
        """Handles outbound reminder calls."""
        logger.info(f"Outbound call connected: {sip_session}")
        caller_id = f"outbound_{getattr(sip_session, 'call_id', 'session')}"

        try:
            init_db()
            logger.info("Database initialized for outbound call")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}", exc_info=True)

        try:
            logger.info("Initializing voice pipeline for outbound call...")

            class OutboundReminder(Assistant):
                def __init__(self, caller_id: str):
                    outbound_prompt = (
                        SYSTEM_PROMPT
                        + """

OUTBOUND REMINDER: SCHEME DEADLINE
You are making an outbound call to remind the user about an upcoming scheme deadline.
"""
                    )
                    super().__init__(instructions=outbound_prompt)
                    self.caller_id = caller_id

            outbound_agent = OutboundReminder(caller_id=caller_id)
            outbound_agent.room_name = ctx.room.name
            outbound_start = datetime.now()

            def log_outbound_completion():
                ended_at = datetime.now().isoformat()
                duration = max(
                    1, int((datetime.now() - outbound_start).total_seconds())
                )
                save_call_log_to_db(
                    call_id=outbound_agent.call_id,
                    room_name=outbound_agent.room_name,
                    caller_id=outbound_agent.caller_id,
                    caller_name="Outbound Call Customer",
                    status=outbound_agent.status,
                    outcome_reason=outbound_agent.outcome_reason,
                    started_at=outbound_agent.started_at,
                    ended_at=ended_at,
                    duration_seconds=duration,
                    track="Financial Services",
                )

            ctx.add_shutdown_callback(log_outbound_completion)

            session = AgentSession(
                stt=stt.STT(model="nova-3", language="multi"),
                llm=llm.LLM(
                    model="flash-lite",
                ),
                tts=tts.TTS(
                    voice="default",
                    style="Conversation",
                    tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                    text_pacing=True,
                ),
                turn_detection=MultilingualModel(),
                vad=ctx.proc.userdata["vad"],
                preemptive_generation=True,
            )
            logger.info("Voice pipeline initialized for outbound call")

            await session.start(
                agent=outbound_agent,
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
            await ctx.connect()
            logger.info("Connected to outbound call")

        except Exception as e:
            logger.error(f"Error in outbound call: {e}", exc_info=True)
            raise


# CLI command helper for making outbound calls
async def outbound_call(
    phone: str = "",
    transport_url: str = "",
    transport_key: str = "",
    transport_secret: str = "",
    sip_server: str = "localhost",
    sip_port: int = 5060,
):
    """Make an outbound call to remind the user about a scheme deadline."""
    if not phone:
        print("Error: Phone number is required. Use --phone +1234567890")
        return

    if not all([transport_url, transport_key, transport_secret]):
        # Fall back to environment variables
        transport_url = os.getenv("TRANSPORT_URL")
        transport_key = os.getenv("TRANSPORT_API_KEY")
        transport_secret = os.getenv("TRANSPORT_API_SECRET")

        if not all([transport_url, transport_key, transport_secret]):
            print(
                "Error: Transport credentials required. Set TRANSPORT_URL, TRANSPORT_API_KEY, TRANSPORT_API_SECRET"
            )
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

To make the outbound call, you have two options:

OPTION 1: Using Telephony Service (Recommended if you have an account)
─────────────────────────────────────────────────────────
1. Ensure service credentials are set in .env.local
2. This command will initiate the call to {phone}
3. Your agent will deliver the scheme reminder

OPTION 2: Using SIP (Free alternative)
─────────────────────────────────────────────────────────
1. Install a SIP client
2. Register a SIP account
3. Manually call the agent from your client
4. The agent will greet you and deliver the reminder

OPTION 3: Using Real-time Transport (Enterprise option)
─────────────────────────────────────────────────────────
1. Configure transport in your deployment
2. The agent will handle incoming connections
3. Record the call for your submission

Next steps:
- Record the phone ringing and agent speaking
- Post the video with relevant tags and hashtags
- Follow challenge guidelines for submission

╚════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    cli.run_app(server)
