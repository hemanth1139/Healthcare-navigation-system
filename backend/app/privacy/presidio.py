"""
PII Anonymization Service.
Uses pattern analyzers to identify and redact sensitive patient information 
(names, emails, phone numbers, Aadhaar / SSN numbers) before diagnostic processing.
"""

import re
from typing import Dict, Any, List

# Regex patterns for clinical PII identification
EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_PATTERN = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
AADHAAR_PATTERN = re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b")
SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
IP_PATTERN = re.compile(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")


class PIIScrubber:
    @staticmethod
    def scrub_text(text: str) -> str:
        """
        Redacts PII (Emails, Phones, SSN, Aadhaar, IPs) from text.
        """
        if not text:
            return ""

        scrubbed = text

        # 1. Redact Emails
        scrubbed = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", scrubbed)

        # 2. Redact Phone Numbers
        scrubbed = PHONE_PATTERN.sub("[REDACTED_PHONE]", scrubbed)

        # 3. Redact Aadhaar Card (India)
        scrubbed = AADHAAR_PATTERN.sub("[REDACTED_AADHAAR]", scrubbed)

        # 4. Redact SSN (US)
        scrubbed = SSN_PATTERN.sub("[REDACTED_SSN]", scrubbed)

        # 5. Redact IP Addresses
        scrubbed = IP_PATTERN.sub("[REDACTED_IP]", scrubbed)

        # 6. Redact custom physician/patient name tags if present in clinical formatting
        # e.g., "Patient Name: John Doe", "Dr. Jane Smith"
        scrubbed = re.sub(
            r"(?i)patient\s*name\s*:\s*[a-zA-Z\s]+(?=\n|\r|,|\.)",
            "Patient Name: [REDACTED_NAME]",
            scrubbed
        )
        scrubbed = re.sub(
            r"(?i)physician\s*:\s*[a-zA-Z\s]+(?=\n|\r|,|\.)",
            "Physician: [REDACTED_NAME]",
            scrubbed
        )
        scrubbed = re.sub(
            r"(?i)doctor\s*:\s*[a-zA-Z\s]+(?=\n|\r|,|\.)",
            "Doctor: [REDACTED_NAME]",
            scrubbed
        )
        return scrubbed
