from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, os, traceback
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import torch
import numpy as np
from custom_adversarial_detector.detector import get_adversarial_prob
from rl_agent import RLAgent

STATE_SIZE = 385
ACTION_SIZE = 2
rl_agent = RLAgent(state_size=STATE_SIZE, action_size=ACTION_SIZE)

try:
    model_path = os.path.join(os.path.dirname(__file__), "rl_model.pth")
    rl_agent.policy_net.load_state_dict(torch.load(model_path, map_location="cpu"))
    rl_agent.policy_net.eval()
    print("RL model loaded successfully.")
except Exception as e:
    print(f"No RL weights found or loading error: {e}, starting fresh.")


load_dotenv()
API_KEY = os.getenv("AIMLAPI_KEY")
USE_INTERNAL = os.getenv("USE_INTERNAL", "false").lower() == "true"
USE_EXTERNAL = os.getenv("USE_EXTERNAL", "false").lower() == "true"
is_internal = USE_INTERNAL or not USE_EXTERNAL

host_key = "DB_HOST_INTERNAL" if is_internal else "DB_HOST_EXTERNAL"
port_key = "DB_PORT_INTERNAL" if is_internal else "DB_PORT_EXTERNAL"

db_host = os.getenv(host_key)
db_port = os.getenv(port_key)
db_name = os.getenv("DB_DATABASE", "postgres")
db_user = os.getenv("DB_USER", "postgres")
db_password = os.getenv("DB_PASSWORD")

# Fallback defaults (if not set)
if not db_host:
    db_host = "lab-laguarddb-ooomok" if is_internal else "your-dokploy-public-ip"
if not db_port:
    db_port = "5432" if is_internal else "5450"

# SSL – only if DB_SSL=true
if os.getenv("DB_SSL", "false").lower() == "true":
    ssl_params = {"sslmode": "require"}
else:
    ssl_params = {}

conn = psycopg2.connect(
    host=db_host,
    port=db_port,
    dbname=db_name,
    user=db_user,
    password=db_password,
    cursor_factory=RealDictCursor,
    **ssl_params
)
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])


def query_aimlapi(prompt: str) -> str:
    """Primary: AIML API"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "google/gemma-3n-e4b-it",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 50
    }
    response = requests.post(
        "https://api.aimlapi.com/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=30
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def query_local_llm(prompt: str) -> str:
    """Fallback 1: Local Ollama model"""
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma3:1b",
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.7, "max_tokens": 60}
            },
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "No response from local LLM")
    except Exception as e:
        return f"Local LLM unavailable: {e}"


def get_mock_response(prompt: str) -> str:
    """Fallback 2: Mock response"""
    mock_responses = [
        "The AI service is currently unavailable. Please try again shortly.",
        "I understand your request, but the system is under maintenance.",
        "Thank you for your message. The AI is temporarily overloaded.",
        "Your request has been received. Please try again in a few moments."
    ]
    return np.random.choice(mock_responses)


def get_llm_response_with_fallback(prompt: str) -> str:
    """
    Tries AIML API → Local Ollama → Mock Response
    """
    # Try AIML API
    try:
        print("[LLM] Trying AIML API...")
        response = query_aimlapi(prompt)
        print("[LLM] AIML API success.")
        return f"[AIML] {response}"
    except Exception as e:
        print(f"[LLM] AIML API failed: {e}")

    # Fallback to local Ollama
    try:
        print("[LLM] Falling back to local Ollama...")
        local_response = query_local_llm(prompt)
        if not any(keyword in local_response.lower() for keyword in ["unavailable", "error", "timeout", "refused"]):
            print("[LLM] Local Ollama success.")
            return f"[Local] {local_response}"
        else:
            print("[LLM] Local Ollama returned an error message.")
    except Exception as e:
        print(f"[LLM] Local Ollama failed: {e}")

    # Mock
    print("[LLM] Using mock response.")
    return get_mock_response(prompt)


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        prompt = data.get("message", "").strip()
        user_id = data.get("user_id", None)
        department_id = data.get("department_id", None)

        if not prompt:
            return jsonify({"error": "Message cannot be empty"}), 400

        # Step 1: Classification
        clf_prob = get_adversarial_prob(prompt)
        if clf_prob >= 0.9:
            severity = "high"
        elif clf_prob >= 0.8:
            severity = "medium"
        else:
            severity = "low"

        # Step 2: RL decision
        sbert_vector = np.zeros(300)
        state = np.append(sbert_vector, clf_prob)
        action = rl_agent.act(state)

        if clf_prob >= 0.9:
            severity = "high"
            status = "flagged"

        elif clf_prob >= 0.8:
            severity = "medium"
            status = "normal" if action == 1 else "flagged"

        elif clf_prob >= 0.5:
            severity = "low"
            status = "normal" if action == 1 else "flagged"

        else:
            severity = "low"
            status = "normal"
    
        response_text = "Blocked by filters"
        if status == "normal":
            response_text = get_llm_response_with_fallback(prompt)

        try:
            cur = conn.cursor()
            now = datetime.now()
            cur.execute("""
                INSERT INTO prompts_log 
                (prompt_text, created_date, created_time, user_id, department_id, rule_id, status, severity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                prompt,
                now.date(),
                now.time(),
                user_id,
                department_id,
                None,
                status,
                severity
            ))
            conn.commit()
            cur.close()
        except Exception as db_err:
            print("DB insert error:", db_err)
            traceback.print_exc()
            conn.rollback()

        return jsonify({
            "response": response_text,
            "status": status,
            "severity": severity,
            "adversarial_probability": float(clf_prob)
        }), 200

    except Exception as e:
        print("Unexpected error in /api/chat:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


@app.route('/health', methods=['GET'])
def health_check():
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


if __name__ == '__main__':
    print("Starting Flask server with LLM fallback chain...")
    app.run(port=8000, debug=True)
