"""
HL7 FHIR Resource Formatter.
Converts database medical records into standardized HL7 FHIR DiagnosticReport 
and DocumentReference JSON schemas.
"""

from datetime import datetime, timezone
from typing import Dict, Any


class FHIRFormatter:
    @staticmethod
    def to_diagnostic_report(
        record_id: str,
        patient_id: str,
        record_name: str,
        conclusion: str,
        file_url: str,
        file_type: str,
        created_at: datetime
    ) -> Dict[str, Any]:
        """
        Formats clinical diagnostic metadata into an HL7 FHIR DiagnosticReport resource.
        """
        # Resolve FHIR status and codes
        status = "final"
        
        # Format DiagnosticReport resource
        return {
            "resourceType": "DiagnosticReport",
            "id": record_id,
            "status": status,
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                            "code": "LAB",
                            "display": "Laboratory"
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "11502-2",
                        "display": "Laboratory report"
                    }
                ],
                "text": record_name
            },
            "subject": {
                "reference": f"Patient/{patient_id}"
            },
            "effectiveDateTime": created_at.isoformat(),
            "issued": datetime.now(timezone.utc).isoformat(),
            "conclusion": conclusion,
            "presentedForm": [
                {
                    "contentType": file_type or "application/pdf",
                    "url": file_url
                }
            ]
        }

    @staticmethod
    def to_document_reference(
        record_id: str,
        patient_id: str,
        record_name: str,
        file_url: str,
        file_type: str,
        created_at: datetime
    ) -> Dict[str, Any]:
        """
        Formats medical records into an HL7 FHIR DocumentReference resource.
        """
        return {
            "resourceType": "DocumentReference",
            "id": record_id,
            "status": "current",
            "docStatus": "final",
            "type": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "34117-2",
                        "display": "History and physical note"
                    }
                ],
                "text": record_name
            },
            "subject": {
                "reference": f"Patient/{patient_id}"
            },
            "date": created_at.isoformat(),
            "content": [
                {
                    "attachment": {
                        "contentType": file_type or "application/pdf",
                        "url": file_url,
                        "title": record_name
                    }
                }
            ]
        }
