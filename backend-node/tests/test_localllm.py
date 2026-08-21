import requests

try:
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "gemma3:1b",
            "prompt": "Write a short haiku about AI.",
            "stream": False
        },
        timeout=60
    )
    print(response.json())
except Exception as e:
    print("Error calling Ollama:", e)
