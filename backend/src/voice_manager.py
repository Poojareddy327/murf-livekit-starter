"""
Voice Management Module
Handles multiple voices for different purposes in conversations
"""

from enum import Enum
from dataclasses import dataclass


class VoiceType(Enum):
    """Different voice types for different purposes"""
    GREETING = "greeting"
    EXPLANATION = "explanation"
    DEFAULT = "default"


@dataclass
class VoiceConfig:
    """Configuration for different voices"""
    voice_id: str
    name: str
    style: str
    description: str


class VoiceManager:
    """Manages multiple voice configurations for different contexts"""
    
    VOICES = {
        VoiceType.GREETING: VoiceConfig(
            voice_id="voice_greeting_01",
            name="Greeting Voice",
            style="Warm",
            description="Friendly and welcoming voice for initial greeting"
        ),
        VoiceType.EXPLANATION: VoiceConfig(
            voice_id="voice_explanation_01",
            name="Explanation Voice",
            style="Professional",
            description="Clear and professional voice for detailed explanations"
        ),
        VoiceType.DEFAULT: VoiceConfig(
            voice_id="voice_default_01",
            name="Default Voice",
            style="Neutral",
            description="Standard voice for general conversation"
        )
    }
    
    @classmethod
    def get_voice_config(cls, voice_type: VoiceType) -> VoiceConfig:
        """Get voice configuration for a specific type"""
        return cls.VOICES.get(voice_type, cls.VOICES[VoiceType.DEFAULT])
    
    @classmethod
    def get_voice_id(cls, voice_type: VoiceType) -> str:
        """Get voice ID for a specific type"""
        return cls.get_voice_config(voice_type).voice_id
    
    @classmethod
    def get_voice_style(cls, voice_type: VoiceType) -> str:
        """Get voice style for a specific type"""
        return cls.get_voice_config(voice_type).style
    
    @classmethod
    def is_greeting_context(cls, text: str) -> bool:
        """Determine if text is a greeting"""
        greeting_keywords = [
            "hello", "hi", "welcome", "greetings", "good morning",
            "good afternoon", "good evening", "namaste", "howdy"
        ]
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in greeting_keywords)
    
    @classmethod
    def is_explanation_context(cls, text: str) -> bool:
        """Determine if text is an explanation"""
        explanation_keywords = [
            "explain", "details", "information", "about", "describe",
            "requirements", "benefits", "eligibility", "process", "steps",
            "deadline", "application", "scheme", "program"
        ]
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in explanation_keywords)
    
    @classmethod
    def select_voice_for_text(cls, text: str) -> VoiceType:
        """Automatically select appropriate voice based on text content"""
        if cls.is_greeting_context(text):
            return VoiceType.GREETING
        elif cls.is_explanation_context(text):
            return VoiceType.EXPLANATION
        else:
            return VoiceType.DEFAULT
