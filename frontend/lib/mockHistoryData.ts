// Phase 1: Updated history mock data — Phase 1 consultation-based history
// (replaces ML prediction and medical record entries)

import { HistoryItem, HistoryTypeFilter, HistoryDateRange } from "@/types/history";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_HISTORY_ITEMS: HistoryItem[] = [
  {
    id: "hist_01",
    type: "symptom_consultation",
    title: "Symptom Consultation — Tension Headache & Fatigue",
    subtitle: "Urgency: Non-Urgent • GP Recommended • 3-turn conversation",
    timestamp: "2026-08-01T09:30:00Z",
    relativeGroup: "Today",
    urgency: "NON_URGENT",
    linkTo: "/history/cons_003",
    detailsPayload: {
      primary_symptom: "Tension-type headache",
      urgency_level: "NON_URGENT",
      urgency_label: "Schedule a GP Appointment",
      specialist_recommended: "General Physician",
      total_turns: 3,
    },
  },
  {
    id: "hist_02",
    type: "scheme_query",
    title: "Ayushman Vaya Vandana Senior Citizen Eligibility",
    subtitle: "Overall Status: ELIGIBLE • Evidence from 2 official documents",
    timestamp: "2026-08-01T11:00:00Z",
    relativeGroup: "Today",
    linkTo: "/schemes",
    detailsPayload: {
      scheme_name: "Ayushman Vaya Vandana Scheme",
      user_question: "Am I eligible for Ayushman Vaya Vandana if I am 70 years old?",
      overall_status: "ELIGIBLE",
      ai_answer_excerpt:
        "All Indian citizens aged 70 years and above are eligible for free health cover up to ₹5 Lakhs per year, regardless of income.",
    },
  },
  {
    id: "hist_03",
    type: "symptom_consultation",
    title: "EMERGENCY ALERT — Chest Pain & Diaphoresis",
    subtitle: "Urgency: EMERGENCY • Cardiologist Recommended • 2-turn conversation",
    timestamp: "2026-07-31T20:15:00Z",
    relativeGroup: "Yesterday",
    urgency: "EMERGENCY",
    linkTo: "/history/cons_001",
    detailsPayload: {
      primary_symptom: "Chest pain radiating to left arm with sweating",
      urgency_level: "EMERGENCY",
      urgency_label: "Immediate Emergency — Call 108 Now",
      specialist_recommended: "Cardiologist",
      total_turns: 2,
    },
  },
  {
    id: "hist_04",
    type: "symptom_consultation",
    title: "Symptom Consultation — Sudden Severe Headache",
    subtitle: "Urgency: Urgent • Neurologist Recommended • 4-turn conversation",
    timestamp: "2026-07-31T10:30:00Z",
    relativeGroup: "Yesterday",
    urgency: "URGENT",
    linkTo: "/history/cons_002",
    detailsPayload: {
      primary_symptom: "Sudden onset severe headache with neck stiffness",
      urgency_level: "URGENT",
      urgency_label: "Seek Medical Care Within 24 Hours",
      specialist_recommended: "Neurologist",
      total_turns: 4,
    },
  },
  {
    id: "hist_05",
    type: "document_upload",
    title: "Income Certificate Uploaded",
    subtitle: "Document Type: Income Certificate • Status: Verified",
    timestamp: "2026-07-28T14:00:00Z",
    relativeGroup: "This Week",
    linkTo: "/documents",
    detailsPayload: {
      document_type_label: "Income Certificate",
      file_name: "income_certificate_2026.pdf",
      processing_status: "verified",
      scheme_name: "Ayushman Bharat PM-JAY",
    },
  },
  {
    id: "hist_06",
    type: "scheme_query",
    title: "PM-JAY BPL Family Income Eligibility Query",
    subtitle: "Overall Status: POSSIBLY_ELIGIBLE • Evidence from 3 official documents",
    timestamp: "2026-07-26T16:00:00Z",
    relativeGroup: "This Week",
    linkTo: "/schemes",
    detailsPayload: {
      scheme_name: "Ayushman Bharat PM-JAY",
      user_question: "What is the family income limit for Ayushman Bharat PM-JAY?",
      overall_status: "POSSIBLY_ELIGIBLE",
      ai_answer_excerpt:
        "BPL families identified in SECC 2011 data qualify. Income limit varies by state. Your eligibility depends on state-specific criteria.",
    },
  },
  {
    id: "hist_07",
    type: "symptom_consultation",
    title: "Symptom Consultation — Seasonal Allergies & Nasal Congestion",
    subtitle: "Urgency: Routine • Allergist Recommended • 3-turn conversation",
    timestamp: "2026-07-26T11:00:00Z",
    relativeGroup: "This Week",
    urgency: "ROUTINE",
    linkTo: "/history/cons_004",
    detailsPayload: {
      primary_symptom: "Nasal congestion and watery eyes",
      urgency_level: "ROUTINE",
      urgency_label: "Routine Care — No Urgency",
      specialist_recommended: "Allergist / Immunologist",
      total_turns: 3,
    },
  },
  {
    id: "hist_08",
    type: "document_upload",
    title: "Aadhaar Card Uploaded",
    subtitle: "Document Type: Aadhaar Card • Status: Processing",
    timestamp: "2026-07-15T10:00:00Z",
    relativeGroup: "Earlier",
    linkTo: "/documents",
    detailsPayload: {
      document_type_label: "Aadhaar Card",
      file_name: "aadhaar_card_scan.jpg",
      processing_status: "processing",
      scheme_name: "Ayushman Vaya Vandana Scheme",
    },
  },
];

export const historyApi = {
  getHistory: async (
    typeFilter: HistoryTypeFilter = "All",
    dateRange: HistoryDateRange = "all"
  ): Promise<HistoryItem[]> => {
    await delay(300);
    let results = [...MOCK_HISTORY_ITEMS];

    if (typeFilter !== "All") {
      results = results.filter((item) => item.type === typeFilter);
    }

    if (dateRange === "7d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      results = results.filter((item) => new Date(item.timestamp) >= cutoff);
    } else if (dateRange === "30d") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      results = results.filter((item) => new Date(item.timestamp) >= cutoff);
    }

    return results;
  },

  getHistoryItem: async (id: string): Promise<HistoryItem | null> => {
    await delay(200);
    return MOCK_HISTORY_ITEMS.find((item) => item.id === id) || null;
  },
};
