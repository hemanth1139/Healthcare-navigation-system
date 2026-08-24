"""
XGBoost Disease Prediction Engine.
Loads trained XGBoost model or creates/saves a dynamically initialized
one on first run for Python 3.13 compatibility.
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from xgboost import XGBClassifier

from app.config import settings

# Path to model artifacts
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))
MODEL_PATH = os.path.join(MODEL_DIR, "xgboost_model.pkl")
FEATURES_PATH = os.path.join(MODEL_DIR, "feature_list.pkl")
DISEASES_PATH = os.path.join(MODEL_DIR, "disease_list.pkl")

# Standard clinical features (symptoms) mapping to features
ALL_SYMPTOMS = [
    "fever", "headache", "chest_pain", "shortness_of_breath", "cough", 
    "fatigue", "nausea", "vomiting", "abdominal_pain", "dizziness",
    "neck_tightness", "sweating", "left_arm_radiation", "throat_irritation",
    "body_aches", "chills", "nasal_congestion", "loss_of_appetite"
]

ALL_DISEASES = [
    "Tension-Type Headache & Viral Syndrome",
    "Acute Coronary Syndrome",
    "Gastroesophageal Reflux Disease (GERD)",
    "Acute Bronchitis / Influenza",
    "Gastroenteritis",
]


def ensure_model_exists():
    """Initializes and trains a simple helper model if no trained artifact is found."""
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

    if not os.path.exists(MODEL_PATH):
        print("[INFO] XGBoost model artifact not found. Training a default clinical classifier...")
        
        # 1. Create a synthetic clinical dataset
        np.random.seed(42)
        n_samples = 200
        n_features = len(ALL_SYMPTOMS)
        
        # Random binary symptom vectors
        X = np.random.choice([0, 1], size=(n_samples, n_features), p=[0.75, 0.25])
        
        # Correlate specific symptoms to diseases
        y = []
        for row in X:
            # Let's map indexes for symptoms:
            # fever=0, headache=1, chest_pain=2, shortness_of_breath=3, cough=4
            # neck_tightness=10, sweating=11, left_arm_radiation=12
            if row[2] == 1 and row[12] == 1:  # Chest pain + Left arm radiation -> ACS
                y.append(1)
            elif row[1] == 1 and row[0] == 1:  # Headache + Fever -> Tension-Type Headache & Viral Syndrome
                y.append(0)
            elif row[8] == 1 and row[6] == 1:  # Abdominal pain + Nausea -> GERD
                y.append(2)
            elif row[4] == 1 and row[0] == 1:  # Cough + Fever -> Influenza
                y.append(3)
            elif row[6] == 1 and row[7] == 1:  # Nausea + Vomiting -> Gastroenteritis
                y.append(4)
            else:
                y.append(np.random.choice([0, 1, 2, 3, 4]))

        # Train model
        model = XGBClassifier(
            n_estimators=30,
            max_depth=3,
            learning_rate=0.1,
            random_state=42
        )
        model.fit(X, y)
        
        # Save model and features list
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model, f)
        with open(FEATURES_PATH, "wb") as f:
            pickle.dump(ALL_SYMPTOMS, f)
        with open(DISEASES_PATH, "wb") as f:
            pickle.dump(ALL_DISEASES, f)
        print("[SUCCESS] XGBoost default clinical model trained and saved successfully!")


class XGBoostPredictor:
    def __init__(self):
        ensure_model_exists()
        
        # Load artifacts
        with open(MODEL_PATH, "rb") as f:
            self.model: XGBClassifier = pickle.load(f)
        with open(FEATURES_PATH, "rb") as f:
            self.features: List[str] = pickle.load(f)
        with open(DISEASES_PATH, "rb") as f:
            self.diseases: List[str] = pickle.load(f)

    def symptoms_to_vector(self, user_symptoms: List[str]) -> np.ndarray:
        """Converts user-entered text symptoms to a binary feature vector."""
        vector = np.zeros(len(self.features))
        
        # Standardize inputs
        user_symptoms_lower = [s.lower().replace(" ", "_") for s in user_symptoms]
        
        for idx, feature in enumerate(self.features):
            # Check for keyword matches in user inputs
            if any(feature in s or s in feature for s in user_symptoms_lower):
                vector[idx] = 1.0
        return vector

    def predict(self, user_symptoms: List[str]) -> Tuple[str, float, List[Dict[str, Any]], np.ndarray]:
        """
        Runs XGBoost model inference.
        Returns:
            predicted_disease: str
            confidence: float
            differential: List[Dict] containing disease names and confidence scores
            vector: np.ndarray (the binary symptom vector used for prediction)
        """
        vector = self.symptoms_to_vector(user_symptoms)
        X_test = pd.DataFrame([vector], columns=self.features)
        
        # Get probability distributions
        probs = self.model.predict_proba(X_test)[0]
        
        # Get top matching diseases sorted by confidence descending
        differential = []
        for idx, prob in enumerate(probs):
            if idx < len(self.diseases):
                differential.append({
                    "disease_name": self.diseases[idx],
                    "confidence_score": float(prob),
                    "is_top_match": False
                })
        
        # Sort
        differential = sorted(differential, key=lambda x: x["confidence_score"], reverse=True)
        differential[0]["is_top_match"] = True
        
        top_match = differential[0]
        
        return top_match["disease_name"], top_match["confidence_score"], differential, vector
