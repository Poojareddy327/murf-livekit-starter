import os
import sys

from dotenv import load_dotenv
from murf import Murf

# Load environment variables from .env.local
load_dotenv(".env.local")


def convert_voice(file_path: str, voice_id: str = "Pooja") -> str:
    """Converts an input audio file to a target Murf voice using Murf Voice Changer API.

    Args:
        file_path: Path to the input audio file.
        voice_id: Target Murf voice ID (e.g., 'Pooja', 'Terrell', 'Anisha').

    Returns:
        str: URL of the converted audio file.
    """
    api_key = os.getenv("MURF_API_KEY")
    if not api_key:
        raise ValueError("MURF_API_KEY environment variable is not set")

    client = Murf(api_key=api_key)

    with open(file_path, "rb") as audio_file:
        response = client.voice_changer.convert(
            voice_id=voice_id,
            file=audio_file,
        )

    return getattr(response, "audio_file", str(response))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        target_voice = sys.argv[2] if len(sys.argv) > 2 else "Pooja"
        if os.path.exists(target_file):
            url = convert_voice(target_file, target_voice)
            print(f"Converted audio URL: {url}")
        else:
            print(f"Error: File not found: {target_file}")
    else:
        print("Usage: python src/voice_changer.py <path_to_audio_file> [voice_id]")
