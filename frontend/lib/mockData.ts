export interface HealthStatusSummary {
  id: string;
  hasActiveConcern: boolean;
  severity: "normal" | "moderate" | "urgent";
  title: string;
  description: string;
  lastChecked: string;
  actionText?: string;
  actionUrl?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  iconName: "Stethoscope" | "FileUp" | "Building2" | "ShieldAlert" | "User" | "Sparkles" | "FolderUp";
  linkUrl: string;
  badgeText?: string;
  isPrimary?: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: "symptom_consultation" | "document_upload" | "consultation" | "scheme_query";
  timestamp: string;
  status: "Completed" | "Pending" | "Reviewed";
  details: string;
  linkUrl: string;
}

export interface HealthTipItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  linkUrl?: string;
}

export interface DashboardData {
  statusSummary: HealthStatusSummary;
  quickActions: QuickActionItem[];
  recentActivities: ActivityItem[];
  healthTip: HealthTipItem;
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  statusSummary: {
    id: "stat_101",
    hasActiveConcern: false,
    severity: "normal",
    title: "No Active Health Concerns",
    description: "Your health indicators are clear. You can start a symptom check or schedule a routine navigation consultation anytime.",
    lastChecked: "Today, 09:30 AM",
    actionText: "Start Symptom Check",
    actionUrl: "/symptom-chat",
  },
  quickActions: [
    {
      id: "act_1",
      title: "Start Symptom Check",
      description: "Gemini 2.5 Flash multi-turn conversational intake.",
      iconName: "Stethoscope",
      linkUrl: "/symptom-chat",
      badgeText: "AI",
      isPrimary: true,
    },
    {
      id: "act_2",
      title: "Upload Scheme Documents",
      description: "Upload Income Certificate, Aadhaar, Ration Card for eligibility.",
      iconName: "FileUp",
      linkUrl: "/documents",
    },
    {
      id: "act_3",
      title: "Find Nearby Hospital",
      description: "Google Maps-powered nearby hospital finder.",
      iconName: "Building2",
      linkUrl: "/hospitals",
    },
    {
      id: "act_4",
      title: "Check Scheme Eligibility",
      description: "RAG-powered PM-JAY & state scheme eligibility assistant.",
      iconName: "ShieldAlert",
      linkUrl: "/schemes",
    },
  ],
  recentActivities: [
    {
      id: "rec_001",
      title: "Symptom Assessment — Tension Headache",
      category: "symptom_consultation",
      timestamp: "2 hours ago",
      status: "Completed",
      details: "Urgency: NON-URGENT • Specialist: General Physician • 3 conversation turns",
      linkUrl: "/history",
    },
    {
      id: "rec_002",
      title: "Income Certificate Uploaded",
      category: "document_upload",
      timestamp: "Yesterday, 4:15 PM",
      status: "Reviewed",
      details: "Status: Verified • Linked to PM-JAY eligibility assessment.",
      linkUrl: "/documents",
    },
    {
      id: "rec_003",
      title: "Ayushman Vaya Vandana Eligibility Check",
      category: "scheme_query",
      timestamp: "3 days ago",
      status: "Completed",
      details: "Overall Status: ELIGIBLE • 3 criteria assessed • Evidence from 2 documents.",
      linkUrl: "/schemes",
    },
    {
      id: "rec_004",
      title: "Symptom Assessment — Seasonal Allergy",
      category: "consultation",
      timestamp: "1 week ago",
      status: "Completed",
      details: "Urgency: ROUTINE • Specialist: Allergist / Immunologist recommended.",
      linkUrl: "/history",
    },
  ],
  healthTip: {
    id: "tip_881",
    title: "Understanding Hydration & Cognitive Focus",
    summary: "Mild dehydration of just 1.5% can impair mood, concentration, and trigger tension headaches. Aim for 2.5L daily.",
    category: "Preventive Care",
    readTime: "2 min read",
    linkUrl: "/tips",
  },
};
