import os
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)
key = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: '{key}'")
try:
    client = genai.Client(api_key=key)
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents="Say hi"
    )
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
