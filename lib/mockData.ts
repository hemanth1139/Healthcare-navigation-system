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
  iconName: "Stethoscope" | "FileUp" | "Building2" | "ShieldAlert" | "User" | "Sparkles";
  linkUrl: string;
  badgeText?: string;
  isPrimary?: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  category: "prediction" | "record" | "consultation" | "scheme";
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
      description: "AI-assisted clinical triage and navigation guidance.",
      iconName: "Stethoscope",
      linkUrl: "/symptom-chat",
      badgeText: "AI Recommended",
      isPrimary: true,
    },
    {
      id: "act_2",
      title: "Upload Medical Record",
      description: "Securely upload lab reports, prescriptions, or imaging.",
      iconName: "FileUp",
      linkUrl: "/records",
    },
    {
      id: "act_3",
      title: "Find a Hospital",
      description: "Locate nearby emergency centers & specialist clinics.",
      iconName: "Building2",
      linkUrl: "/hospitals",
    },
    {
      id: "act_4",
      title: "Check Scheme Eligibility",
      description: "Explore government health insurance & subsidies.",
      iconName: "ShieldAlert",
      linkUrl: "/schemes",
    },
  ],
  recentActivities: [
    {
      id: "rec_001",
      title: "Symptom Assessment - Mild Migraine",
      category: "prediction",
      timestamp: "2 hours ago",
      status: "Completed",
      details: "Triage recommendation: Hydration & rest. Follow up if persistent.",
      linkUrl: "/predictions",
    },
    {
      id: "rec_002",
      title: "Blood Panel Report Uploaded",
      category: "record",
      timestamp: "Yesterday, 4:15 PM",
      status: "Reviewed",
      details: "CBC & Lipid Panel added to personal health repository.",
      linkUrl: "/records",
    },
    {
      id: "rec_003",
      title: "Government Subsidy Verification",
      category: "scheme",
      timestamp: "3 days ago",
      status: "Completed",
      details: "Eligible for Ayushman Bharat PM-JAY Tier 1 coverage.",
      linkUrl: "/schemes",
    },
    {
      id: "rec_004",
      title: "Virtual Specialist Consultation",
      category: "consultation",
      timestamp: "1 week ago",
      status: "Completed",
      details: "Dr. Aris Thorne (Cardiology) - Routine checkup notes added.",
      linkUrl: "/specialists",
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
