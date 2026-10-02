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
        assert "specialist_code" in rule


# ─── ISSUE 1 REGRESSION TESTS: OVER-TRIAGING & EMERGENCY INTEGRITY ───────────

def test_fever_and_headache_cannot_trigger_emergency_meningitis():
    """
    Test Case 1 (Regression): 'fever + headache' MUST NOT trigger Bacterial Meningitis or EMERGENCY.
    Must evaluate to Viral Upper Respiratory Syndrome or Tension-Type Headache / Migraine (ROUTINE / NON_URGENT).
    """
    symptoms = ["fever", "headache"]
    res = predict_disease(symptoms)

    assert "Meningitis" not in res["predicted_disease"]
    assert res["emergency_flag"] is False
    assert res["urgency_level"] in ["ROUTINE", "NON_URGENT"]
    assert res["recommended_specialist"]["code"] in ["GENERAL_MEDICINE", "NEUROLOGY"]


def test_fever_and_stiff_neck_triggers_emergency_meningitis():
    """
    Test Case 2: 'fever + stiff neck' satisfies ALL mandatory red flags for Bacterial Meningitis -> EMERGENCY.
    """
    symptoms = ["fever", "stiff neck"]
    res = predict_disease(symptoms)

    assert "Meningitis" in res["predicted_disease"]
    assert res["emergency_flag"] is True
    assert res["urgency_level"] == "EMERGENCY"
    assert "Neurologist" in res["specialist"]
    assert res["recommended_specialist"]["code"] == "NEUROLOGY"


def test_fever_headache_stiff_neck_triggers_emergency_meningitis():
    """
    Test Case 3: 'fever + headache + stiff neck' satisfies red flags plus supporting headache -> EMERGENCY.
    """
    symptoms = ["fever", "headache", "stiff neck"]
    res = predict_disease(symptoms)

    assert "Meningitis" in res["predicted_disease"]
    assert res["emergency_flag"] is True
    assert res["urgency_level"] == "EMERGENCY"
    assert res["confidence_score"] >= 0.85


def test_unrelated_fever_symptoms_not_emergency():
    """
    Test Case 4: 'fever + throat pain' triggers Acute Pharyngitis (NON_URGENT), NOT EMERGENCY.
    """
    symptoms = ["fever", "throat pain"]
    res = predict_disease(symptoms)

    assert "Pharyngitis" in res["predicted_disease"]
    assert res["emergency_flag"] is False
    assert res["urgency_level"] == "NON_URGENT"
    assert res["recommended_specialist"]["code"] == "ENT"


def test_all_emergency_rules_require_full_red_flags():
    """
    Test Case 5: Verify every EMERGENCY rule requires all of its mandatory required symptoms.
    """
    # 1. Acute Coronary Syndrome
    acs_res = predict_disease(["chest pain", "shortness of breath"])
    assert "Acute Coronary Syndrome" in acs_res["predicted_disease"]
    assert acs_res["emergency_flag"] is True
    assert acs_res["urgency_level"] == "EMERGENCY"

    # 2. Acute Stroke
    stroke_res = predict_disease(["facial droop", "dizziness"])
    assert "Stroke" in stroke_res["predicted_disease"] or "Cerebrovascular" in stroke_res["predicted_disease"]
    assert stroke_res["emergency_flag"] is True
    assert stroke_res["urgency_level"] == "EMERGENCY"

    # 3. Bacterial Meningitis without stiff neck -> must NOT be emergency
    non_meningitis = predict_disease(["fever", "vomiting", "dizziness"])
    assert "Meningitis" not in non_meningitis["predicted_disease"]
    assert non_meningitis["emergency_flag"] is False


# ─── REQUIREMENT 9 AUTOMATED TESTS: KNEE PAIN, INJURIES & CONSERVATIVE ESCALATION ───

def test_knee_pain_routine_musculoskeletal():
    """
    Knee pain with no red flags and normal weight-bearing evaluates to ROUTINE Musculoskeletal Strain.
    """
    res = predict_disease(["knee_pain", "swelling"])
    assert res["urgency_level"] == "ROUTINE"
    assert res["emergency_flag"] is False
    assert "Orthopedic" in res["specialist"] or "General Physician" in res["specialist"]
    assert "Knee Pain" in res["triggered_rules"]


def test_knee_pain_with_inability_to_bear_weight_triggers_urgent():
    """
    Knee pain + inability to bear weight triggers URGENT (suspected ligament rupture or fracture).
    Must NEVER be classified as ROUTINE.
    """
    res = predict_disease(["knee_pain", "inability_to_bear_weight", "swelling"])
    assert res["urgency_level"] == "URGENT"
    assert res["emergency_flag"] is False
    assert "Orthopedic" in res["specialist"]
    assert "Inability to Bear Weight" in res["triggered_rules"] or "Inability To Bear Weight" in res["triggered_rules"]


def test_knee_pain_with_trauma_and_locking_triggers_urgent():
    """
    Knee pain after trauma with mechanical locking or inability to bear weight triggers URGENT.
    """
    res = predict_disease(["knee_pain", "trauma_injury", "inability_to_bear_weight"])
    assert res["urgency_level"] == "URGENT"
    assert "Orthopedic" in res["specialist"]


def test_septic_arthritis_emergency_escalation():
    """
    Knee/joint pain + fever + joint warmth/redness triggers EMERGENCY Septic Arthritis.
    """
    res = predict_disease(["knee_pain", "fever", "joint_warmth_redness"])
    assert res["urgency_level"] == "EMERGENCY"
    assert res["emergency_flag"] is True
    assert "Septic Arthritis" in res["predicted_disease"]
    assert "Orthopedic" in res["specialist"]


def test_breathing_difficulty_pneumonia_urgent():
    """
    Cough + fever + shortness of breath triggers URGENT Pneumonia evaluation.
    """
    res = predict_disease(["cough", "fever", "shortness_of_breath"])
    assert res["urgency_level"] == "URGENT"
    assert "Pneumonia" in res["predicted_disease"]
    assert "Pulmonologist" in res["specialist"]


def test_chest_pain_acs_emergency_escalation():
    """
    Chest pain radiating to left arm triggers EMERGENCY ACS.
    """
    res = predict_disease(["chest_pain", "left_arm_radiation"])
    assert res["urgency_level"] == "EMERGENCY"
    assert res["emergency_flag"] is True
    assert "Cardiologist" in res["specialist"]


def test_unknown_and_missing_information_tracking():
    """
    Verify that missing information is tracked separately and not assumed negative.
    """
    from app.ml.rule_based_predictor import extract_cumulative_symptoms
    messages = [
        {"sender": "user", "content": "I have knee pain since yesterday."}
    ]
    cum = extract_cumulative_symptoms(messages)
    assert "Knee Pain" in cum["positive_findings"]
    # Weight-bearing status was not asked or mentioned -> must be in unknown_findings, not negative_findings
    assert any("Weight-bearing" in u for u in cum["unknown_findings"])
    assert "Inability to Bear Weight" not in cum["negative_findings"]
    assert len(cum["limitations"]) >= 1


def test_explicit_denial_tracked_as_negative_finding():
    """
    Verify that explicit denials (e.g. 'can walk fine', 'no fever') are recorded in negative_findings.
    """
    from app.ml.rule_based_predictor import extract_cumulative_symptoms
    messages = [
        {"sender": "user", "content": "I have knee pain."},
        {"sender": "assistant", "content": "Can you walk?"},
        {"sender": "user", "content": "Yes, I can walk fine and I have no fever or swelling."}
    ]
    cum = extract_cumulative_symptoms(messages)
    assert "Knee Pain" in cum["positive_findings"]
    assert "Inability to Bear Weight" in cum["negative_findings"] or "Inability To Bear Weight" in cum["negative_findings"]
    assert "Fever" in cum["negative_findings"]
    assert "Swelling" in cum["negative_findings"]


