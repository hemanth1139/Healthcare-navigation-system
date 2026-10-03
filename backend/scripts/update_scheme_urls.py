import json
import os

URL_MAP = {
    "scheme_C01": {
        "name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
        "official_url": "https://nha.gov.in/PM-JAY",
        "portal_url": "https://beneficiary.nha.gov.in/",
        "guidelines_url": "https://pmjay.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_C02": {
        "name": "Ayushman Vay Vandana Card (PM-JAY for 70+)",
        "official_url": "https://nha.gov.in/PM-JAY",
        "portal_url": "https://beneficiary.nha.gov.in/",
        "guidelines_url": "https://pmjay.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_C03": {
        "name": "Central Government Health Scheme (CGHS)",
        "official_url": "https://cghs.nic.in/",
        "portal_url": "https://cghs.nic.in/",
        "guidelines_url": "https://cghs.nic.in/index.php",
        "verification_status": "VERIFIED"
    },
    "scheme_C04": {
        "name": "Employees' State Insurance Scheme (ESIC)",
        "official_url": "https://www.esic.gov.in/",
        "portal_url": "https://www.esic.gov.in/",
        "guidelines_url": "https://www.esic.gov.in/health-insurance",
        "verification_status": "VERIFIED"
    },
    "scheme_C05": {
        "name": "Niramaya Health Insurance Scheme",
        "official_url": "https://thenationaltrust.gov.in/",
        "portal_url": "https://thenationaltrust.gov.in/content/scheme/niramaya.php",
        "guidelines_url": "https://thenationaltrust.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_C06": {
        "name": "Rashtriya Arogya Nidhi (RAN)",
        "official_url": "https://mohfw.gov.in/",
        "portal_url": "https://mohfw.gov.in/",
        "guidelines_url": "https://mohfw.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_C07": {
        "name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
        "official_url": "https://pmmvy.wcd.gov.in/",
        "portal_url": "https://pmmvy.wcd.gov.in/",
        "guidelines_url": "https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana",
        "verification_status": "VERIFIED"
    },
    "scheme_C08": {
        "name": "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
        "official_url": "https://pmsma.mohfw.gov.in/",
        "portal_url": "https://pmsma.mohfw.gov.in/",
        "guidelines_url": "https://pmsma.mohfw.gov.in/about-scheme/",
        "verification_status": "VERIFIED"
    },
    "scheme_C09": {
        "name": "Janani Shishu Suraksha Karyakram (JSSK)",
        "official_url": "https://nhm.gov.in/",
        "portal_url": "https://nhm.gov.in/",
        "guidelines_url": "https://nhm.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_C10": {
        "name": "Janani Suraksha Yojana (JSY)",
        "official_url": "https://nhm.gov.in/",
        "portal_url": "https://nhm.gov.in/",
        "guidelines_url": "https://nhm.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_C11": {
        "name": "National Health Mission (NHM)",
        "official_url": "https://nhm.gov.in/",
        "portal_url": "https://nhm.gov.in/",
        "guidelines_url": "https://nhm.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_TN01": {
        "name": "Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS)",
        "official_url": "https://www.cmchistn.com/",
        "portal_url": "https://www.cmchistn.com/",
        "guidelines_url": "https://www.cmchistn.com/about.php",
        "verification_status": "VERIFIED"
    },
    "scheme_TN02": {
        "name": "Dr. Muthulakshmi Reddy Maternity Benefit Scheme (MRMBS)",
        "official_url": "https://picme.tn.gov.in/",
        "portal_url": "https://picme.tn.gov.in/",
        "guidelines_url": "https://picme.tn.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_TN03": {
        "name": "Amma Baby Care Kit",
        "official_url": "https://www.tn.gov.in/",
        "portal_url": "https://www.tn.gov.in/",
        "guidelines_url": "https://www.tn.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_TN04": {
        "name": "Amma Arokiya Scheme",
        "official_url": "https://www.nhm.tn.gov.in/en",
        "portal_url": "https://www.nhm.tn.gov.in/en",
        "guidelines_url": "https://www.nhm.tn.gov.in/en",
        "verification_status": "VERIFIED"
    },
    "scheme_TN05": {
        "name": "Nammai Kaakkum 48",
        "official_url": "https://www.cmchistn.com/",
        "portal_url": "https://www.cmchistn.com/",
        "guidelines_url": "https://www.tn.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_TN06": {
        "name": "Nalam 360 - Annual Free Health Check-up for All",
        "official_url": "https://www.nhm.tn.gov.in/en",
        "portal_url": "https://www.nhm.tn.gov.in/en",
        "guidelines_url": "https://www.nhm.tn.gov.in/en",
        "verification_status": "VERIFIED"
    },
    "scheme_TN07": {
        "name": "Chief Minister's Elderly Health Insurance Scheme",
        "official_url": "https://www.nhm.tn.gov.in/en",
        "portal_url": "https://www.cmchistn.com/",
        "guidelines_url": "https://www.nhm.tn.gov.in/en",
        "verification_status": "VERIFIED"
    },
    "scheme_TN08": {
        "name": "Tamil Nadu New Health Insurance Scheme (Employees)",
        "official_url": "https://www.tn.gov.in/",
        "portal_url": "https://www.tn.gov.in/",
        "guidelines_url": "https://www.tn.gov.in/",
        "verification_status": "VERIFIED"
    },
    "scheme_TN09": {
        "name": "Tamil Nadu New Health Insurance Scheme (Pensioners)",
        "official_url": "https://www.tn.gov.in/",
        "portal_url": "https://www.tn.gov.in/",
        "guidelines_url": "https://www.tn.gov.in/",
        "verification_status": "VERIFIED"
    }
}

json_path = os.path.join(os.path.dirname(__file__), "..", "healthcare_schemes.json")
with open(json_path, "r", encoding="utf-8") as f:
    schemes = json.load(f)

for s in schemes:
    sid = s.get("scheme_id")
    if sid in URL_MAP:
        info = URL_MAP[sid]
        s["scheme_name"] = info["name"]
        s["official_url"] = info["official_url"]
        s["portal_url"] = info["portal_url"]
        s["guidelines_url"] = info["guidelines_url"]
        s["verification_status"] = info["verification_status"]

with open(json_path, "w", encoding="utf-8") as f:
    json.dump(schemes, f, indent=2, ensure_ascii=False)

print(f"Successfully updated {len(schemes)} schemes in healthcare_schemes.json")
