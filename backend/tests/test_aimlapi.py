import requests
import os
from dotenv import load_dotenv
import traceback

# Load .env variables
load_dotenv()
AIMLAPI_KEY = os.getenv("AIMLAPI_KEY")

def call_aiml(prompt: str, model: str):
    headers = {
        "Authorization": f"Bearer {AIMLAPI_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200
    }

    response = requests.post(
        "https://api.aimlapi.com/v1/chat/completions",
        headers=headers, json=payload
    )
    return response

def test_aiml(prompt: str):
    model = "google/gemma-3n-e4b-it"

    try:
        print(f"\n🔎 Trying AIML model: {model}")
        response = call_aiml(prompt, model)
        print("Status Code:", response.status_code)
        print("Response Body:", response.text)

        if response.status_code == 200:
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            print(f"🤖 AIML Response from {model}:", reply)
        else:
            print(f"⚠️ AIML model {model} returned an error.")
    except Exception as e:
        print(f"🚨 Error with AIML API:", e)
        traceback.print_exc()

# Example usage
test_aiml("What's the capital of Kenya?")
