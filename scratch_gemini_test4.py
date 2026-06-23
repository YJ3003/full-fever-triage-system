import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)
key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: '{key}'")
try:
    gemini_client = genai.Client(api_key=key.strip() if key else None)
except Exception as e:
    print("Init error:", e)
    gemini_client = None

async def generate_ai_explanation(risk_label: str, pat_label: str) -> str:
    if not gemini_client:
        return "AI reasoning unavailable. Please consult a doctor. (gemini_client is None)"
    prompt = f"Hi"
    try:
        def call_gemini():
            return gemini_client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt
            )
        response = await asyncio.to_thread(call_gemini)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return f"Explanation could not be generated. Error: {e}"

async def main():
    res = await generate_ai_explanation("High", "Dengue")
    print("Result:", res)

asyncio.run(main())
