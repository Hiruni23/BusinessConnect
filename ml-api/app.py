from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import random

app = Flask(__name__)
CORS(app)

@app.route('/evaluate-startup', methods=['POST'])
def evaluate_startup():
    data = request.json
    # Dummy evaluation logic for demo
    score = random.randint(75, 98)
    return jsonify({
        "score": score,
        "recommendation": "Highly Recommended" if score > 85 else "Promising"
    })

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    data = request.json
    # Dummy risk logic for demo
    return jsonify({
        "riskScore": random.randint(10, 40),
        "riskLevel": "Low"
    })

@app.route('/detect-fraud', methods=['POST'])
def detect_fraud():
    data = request.json
    # Dummy fraud detection
    return jsonify({
        "isFraud": False,
        "alerts": ["No suspicious activity detected", "Verified Identity"]
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
