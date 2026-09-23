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
    title: "Health Navigation Ready",
    description: "Start a symptom check or find nearby healthcare facilities anytime.",
    lastChecked: "Just now",
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
      description: "Nearby hospital finder.",
      iconName: "Building2",
      linkUrl: "/hospitals",
    },
    {
      id: "act_4",
      title: "Check Scheme Eligibility",
      description: "PM-JAY & state scheme eligibility assistant.",
      iconName: "ShieldAlert",
      linkUrl: "/schemes",
    },
  ],
  recentActivities: [],
  healthTip: {
    id: "",
    title: "Preventive Care",
    summary: "Stay hydrated and consult a qualified healthcare provider for personalized medical advice.",
    category: "General",
    readTime: "1 min read",
    linkUrl: "/health-tips",
  },
};
