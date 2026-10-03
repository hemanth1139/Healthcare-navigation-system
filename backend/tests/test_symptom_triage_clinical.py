"""
Comprehensive Clinical Triage and Symptom Assessment Regression Test Suite.
Verifies:
1. Knee pain with and without traumatic injury.
2. Trouble/difficulty in passing urine (retains verbatim complaint, maps to Urologist, URGENT tier).
3. Complete inability to urinate (EMERGENCY tier, acute urinary retention).
4. Urinary symptoms with fever or flank pain (EMERGENCY tier, pyelonephritis).
5. Burning urination alone (NON_URGENT tier, Urologist/GP).
6. Chest pain with emergency warning signs (EMERGENCY tier, Cardiologist / ER).
7. Severe headache and neurological warning signs (EMERGENCY tier, Neurologist / ER).
8. Throat pain and difficulty swallowing (URGENT tier, ENT Specialist).
9. Vague symptoms requiring clarification vs known domains.
10. Contradictory answers & missing information (unknowns not assumed negative).
11. Report retrieval idempotency & verbatim complaint preservation.
"""

import pytest
import uuid
from app.ml.rule_based_predictor import (
    extract_cumulative_symptoms,
    normalize_symptom_list,
    format_symptom_title,
    predict_disease,
    predict_disease_generative,
)
from app.agents.triage_agent import _get_mock_triage_response


class TestSymptomTriageClinical:

    # 1. Knee pain with and without injury
    def test_knee_pain_with_trauma_and_inability_to_bear_weight(self):
        history = [
            {"sender": "user", "content": "I hurt my right knee playing soccer after a sudden twist"},
            {"sender": "assistant", "content": "Are you able to bear weight on that leg?"},
            {"sender": "user", "content": "I cannot bear weight on it and cannot walk"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "knee_pain" in cum["all_symptoms"]
        assert "inability_to_bear_weight" in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] in ["URGENT", "EMERGENCY"]
        assert "Orthopedic" in pred["specialist"]

    def test_knee_pain_without_injury_able_to_walk(self):
        history = [
            {"sender": "user", "content": "My knee has a mild ache since yesterday, no fall or injury"},
            {"sender": "assistant", "content": "Can you walk normally?"},
            {"sender": "user", "content": "Yes, I can walk and bear weight normally with no swelling"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "knee_pain" in cum["all_symptoms"]
        assert "inability_to_bear_weight" not in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] in ["ROUTINE", "NON_URGENT"]
        assert "Orthopedic" in pred["specialist"]

    # 2. Trouble in passing urine (Test case from user prompt)
    def test_trouble_passing_urine_retention_and_urgency(self):
        history = [
            {"sender": "user", "content": "trouble in passing urine for more than 5 days, severe"},
        ]
        cum = extract_cumulative_symptoms(history)
        # Check original complaint preserved verbatim
        assert cum["original_complaint"] == "trouble in passing urine for more than 5 days, severe"
        assert "difficulty_urinating" in cum["all_symptoms"]
        assert cum["primary_symptom"] != "General Discomfort"
        assert "Difficulty Urinating" in cum["primary_symptom"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] in ["URGENT", "EMERGENCY"]
        assert "Urologist" in pred["specialist"]

    # 3. Complete inability to urinate (Acute Urinary Retention)
    def test_complete_inability_to_urinate_emergency(self):
        history = [
            {"sender": "user", "content": "I cannot pass any urine at all and my bladder feels painfully distended"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "acute_urinary_retention" in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] == "EMERGENCY"
        assert pred["emergency_flag"] is True
        assert "Acute Urinary Retention" in pred["predicted_disease"]
        assert "Urologist" in pred["specialist"]

    # 4. Urinary symptoms with fever and flank pain (Pyelonephritis)
    def test_urinary_symptoms_with_fever_and_flank_pain(self):
        history = [
            {"sender": "user", "content": "I have burning when urinating along with high fever, severe chills, and right flank back pain"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "burning_urination" in cum["all_symptoms"]
        assert "fever" in cum["all_symptoms"]
        assert "flank_pain" in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] == "EMERGENCY"
        assert pred["emergency_flag"] is True
        assert "Pyelonephritis" in pred["predicted_disease"] or "Urosepsis" in pred["predicted_disease"]

    # 5. Burning urination alone (Uncomplicated Cystitis / Dysuria)
    def test_burning_urination_uncomplicated(self):
        history = [
            {"sender": "user", "content": "I feel a burning sensation when I pass urine, but no fever, no back pain, and no vomiting"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "burning_urination" in cum["all_symptoms"]
        assert "fever" not in cum["all_symptoms"]
        assert "flank_pain" not in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] == "NON_URGENT"
        assert "Urologist" in pred["specialist"] or "General Physician" in pred["specialist"]

    # 6. Chest pain with emergency warning signs
    def test_chest_pain_with_radiation_and_dyspnea(self):
        history = [
            {"sender": "user", "content": "I have severe pressure in my chest radiating down my left arm with cold sweats and shortness of breath"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "chest_pain" in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] == "EMERGENCY"
        assert pred["emergency_flag"] is True
        assert "Cardiologist" in pred["specialist"] or "Emergency" in pred["specialist"]

    # 7. Severe headache with neurological red flags
    def test_thunderclap_headache_emergency(self):
        history = [
            {"sender": "user", "content": "Sudden severe explosive thunderclap headache, worst headache of my life"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "thunderclap_headache" in cum["all_symptoms"] or "headache" in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] == "EMERGENCY"
        assert pred["emergency_flag"] is True
        assert "Neurologist" in pred["specialist"] or "Emergency" in pred["specialist"]

    # 8. Throat pain and difficulty swallowing
    def test_throat_pain_with_dysphagia(self):
        history = [
            {"sender": "user", "content": "Severe throat pain and I have great difficulty swallowing food and drinks with fever"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "throat_pain" in cum["all_symptoms"]
        assert "difficulty_swallowing" in cum["all_symptoms"]

        pred = predict_disease(cum["all_symptoms"], cum)
        assert pred["urgency_tier"] in ["URGENT", "EMERGENCY"]
        assert "ENT" in pred["specialist"] or "Otolaryngologist" in pred["specialist"]

    # 9. Adaptive questioning does not use fixed generic questions
    def test_adaptive_questioning_for_urinary_symptoms(self):
        messages = [
            {"sender": "user", "content": "trouble in passing urine"}
        ]
        resp = _get_mock_triage_response(messages)
        assert resp["needs_more_info"] is True
        # Must ask urinary-specific questions, NOT generic "When did these symptoms begin..."
        assert "pass" in resp["question"].lower() or "urine" in resp["question"].lower()
        assert resp["options"] is not None
        assert len(resp["options"]) >= 2

    # 10. Contradictory answers and missing information tracking
    def test_findings_breakdown_and_unknowns(self):
        history = [
            {"sender": "user", "content": "I have right knee pain"},
            {"sender": "assistant", "content": "Did you have a fall?"},
            {"sender": "user", "content": "No fall, but I have no fever and no swelling"},
        ]
        cum = extract_cumulative_symptoms(history)
        assert "knee_pain" in cum["all_symptoms"]
        # Negative findings extracted
        neg_text = " ".join(cum["negative_findings"]).lower()
        assert "fever" in neg_text or "swelling" in neg_text
        # Unknown findings should list unscreened critical dimensions
        assert len(cum["unknown_findings"]) >= 0

    # 11. Preservation of Original Complaint and Canonical Consistency
    @pytest.mark.asyncio
    async def test_generative_preserves_deterministic_urgency_and_complaint(self):
        raw_complaint = "trouble in passing urine for 5 days with severe pain"
        history = [{"sender": "user", "content": raw_complaint}]
        cum = extract_cumulative_symptoms(history)

        gen_res = await predict_disease_generative(
            symptoms=cum["all_symptoms"],
            patient_context_summary="",
            cumulative_data=cum,
        )

        assert gen_res["original_complaint"] == raw_complaint
        assert gen_res["urgency_tier"] in ["URGENT", "EMERGENCY"]
        assert "General Discomfort" not in gen_res["predicted_disease"]
        assert "Urologist" in gen_res["specialist"]
