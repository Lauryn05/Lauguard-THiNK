from flask import Flask, app, request, jsonify
from flask_cors import CORS
import requests, os, traceback
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import torch
import numpy as np
from rl_agent import RLAgent
from huggingface_hub import hf_hub_download, InferenceClient

load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")
hf_client = InferenceClient(
    api_key=HF_API_KEY
)
try:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    detector_model = AutoModelForSequenceClassification.from_pretrained("Carter345/lauguard-detector")
    detector_tokenizer = AutoTokenizer.from_pretrained("Carter345/lauguard-detector")
    def get_adversarial_prob(prompt):
        inputs = detector_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
        outputs = detector_model(**inputs)
        prob = torch.softmax(outputs.logits, dim=-1)[0][1].item()
        return prob
except Exception:
    from custom_adversarial_detector.detector import get_adversarial_prob

STATE_SIZE = 385
ACTION_SIZE = 2
try:
    rl_model_path = hf_hub_download("Carter345/lauguard-rl", "rl_model.pth")
    rl_agent = RLAgent(STATE_SIZE, ACTION_SIZE)
    rl_agent.policy_net.load_state_dict(torch.load(rl_model_path, map_location="cpu"))
    rl_agent.policy_net.eval()
except Exception:
    rl_agent = RLAgent(STATE_SIZE, ACTION_SIZE)
    try:
        rl_agent.policy_net.load_state_dict(torch.load("rl_model.pth", map_location="cpu"))
        rl_agent.policy_net.eval()
    except Exception:
        pass

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

if not db_host:
    db_host = "lab-laguarddb-ooomok" if is_internal else "your-dokploy-public-ip"
if not db_port:
    db_port = "5432" if is_internal else "5450"

ssl_params = {"sslmode": "require"} if os.getenv("DB_SSL", "false").lower() == "true" else {}

conn = psycopg2.connect(
    host=db_host,
    port=db_port,
    dbname=db_name,
    user=db_user,
    password=db_password,
    cursor_factory=RealDictCursor,
    **ssl_params
)

CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")])

def call_huggingface_model(prompt: str, model_id: str) -> str:
    try:
        response = hf_client.chat_completion(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=model_id,
            max_tokens=150,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Hugging Face error for {model_id}: {repr(e)}")
        raise
    
    
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        prompt = data.get("message", "").strip()
        user_id = data.get("user_id")
        department_id = data.get("department_id")
        model_id = data.get("model", "google/flan-t5-large")   # default model

        if not prompt:
            return jsonify({"error": "Message cannot be empty"}), 400

        # Step 1: Adversarial classification
        clf_prob = get_adversarial_prob(prompt)

        # Step 2: RL decision
        sbert_vector = np.zeros(300)
        state = np.append(sbert_vector, clf_prob)
        action = rl_agent.act(state)

        # Determine severity and status
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
            try:
                response_text = call_huggingface_model(prompt, model_id)
            except Exception as e:
                print(f"LLM error: {repr(e)}")
                response_text = "The selected AI model is currently unavailable. Please try another model."
                status = "flagged"
    
        # Log to database
        try:
            cur = conn.cursor()
            now = datetime.now()
            cur.execute("""
                INSERT INTO prompts_log 
                (prompt_text, created_date, created_time, user_id, department_id, rule_id, status, severity)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (prompt, now.date(), now.time(), user_id, department_id, None, status, severity))
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
        return jsonify({"status": "healthy", "database": "connected", "timestamp": datetime.now().isoformat()}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=False)   # debug=False to reduce logs; adjust if needed