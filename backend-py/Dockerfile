FROM python:3.10-slim

WORKDIR /app

# Copy only requirements first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code (including rl_agent, custom_adversarial_detector)
COPY . .

# Port that Flask runs on
EXPOSE 8000

# Command to run the Flask app
CMD ["python", "app.py"]