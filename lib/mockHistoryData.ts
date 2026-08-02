import { HistoryItem, HistoryTypeFilter, HistoryDateRange } from "@/types/history";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_HISTORY_ITEMS: HistoryItem[] = [
  {
    id: "hist_01",
    type: "prediction",
    title: "Clinical Triage: Tension-Type Headache & Viral Syndrome",
    subtitle: "XGBoost Model • 78% Match Confidence",
    timestamp: "2026-08-01T15:30:00Z",
    relativeGroup: "Today",
    severity: "moderate",
    linkTo: "/predictions/pred_101",
    detailsPayload: {
      disease_name: "Tension-Type Headache & Mild Stress",
      confidence_score: 0.78,
    },
  },
  {
    id: "hist_02",
    type: "conversation",
    title: "AI Symptom Triage Session #conv_88192",
    subtitle: "3 turn conversation in English",
    timestamp: "2026-08-01T15:25:00Z",
    relativeGroup: "Today",
    linkTo: "/chat/conv_88192",
    detailsPayload: {
      last_message_excerpt: "I have completed your initial symptom triage assessment. Triage severity: MODERATE.",
    },
  },
  {
    id: "hist_03",
    type: "scheme_query",
    title: "Ayushman Vaya Vandana Senior Citizen Eligibility",
    subtitle: "RAG Query • 92% Match Confidence",
    timestamp: "2026-08-01T11:00:00Z",
    relativeGroup: "Today",
    linkTo: "/schemes/sch_03",
    detailsPayload: {
      user_question: "Am I eligible for Ayushman Vaya Vandana if I am 70 years old?",
      ai_answer_excerpt: "Yes! All Indian citizens aged 70 years and above are eligible for free health cover up to ₹5 Lakhs per year.",
    },
  },
  {
    id: "hist_04",
    type: "prediction",
    title: "CRITICAL ALERT: Acute Coronary Syndrome Assessment",
    subtitle: "Emergency Triage • 91% Match Confidence",
    timestamp: "2026-07-31T20:15:00Z",
    relativeGroup: "Yesterday",
    severity: "emergency",
    linkTo: "/predictions/pred_emergency_102",
    detailsPayload: {
      disease_name: "Acute Coronary Syndrome (ACS)",
      confidence_score: 0.91,
    },
  },
  {
    id: "hist_05",
    type: "record",
    title: "Uploaded Record: CBC Blood Panel Report",
    subtitle: "Lab Report • PDF (1.42 MB)",
    timestamp: "2026-07-31T14:00:00Z",
    relativeGroup: "Yesterday",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
    linkTo: "/records/rec_01",
    detailsPayload: {
      category: "Lab Report",
      file_type: "pdf",
      file_size_bytes: 1420000,
    },
  },
  {
    id: "hist_06",
    type: "record",
    title: "Uploaded Record: Chest X-Ray PA View",
    subtitle: "Scan / Imaging • PNG (3.85 MB)",
    timestamp: "2026-07-28T09:30:00Z",
    relativeGroup: "This Week",
    thumbnail: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60",
    linkTo: "/records/rec_02",
    detailsPayload: {
      category: "Scan / Imaging",
      file_type: "image/png",
      file_size_bytes: 3850000,
    },
  },
  {
    id: "hist_07",
    type: "conversation",
    title: "AI Symptom Check: Bronchitis & Cough",
    subtitle: "4 turn conversation in Tamil",
    timestamp: "2026-07-26T16:00:00Z",
    relativeGroup: "This Week",
    linkTo: "/symptom-chat",
    detailsPayload: {
      last_message_excerpt: "வணக்கம்! உங்கள் அறிகுறிகளை அறிய இங்கே உள்ளேன்.",
    },
  },
  {
    id: "hist_08",
    type: "record",
    title: "Uploaded Record: Dr. Sharma Cardiology Prescription",
    subtitle: "Prescription • JPG (980 KB)",
    timestamp: "2026-07-15T10:00:00Z",
    relativeGroup: "Earlier",
    thumbnail: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
    linkTo: "/records/rec_03",
    detailsPayload: {
      category: "Prescription",
      file_type: "image/jpeg",
      file_size_bytes: 980000,
    },
  },
  {
    id: "hist_09",
    type: "scheme_query",
    title: "PM-JAY BPL Family Income Eligibility Query",
    subtitle: "RAG Query • 84% Match Confidence",
    timestamp: "2026-07-10T11:30:00Z",
    relativeGroup: "Earlier",
    linkTo: "/schemes/sch_01",
    detailsPayload: {
      user_question: "What is the family income limit for Ayushman Bharat PM-JAY?",
      ai_answer_excerpt: "BPL families and low-income households qualify for ₹5 Lakhs annual cashless hospitalization cover.",
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

    return results;
  },
};
