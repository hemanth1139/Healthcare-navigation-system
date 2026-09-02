"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ta";

export interface Translations {
  // Navigation
  dashboard: string;
  symptomChat: string;
  history: string;
  schemes: string;
  documents: string;
  hospitals: string;
  specialists: string;
  tips: string;
  patientProfile: string;
  settings: string;
  
  // App Bar
  portalTitle: string;
  selectLanguage: string;
  english: string;
  tamil: string;
  notifications: string;

  // Dashboard Page
  welcomeBack: string;
  dashboardSub: string;
  latestAssessment: string;
  viewAllConsultations: string;
  quickActionsTitle: string;
  tipOfTheDay: string;
  quickAccess: string;

  // Patient Profile Page
  profileTitle: string;
  profileSubtitle: string;
  personalInformation: string;
  fullName: string;
  age: string;
  gender: string;
  bloodGroup: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  chronicConditionsTitle: string;
  knownAllergiesTitle: string;
  currentMedicationsTitle: string;
  emergencyContactTitle: string;
  editProfile: string;
  saveChanges: string;

  // Symptom Chat
  symptomChatTitle: string;
  symptomChatSubtitle: string;
  typeSymptomPlaceholder: string;
  send: string;
  patientContext: string;
  disclaimerNotice: string;
  howItWorks: string;
  howItWorksDesc: string;
  tellUsBothering: string;
  tellUsBotheringDesc: string;
  startSymptomCheckBtn: string;
  
  // Urgency Levels
  emergency: string;
  urgent: string;
  nonUrgent: string;
  routine: string;

  // Schemes
  schemeTitle: string;
  schemeSubtitle: string;
  checkEligibility: string;
  uploadDocuments: string;
  askSchemePlaceholder: string;
  multiDocRAG: string;

  // Documents
  uploadSchemeDocTitle: string;
  uploadSchemeDocSub: string;
  dragDropTitle: string;
  dragDropSub: string;
  browseFiles: string;

  // Health Tips
  healthTipsTitle: string;
  healthTipsSub: string;
  medicalDisclaimer: string;
  medicalDisclaimerDesc: string;

  // Quick Actions
  startSymptomCheck: string;
  findHospital: string;
  recentActivity: string;
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: "Dashboard",
    symptomChat: "Symptom Assessment",
    history: "Consultation History",
    schemes: "Government Schemes",
    documents: "Scheme Documents",
    hospitals: "Nearby Hospitals",
    specialists: "Find Specialists",
    tips: "Health Tips",
    patientProfile: "Patient Profile",
    settings: "Settings",

    portalTitle: "Healthcare Navigation Portal",
    selectLanguage: "Language",
    english: "English",
    tamil: "தமிழ் (Tamil)",
    notifications: "Notifications",

    welcomeBack: "Welcome back",
    dashboardSub: "Your AI-assisted healthcare navigation dashboard — consultations, urgency assessment, and scheme eligibility.",
    latestAssessment: "Latest Severity & Urgency Assessment",
    viewAllConsultations: "View all consultations",
    quickActionsTitle: "Quick Actions & Clinical Tools",
    tipOfTheDay: "Tip of the Day",
    quickAccess: "Quick Access",

    profileTitle: "Patient Medical Profile",
    profileSubtitle: "Personal demographic details, chronic conditions, active medications, and emergency contacts.",
    personalInformation: "Personal Information",
    fullName: "Full Name",
    age: "Age",
    gender: "Gender",
    bloodGroup: "Blood Group",
    contactNumber: "Contact Number",
    emailAddress: "Email Address",
    address: "Residential Address",
    chronicConditionsTitle: "Chronic Medical Conditions",
    knownAllergiesTitle: "Known Allergies",
    currentMedicationsTitle: "Current Active Medications",
    emergencyContactTitle: "Emergency Contact Person",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",

    symptomChatTitle: "Symptom Assessment",
    symptomChatSubtitle: "Powered by Gemini 2.5 Flash — Conversational multi-turn symptom intake",
    typeSymptomPlaceholder: "Describe your symptoms (e.g., 'Severe headache for 2 days with mild fever')...",
    send: "Send",
    patientContext: "Patient Context Injected",
    disclaimerNotice: "Not a substitute for emergency medical care. In an emergency, call 108 immediately.",
    howItWorks: "How it works:",
    howItWorksDesc: "Describe your main symptom, and the AI will ask targeted follow-up questions to gather complete information. Response is evaluated by the clinical rule engine for urgency level.",
    tellUsBothering: "Tell us what's bothering you",
    tellUsBotheringDesc: "Share your symptoms in plain language or voice audio. Our AI Clinical Assistant will guide your triage steps.",
    startSymptomCheckBtn: "Start Symptom Check",

    emergency: "EMERGENCY CARE REQUIRED",
    urgent: "URGENT MEDICAL EVALUATION",
    nonUrgent: "NON-URGENT CONSULTATION",
    routine: "ROUTINE HEALTHCARE",

    schemeTitle: "Government Healthcare Schemes",
    schemeSubtitle: "RAG-powered eligibility assessment using official scheme documents",
    checkEligibility: "Check Scheme Eligibility",
    uploadDocuments: "Upload Supporting Documents",
    askSchemePlaceholder: "Ask about scheme eligibility or benefits (e.g. Am I eligible for PM-JAY?)...",
    multiDocRAG: "Multi-Document RAG Eligibility Assessment",

    uploadSchemeDocTitle: "Scheme Eligibility Supporting Documents",
    uploadSchemeDocSub: "Upload documents to verify eligibility criteria for PM-JAY and state healthcare schemes.",
    dragDropTitle: "Drag & drop supporting documents here",
    dragDropSub: "Supports PDF, PNG, JPG, and WEBP files (Max 10MB each)",
    browseFiles: "Browse Files",

    healthTipsTitle: "Health Guidance & Wellness",
    healthTipsSub: "Evidence-based wellness tips and preventive health guidance",
    medicalDisclaimer: "Important Medical Disclaimer",
    medicalDisclaimerDesc: "These tips are for general information only and do not constitute a medical diagnosis. Call 108 for medical emergencies.",

    startSymptomCheck: "Start Symptom Check",
    findHospital: "Find Nearby Hospital",
    recentActivity: "Recent Activity & Consultations",
  },
  ta: {
    dashboard: "முகப்பு",
    symptomChat: "அறிகுறி மதிப்பீடு",
    history: "ஆலோசனை வரலாறு",
    schemes: "அரசு திட்டங்கள்",
    documents: "திட்ட ஆவணங்கள்",
    hospitals: "மருத்துவமனைகள்",
    specialists: "நிபுணர்கள்",
    tips: "சுகாதார குறிப்புகள்",
    patientProfile: "நோயாளி சுயவிவரம்",
    settings: "அமைப்புகள்",

    portalTitle: "சுகாதார வழிகாட்டி மையம்",
    selectLanguage: "மொழி",
    english: "English",
    tamil: "தமிழ் (Tamil)",
    notifications: "அறிவிப்புகள்",

    welcomeBack: "நல்வரவு",
    dashboardSub: "உங்கள் AI சுகாதார வழிகாட்டி முகப்பு — ஆலோசனைகள், அவசர நிலை மதிப்பீடு மற்றும் அரசு திட்ட தகுதி.",
    latestAssessment: "சமீபத்திய அவசர நிலை மதிப்பீடு",
    viewAllConsultations: "அனைத்து வரலாற்றையும் காண்க",
    quickActionsTitle: "விரைவு சேவைகள் மற்றும் மருத்துவ கருவிகள்",
    tipOfTheDay: "இன்றைய ஆரோக்கிய குறிப்பு",
    quickAccess: "விரைவு அணுகல்",

    profileTitle: "நோயாளி மருத்துவ சுயவிவரம்",
    profileSubtitle: "தனிப்பட்ட விவரங்கள், நாள்பட்ட நோய்கள், மருந்துகள் மற்றும் அவசர கால தொடர்பு விவரங்கள்.",
    personalInformation: "தனிப்பட்ட விவரங்கள்",
    fullName: "முழு பெயர்",
    age: "வயது",
    gender: "பாலினம்",
    bloodGroup: "இரத்த வகை",
    contactNumber: "தொடர்பு எண்",
    emailAddress: "மின்னஞ்சல் முகவரி",
    address: "இருப்பிட முகவரி",
    chronicConditionsTitle: "நாள்பட்ட மருத்துவ நிலைகள்",
    knownAllergiesTitle: "அறியப்பட்ட ஒவ்வாமைகள் (Allergies)",
    currentMedicationsTitle: "தற்போதைய மருந்துகள்",
    emergencyContactTitle: "அவசர கால தொடர்பு நபர்",
    editProfile: "சுயவிவரத்தைத் திருத்து",
    saveChanges: "மாற்றங்களைச் சேமி",

    symptomChatTitle: "அறிகுறி மதிப்பீடு",
    symptomChatSubtitle: "Gemini 2.5 Flash மூலம் இயங்கும் AI உரையாடல் அறிகுறி ஆய்வு",
    typeSymptomPlaceholder: "உங்கள் உடல்நல அறிகுறிகளை தமிழ் அல்லது ஆங்கிலத்தில் விவரிக்கவும்...",
    send: "அனுப்பு",
    patientContext: "நோயாளி சுகாதார விவரங்கள் சேர்க்கப்பட்டன",
    disclaimerNotice: "இது அவசர மருத்துவ சிகிச்சைக்கு மாற்றாகாது. அவசர நிலைக்கு 108ஐ உடனடியாக அழைக்கவும்.",
    howItWorks: "இது எவ்வாறு செயல்படுகிறது:",
    howItWorksDesc: "உங்கள் முக்கிய அறிகுறிகளை விவரிக்கவும். AI உங்களிடம் கேள்வி கேட்டு முழு தகவலைப் பெறும். மருத்துவ விதி இயந்திரம் அவசர நிலையை மதிப்பிடும்.",
    tellUsBothering: "உங்கள் உடல்நலப் பிரச்சனையை தெரிவிக்கவும்",
    tellUsBotheringDesc: "உங்கள் அறிகுறிகளை எளிய தமிழில் எழுதவும் அல்லது குரல் மூலம் கூறவும். AI உங்களுக்கு வழிகாட்டும்.",
    startSymptomCheckBtn: "அறிகுறி சோதனையைத் தொடங்குங்கள்",

    emergency: "உடனடி அவசர சிகிச்சை தேவை",
    urgent: "விரைவு மருத்துவ பரிசோதனை தேவை",
    nonUrgent: "சாதாரண மருத்துவ ஆலோசனை",
    routine: "வழக்கமான பராமரிப்பு",

    schemeTitle: "அரசு சுகாதார திட்டங்கள்",
    schemeSubtitle: "அரசு மருத்துவக் காப்பீட்டு திட்டங்களின் RAG தகுதி ஆய்வு",
    checkEligibility: "திட்ட தகுதியை சரிபார்க்கவும்",
    uploadDocuments: "ஆதார ஆவணங்களைப் பதிவேற்றுங்கள்",
    askSchemePlaceholder: "திட்டத் தகுதி அல்லது நன்மைகள் குறித்து தமிழில் கேட்கவும்...",
    multiDocRAG: "பல்வேறு ஆவண RAG தகுதி ஆய்வு",

    uploadSchemeDocTitle: "திட்டத் தகுதி ஆதரவு ஆவணங்கள்",
    uploadSchemeDocSub: "பிரதான் மந்திரி ஜன ஆரோக்கிய யோஜனா (PM-JAY) மற்றும் மாநில திட்ட தகுதி ஆவணங்களைப் பதிவேற்றவும்.",
    dragDropTitle: "ஆதார ஆவணங்களை இங்கே பதிவேற்ற இழுத்து விடவும்",
    dragDropSub: "PDF, PNG, JPG மற்றும் WEBP கோப்புகளை ஆதரிக்கிறது (அதிகபட்சம் 10MB)",
    browseFiles: "கோப்புகளைத் தேர்ந்தெடுக்கவும்",

    healthTipsTitle: "சுகாதார வழிகாட்டுதல் மற்றும் குறிப்புகள்",
    healthTipsSub: "ஆதாரப்பூர்வமான ஆரோக்கிய குறிப்புகள் மற்றும் நோய் தடுப்பு வழிகாட்டல்",
    medicalDisclaimer: "முக்கிய மருத்துவ எச்சரிக்கை",
    medicalDisclaimerDesc: "இந்த குறிப்புகள் பொதுவான தகவலுக்கு மட்டுமே. மருத்துவ அவசரநிலைக்கு 108ஐ அழைக்கவும்.",

    startSymptomCheck: "அறிகுறி சோதனையைத் தொடங்குங்கள்",
    findHospital: "அருகிலுள்ள மருத்துவமனையைக் கண்டறியவும்",
    recentActivity: "சமீபத்திய ஆலோசனைகள் மற்றும் செயல்பாடுகள்",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("app_language") as Language;
    if (saved === "en" || saved === "ta") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
