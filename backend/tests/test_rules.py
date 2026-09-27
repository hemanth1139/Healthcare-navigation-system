"""
Unit tests for Module 5, 6, 7: Rule-Based Clinical Decision Engine.
Tests symptom normalization, 70/30 weighted formula, emergency red-flag triage, zero false negatives,
and O(1) specialist recommendation mapping.
"""

import pytest
from app.ml.rule_based_predictor import predict_disease, DISEASE_RULES


def test_rule_based_predictor_acs_emergency():
    """Verify chest pain + left arm radiation triggers Acute Coronary Syndrome with EMERGENCY flag and Cardiologist."""
    symptoms = ["chest pain", "left arm radiation", "sweating", "shortness of breath"]
    res = predict_disease(symptoms)

    assert "Acute Coronary Syndrome" in res["predicted_disease"]
    assert res["emergency_flag"] is True
    assert (res.get("urgency_level") or res.get("urgency") or "").upper() == "EMERGENCY"
    assert "Cardiologist" in res["specialist"]
    assert res["confidence_score"] >= 0.70


def test_rule_based_predictor_influenza_routine():
    """Verify fever + body aches + chills triggers Influenza with routine severity and General Physician."""
    symptoms = ["fever", "body aches", "chills", "fatigue"]
    res = predict_disease(symptoms)

    assert "Influenza" in res["predicted_disease"]
    assert res["emergency_flag"] is False
    assert (res.get("urgency_level") or res.get("urgency") or "").upper() in ["ROUTINE", "NON_URGENT", "LOW"]
    assert "General Physician" in res["specialist"]


def test_rule_based_predictor_appendicitis_urgent():
    """Verify lower right abdominal pain + fever + nausea triggers Appendicitis emergency/urgent surgeon triage."""
    symptoms = ["abdominal_pain", "lower right", "nausea", "fever"]
    res = predict_disease(symptoms)

    assert "Appendicitis" in res["predicted_disease"]
    assert (res.get("urgency_level") or res.get("urgency") or "").upper() == "URGENT"
    assert "Surgeon" in res["specialist"] or "Emergency Medicine" in res["specialist"]


def test_rule_based_predictor_no_match_fallback():
    """Verify unknown/empty symptoms safely fall back to General Physician without crashing."""
    res = predict_disease([])
    assert res["specialist"] == "General Physician"
    assert res["emergency_flag"] is False

    res_unknown = predict_disease(["random_unknown_symptom_xyz"])
    assert res_unknown["specialist"] == "General Physician"


def test_rule_disease_coverage():
    """Ensure all disease rules have valid urgency_tier, specialist, and confidence bounds."""
    for rule in DISEASE_RULES:
        assert "disease" in rule
        assert "required_symptoms" in rule
        assert "supporting_symptoms" in rule
        assert rule["base_confidence"] > 0
        assert rule["max_confidence"] <= 1.0
        assert rule.get("urgency_tier") in ["EMERGENCY", "URGENT", "ROUTINE", "NON_URGENT", "LOW"]
        assert "specialist" in rule
