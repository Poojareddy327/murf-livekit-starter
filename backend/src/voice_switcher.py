"""
Voice Switcher Module
Handles switching between different voices during conversation
"""

from voice_manager import VoiceManager, VoiceType
import logging

logger = logging.getLogger("voice_switcher")


class VoiceSwitcher:
    """Handles dynamic voice switching based on conversation context"""
    
    def __init__(self):
        self.current_voice = VoiceType.DEFAULT
        self.voice_history = []
    
    def select_voice(self, text: str) -> str:
        """
        Select appropriate voice based on text content
        Returns voice configuration for the text
        """
        voice_type = VoiceManager.select_voice_for_text(text)
        self.current_voice = voice_type
        
        config = VoiceManager.get_voice_config(voice_type)
        logger.info(f"Switched to {config.name} for: {text[:50]}...")
        
        self.voice_history.append({
            "voice_type": voice_type,
            "text_preview": text[:100],
            "voice_id": config.voice_id
        })
        
        return config.voice_id
    
    def get_voice_style(self) -> str:
        """Get current voice style"""
        return VoiceManager.get_voice_style(self.current_voice)
    
    def reset(self):
        """Reset to default voice"""
        self.current_voice = VoiceType.DEFAULT
    
    def get_history(self) -> list:
        """Get voice switching history"""
        return self.voice_history
    
    def is_greeting_response(self, text: str) -> bool:
        """Check if response should use greeting voice"""
        return VoiceManager.is_greeting_context(text)
    
    def is_explanation_response(self, text: str) -> bool:
        """Check if response should use explanation voice"""
        return VoiceManager.is_explanation_context(text)


class MultiVoiceAgent:
    """Agent wrapper that supports multiple voices"""
    
    def __init__(self):
        self.voice_switcher = VoiceSwitcher()
        self.messages = []
    
    def process_greeting(self, greeting_text: str) -> dict:
        """Process greeting with appropriate voice"""
        voice_id = self.voice_switcher.select_voice(greeting_text)
        return {
            "text": greeting_text,
            "voice_id": voice_id,
            "voice_type": "greeting",
            "style": "warm"
        }
    
    def process_explanation(self, explanation_text: str) -> dict:
        """Process explanation with appropriate voice"""
        voice_id = self.voice_switcher.select_voice(explanation_text)
        return {
            "text": explanation_text,
            "voice_id": voice_id,
            "voice_type": "explanation",
            "style": "professional"
        }
    
    def process_message(self, text: str) -> dict:
        """Process any message with auto-detected voice"""
        voice_id = self.voice_switcher.select_voice(text)
        
        if self.voice_switcher.is_greeting_response(text):
            voice_type = "greeting"
            style = "warm"
        elif self.voice_switcher.is_explanation_response(text):
            voice_type = "explanation"
            style = "professional"
        else:
            voice_type = "default"
            style = "neutral"
        
        message = {
            "text": text,
            "voice_id": voice_id,
            "voice_type": voice_type,
            "style": style
        }
        
        self.messages.append(message)
        return message
