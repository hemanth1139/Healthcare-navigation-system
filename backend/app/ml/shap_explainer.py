"""
SHAP Explainer — generates feature-based contributions for disease predictions.
Converts technical features into user-friendly plain-language labels.
"""

import shap
import pandas as pd
from typing import List, Dict, Any
from app.ml.xgboost_model import XGBoostPredictor

# Map feature names to plain language descriptions
FEATURE_LABELS = {
    "fever": "Presence of fever",
    "headache": "Throbbing headache",
    "chest_pain": "Substernal chest pressure",
    "shortness_of_breath": "Shortness of breath / dyspnea",
    "cough": "Coughing",
    "fatigue": "General weakness & fatigue",
    "nausea": "Nausea or vomiting sensation",
    "vomiting": "Episodes of vomiting",
    "abdominal_pain": "Stomach or abdominal pain",
    "dizziness": "Dizziness / lightheadedness",
    "neck_tightness": "Neck muscle stiffness",
    "sweating": "Profuse cold sweats",
    "left_arm_radiation": "Pain radiating to left arm",
    "throat_irritation": "Sore throat / irritation",
    "body_aches": "General muscle and body aches",
    "chills": "Feeling chilly / shivers",
    "nasal_congestion": "Nasal block / congestion",
    "loss_of_appetite": "Loss of appetite",
}


class ShapExplainer:
    def __init__(self, predictor: XGBoostPredictor):
        self.predictor = predictor
        # Initialize TreeExplainer
        self.explainer = shap.TreeExplainer(self.predictor.model)

    def explain(self, input_vector: Any, prediction_id: str, disease_name: str) -> List[Dict[str, Any]]:
        """
        Computes SHAP values for the given input vector and returns structured explanations.
        """
        # Convert vector to DataFrame
        X = pd.DataFrame([input_vector], columns=self.predictor.features)
        
        # Calculate SHAP values
        shap_values = self.explainer(X)
        
        # Find class index for predicted disease
        try:
            class_idx = self.predictor.diseases.index(disease_name)
        except ValueError:
            class_idx = 0

        # Get contributions for target class
        # Depending on SHAP version, shap_values.values has shapes: [samples, features, classes] or [samples, features]
        # For multi-class, shap_values.values shape is typically (samples, features, classes)
        val_matrix = shap_values.values
        
        contributions = []
        
        if len(val_matrix.shape) == 3:
            # (1, num_features, num_classes)
            feature_contributions = val_matrix[0, :, class_idx]
        elif len(val_matrix.shape) == 2:
            # Single outputs (binary classification or 2D slice)
            feature_contributions = val_matrix[0, :]
        else:
            feature_contributions = val_matrix[0]

        # Map to plain language labels
        for idx, val in enumerate(feature_contributions):
            feat_name = self.predictor.features[idx]
            
            # Only include features with non-trivial contributions
            if abs(val) > 0.001:
                plain_label = FEATURE_LABELS.get(feat_name, feat_name.replace("_", " ").capitalize())
                
                # Check if symptom is present or absent in input
                is_present = input_vector[idx] == 1.0
                if not is_present:
                    plain_label = f"Absence of {plain_label.lower()}"
                
                contributions.append({
                    "shap_id": f"shp_{feat_name}_{prediction_id[:8]}",
                    "prediction_id": prediction_id,
                    "feature_name": feat_name,
                    "plain_language_label": plain_label,
                    "contribution_score": float(val)
                })

        # Sort contributions by absolute value descending (most impactful first)
        contributions = sorted(contributions, key=lambda x: abs(x["contribution_score"]), reverse=True)
        return contributions[:5]  # Return top-5 impact factors
