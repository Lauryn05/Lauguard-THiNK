from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os

# Path to the folder containing your model files
MODEL_DIR = os.path.dirname(__file__)

# Load tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)

# Return probability that input is adversarial (0.0 to 1.0)
def get_adversarial_prob(prompt: str) -> float:
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=1)
    
    # label 1 is 'adversarial', 0 is 'safe'
    adversarial_prob = probs[0][1].item()
    return adversarial_prob

# Return True/False if input is adversarial based on threshold
def is_adversarial(prompt: str, threshold: float = 0.5) -> bool:
    prob = get_adversarial_prob(prompt)
    return prob >= threshold
