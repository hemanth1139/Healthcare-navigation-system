"""
Dashboard Service — aggregates unified patient healthcare records across all modules.
"""

from uuid import UUID
from datetime import date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.profile import PatientProfile
from app.models.conversation import Conversation, ConversationMessage
from app.models.prediction import DiseasePrediction, SeverityAssessment, SpecialistRecommendation
from app.models.hospital import Hospital, HospitalRecommendation
from app.models.scheme import GovernmentScheme, SchemeQuery
from app.models.record import MedicalRecord
from app.schemas.dashboard import (
    PatientSummary,
    LatestAssessment,
    SpecialistRecommendationSummary,
    RecentConsultationItem,
    RecentSchemeQueryItem,
    HospitalSummaryItem,
    DashboardMetrics,
    DashboardResponseOut,
)


class DashboardService:

    @staticmethod
    async def get_dashboard_data(db: AsyncSession, current_user: User) -> DashboardResponseOut:
        """
        Aggregates unified patient dashboard data in optimized database queries.
        Handles new user empty states cleanly without throwing exceptions.
        """
        # 1. Fetch Patient Profile & Clinical Baseline
        prof_stmt = (
            select(PatientProfile)
            .options(
                selectinload(PatientProfile.allergies),
                selectinload(PatientProfile.chronic_conditions),
                selectinload(PatientProfile.medications),
                selectinload(PatientProfile.user),
            )
            .where(PatientProfile.user_id == current_user.user_id)
        )
        prof_res = await db.execute(prof_stmt)
        profile = prof_res.scalar_one_or_none()

        # Compute Age
        age = None
        if profile and profile.date_of_birth:
            today = date.today()
            dob = profile.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        allergies = [a.allergy_name for a in (profile.allergies if profile else [])]
        chronic_conditions = [c.condition_name for c in (profile.chronic_conditions if profile else [])]
        medications = [f"{m.medicine_name} ({m.dosage or 'N/A'})" for m in (profile.medications if profile else [])]

        is_completed = bool(
            profile
            and profile.gender
            and profile.blood_group
            and (profile.city or profile.state)
        )

        patient_summary = PatientSummary(
            id=str(current_user.user_id),
            fullName=current_user.full_name or "Patient",
            email=current_user.email,
            phone=current_user.phone,
            gender=profile.gender if profile else None,
            bloodGroup=profile.blood_group if profile else None,
            age=age,
            city=profile.city if profile else None,
            state=profile.state if profile else None,
            allergies=allergies,
            chronicConditions=chronic_conditions,
            medications=medications,
            isProfileCompleted=is_completed,
        )

        # If no profile exists yet, return clean empty dashboard state
        if not profile:
            return DashboardResponseOut(
                patientSummary=patient_summary,
                metrics=DashboardMetrics(),
                latestAssessment=None,
                specialistRecommendation=None,
                recentConsultations=[],
                recentSchemeQueries=[],
                recommendedHospitals=[],
            )

        # 2. Fetch Recent Consultations with Predictions, Severity, and Specialists
        conv_stmt = (
            select(Conversation)
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.disease_predictions).selectinload(
                    DiseasePrediction.severity_assessment
                ),
                selectinload(Conversation.disease_predictions).selectinload(
                    DiseasePrediction.specialist_recommendation
                ),
            )
            .where(Conversation.profile_id == profile.profile_id)
            .order_by(Conversation.started_at.desc())
            .limit(5)
        )
        conv_res = await db.execute(conv_stmt)
        conversations = conv_res.scalars().all()

        recent_consultations: List[RecentConsultationItem] = []
        latest_assessment: Optional[LatestAssessment] = None
        specialist_summary: Optional[SpecialistRecommendationSummary] = None
        emergency_alerts_count = 0

        for idx, conv in enumerate(conversations):
            # Find primary symptom from first user message
            primary_symptom = "General Symptom Assessment"
            if conv.messages:
                for msg in conv.messages:
                    if msg.sender.lower() == "user":
                        primary_symptom = msg.message
                        break

            pred = conv.disease_predictions[0] if conv.disease_predictions else None
            sev = pred.severity_assessment if pred else None
            spec = pred.specialist_recommendation if pred else None

            if sev and sev.emergency_flag:
                emergency_alerts_count += 1

            # Format date & time
            st = conv.started_at
            date_str = st.strftime("%b %d, %Y") if st else "Recent"
            time_str = st.strftime("%I:%M %p") if st else ""

            item = RecentConsultationItem(
                conversationId=str(conv.conversation_id),
                date=date_str,
                formattedTime=time_str,
                status=conv.status or "completed",
                primarySymptom=primary_symptom[:60],
                predictedDisease=pred.predicted_disease if pred else None,
                confidenceScore=float(pred.confidence_score) if pred else None,
                severity=sev.severity if sev else "routine",
                urgencyLevel=sev.urgency_level if sev else "Routine Assessment",
                emergencyFlag=sev.emergency_flag if sev else False,
                specialist=spec.specialist if spec else None,
            )
            recent_consultations.append(item)

            # Assign latest assessment from the most recent completed triage
            if idx == 0 and pred:
                latest_assessment = LatestAssessment(
                    predictionId=str(pred.prediction_id),
                    conversationId=str(conv.conversation_id),
                    predictedDisease=pred.predicted_disease,
                    confidenceScore=float(pred.confidence_score),
                    severity=sev.severity if sev else "low",
                    urgencyLevel=sev.urgency_level if sev else "Routine Assessment",
                    emergencyFlag=sev.emergency_flag if sev else False,
                    explanation=sev.explanation if sev else (pred.predicted_disease + " evaluation completed."),
                    specialist=spec.specialist if spec else None,
                    assessedAt=pred.predicted_at.isoformat() if pred.predicted_at else st.isoformat(),
                )
                if spec:
                    specialist_summary = SpecialistRecommendationSummary(
                        specialist=spec.specialist,
                        reason=spec.reason,
                        conversationId=str(conv.conversation_id),
                        predictionId=str(pred.prediction_id),
                    )

        # 3. Fetch Recent Scheme Queries (Linked to user's conversations or profile)
        scheme_stmt = (
            select(SchemeQuery)
            .options(selectinload(SchemeQuery.scheme))
            .join(Conversation, SchemeQuery.conversation_id == Conversation.conversation_id, isouter=True)
            .where((Conversation.profile_id == profile.profile_id) | (SchemeQuery.conversation_id == None))
            .order_by(SchemeQuery.created_at.desc())
            .limit(3)
        )
        scheme_res = await db.execute(scheme_stmt)
        scheme_queries_raw = scheme_res.scalars().all()

        recent_scheme_queries: List[RecentSchemeQueryItem] = []
        for sq in scheme_queries_raw:
            s_name = sq.scheme.scheme_name if sq.scheme else "Government Healthcare Scheme"
            elig_res = sq.eligibility_result or {}
            status = elig_res.get("overall_status") or elig_res.get("overallStatus") or "POSSIBLY_ELIGIBLE"
            exp = elig_res.get("overall_explanation") or elig_res.get("overallExplanation") or sq.ai_response

            recent_scheme_queries.append(
                RecentSchemeQueryItem(
                    queryId=str(sq.query_id),
                    schemeId=sq.scheme_id,
                    schemeName=s_name,
                    userQuestion=sq.user_question,
                    overallStatus=status,
                    overallExplanation=exp[:180] if exp else None,
                    queriedAt=sq.created_at.strftime("%b %d, %Y") if sq.created_at else "Recent",
                )
            )

        # 4. Fetch Recommended / Nearby Hospitals
        hosp_stmt = select(Hospital).order_by(Hospital.rating.desc().nullslast()).limit(3)
        hosp_res = await db.execute(hosp_stmt)
        hospitals_raw = hosp_res.scalars().all()

        recommended_hospitals: List[HospitalSummaryItem] = []
        for h in hospitals_raw:
            recommended_hospitals.append(
                HospitalSummaryItem(
                    hospitalId=str(h.hospital_id),
                    hospitalName=h.hospital_name,
                    city=h.city or "Local",
                    state=h.state or profile.state or "All India",
                    rating=float(h.rating) if h.rating else 4.5,
                    hasEmergencyRoom=True,
                    distanceKm=2.5,
                    googleMapsUrl=h.google_maps_url,
                )
            )

        # 5. Aggregate Metrics
        # Total conversations
        tot_conv_res = await db.execute(
            select(func.count(Conversation.conversation_id)).where(
                Conversation.profile_id == profile.profile_id
            )
        )
        total_convs = tot_conv_res.scalar() or 0

        # Total medical records
        tot_rec_res = await db.execute(
            select(func.count(MedicalRecord.record_id)).where(
                MedicalRecord.profile_id == profile.profile_id
            )
        )
        total_recs = tot_rec_res.scalar() or 0

        # Total active government schemes
        tot_schemes_res = await db.execute(select(func.count(GovernmentScheme.scheme_id)))
        active_schemes_count = int(tot_schemes_res.scalar() or 0)

        # Total schemes checked
        tot_sq_res = await db.execute(
            select(func.count(SchemeQuery.query_id))
            .join(Conversation, SchemeQuery.conversation_id == Conversation.conversation_id, isouter=True)
            .where((Conversation.profile_id == profile.profile_id) | (SchemeQuery.conversation_id == None))
        )
        total_schemes_checked = tot_sq_res.scalar() or 0

        metrics = DashboardMetrics(
            totalConsultations=total_convs,
            totalRecords=total_recs,
            totalSchemesChecked=total_schemes_checked,
            emergencyAlertsCount=emergency_alerts_count,
            activeSchemesCount=active_schemes_count,
        )

        return DashboardResponseOut(
            patientSummary=patient_summary,
            metrics=metrics,
            latestAssessment=latest_assessment,
            specialistRecommendation=specialist_summary,
            recentConsultations=recent_consultations,
            recentSchemeQueries=recent_scheme_queries,
            recommendedHospitals=recommended_hospitals,
        )
