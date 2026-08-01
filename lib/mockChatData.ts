import {
  Conversation,
  ConversationMessage,
  LanguageOption,
  FollowUpQuestion,
} from "@/types/chat";

const delay = (ms: number = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
];

const EMERGENCY_KEYWORDS = [
  "chest pain",
  "heart attack",
  "shortness of breath",
  "cannot breathe",
  "severe bleeding",
  "unconscious",
  "stroke",
  "numbness in arm",
];

// In-memory conversation store for mock demo
let MOCK_CONVERSATIONS: Record<string, Conversation> = {};
let MOCK_MESSAGES: Record<string, ConversationMessage[]> = {};

export const mockChatApi = {
  getLanguages: (): LanguageOption[] => SUPPORTED_LANGUAGES,

  getRecentConversation: async (): Promise<Conversation | null> => {
    await delay(200);
    const keys = Object.keys(MOCK_CONVERSATIONS);
    if (keys.length === 0) return null;
    const active = Object.values(MOCK_CONVERSATIONS).find((c) => c.status === "active");
    return active || Object.values(MOCK_CONVERSATIONS)[keys.length - 1];
  },

  getConversation: async (conversationId: string): Promise<Conversation | null> => {
    await delay(200);
    return MOCK_CONVERSATIONS[conversationId] || null;
  },

  getMessages: async (conversationId: string): Promise<ConversationMessage[]> => {
    await delay(200);
    return MOCK_MESSAGES[conversationId] || [];
  },

  startConversation: async (
    profileId: string,
    language: string = "en",
    inputType: "text" | "voice" = "text"
  ): Promise<Conversation> => {
    await delay(300);
    const conversationId = `conv_${Date.now()}`;
    const newConv: Conversation = {
      conversation_id: conversationId,
      profile_id: profileId,
      language: language,
      input_type: inputType,
      started_at: new Date().toISOString(),
      status: "active",
      lastMessageText: "Conversation started.",
    };

    MOCK_CONVERSATIONS[conversationId] = newConv;

    // Initial greeting from Clinical Agent
    const initialGreeting: ConversationMessage = {
      message_id: `msg_init_${Date.now()}`,
      conversation_id: conversationId,
      sender: "agent",
      message:
        "Hello! I am your AI HealthCare Navigator. I am here to help triage your symptoms and guide your care steps. Please describe what you are experiencing.",
      translated_message:
        language === "ta"
          ? "வணக்கம்! நான் உங்கள் AI சுகாதார வழிகாட்டி. உங்கள் அறிகுறிகளை அறிய இங்கே உள்ளேன்."
          : language === "hi"
          ? "नमस्ते! मैं आपका एआई स्वास्थ्य नेविगेटर हूँ। अपने लक्षण बताएं।"
          : undefined,
      created_at: new Date().toISOString(),
      followUpQuestion: {
        question_id: "fq_1",
        question_text: "How long have you been experiencing these main symptoms?",
        options: [
          { id: "opt_1", label: "Less than 24 hours", value: "< 24 hours" },
          { id: "opt_2", label: "1 - 3 days", value: "1-3 days" },
          { id: "opt_3", label: "More than a week", value: "> 1 week" },
        ],
        allowFreeText: true,
      },
    };

    MOCK_MESSAGES[conversationId] = [initialGreeting];
    return newConv;
  },

  sendMessage: async (
    conversationId: string,
    userText: string,
    inputType: "text" | "voice" = "text"
  ): Promise<{ userMsg: ConversationMessage; agentMsg: ConversationMessage }> => {
    await delay(500);

    const conv = MOCK_CONVERSATIONS[conversationId];
    const currentLang = conv?.language || "en";

    // 1. Record user message
    const userMsg: ConversationMessage = {
      message_id: `msg_usr_${Date.now()}`,
      conversation_id: conversationId,
      sender: "user",
      message: userText,
      created_at: new Date().toISOString(),
      input_type: inputType,
    };

    if (!MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId] = [];
    }
    MOCK_MESSAGES[conversationId].push(userMsg);

    // 2. Check for Emergency Trigger
    const lower = userText.toLowerCase();
    const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));

    let agentMsg: ConversationMessage;

    if (isEmergency) {
      if (conv) conv.hasEmergencyAlert = true;
      agentMsg = {
        message_id: `msg_agt_${Date.now()}`,
        conversation_id: conversationId,
        sender: "agent",
        isEmergencyAlert: true,
        message:
          "CRITICAL EMERGENCY ALERT DETECTED: Based on your symptoms (chest pain / severe distress), this may require immediate emergency medical care. Please call emergency services (108 / 911) or seek the nearest emergency department immediately.",
        translated_message:
          currentLang === "hi"
            ? "आपातकालीन चेतावनी: सीने में दर्द या सांस लेने में तकलीफ के लिए तुरंत 108 पर कॉल करें या निकटतम अस्पताल जाएं।"
            : currentLang === "ta"
            ? "அவசர எச்சரிக்கை: நெஞ்சு வலி அல்லது மூச்சுத்திணறலுக்கு உடனடியாக 108 ஐ அழைக்கவும்."
            : undefined,
        created_at: new Date().toISOString(),
      };
    } else {
      const turnCount = MOCK_MESSAGES[conversationId].filter((m) => m.sender === "user").length;

      if (turnCount === 1) {
        agentMsg = {
          message_id: `msg_agt_${Date.now()}`,
          conversation_id: conversationId,
          sender: "agent",
          message:
            "Thank you for sharing that context. On a scale of mild to severe, how would you describe the intensity of your discomfort?",
          created_at: new Date().toISOString(),
          followUpQuestion: {
            question_id: "fq_2",
            question_text: "Rate your pain or discomfort severity:",
            options: [
              { id: "sev_1", label: "Mild (1-3)", value: "Mild pain" },
              { id: "sev_2", label: "Moderate (4-6)", value: "Moderate pain" },
              { id: "sev_3", label: "Severe (7-10)", value: "Severe pain" },
            ],
            allowFreeText: true,
          },
        };
      } else if (turnCount === 2) {
        agentMsg = {
          message_id: `msg_agt_${Date.now()}`,
          conversation_id: conversationId,
          sender: "agent",
          message:
            "Got it. Are you experiencing any of these associated symptoms along with your main concern?",
          created_at: new Date().toISOString(),
          followUpQuestion: {
            question_id: "fq_3",
            question_text: "Select any co-occurring symptoms:",
            options: [
              { id: "sym_1", label: "Fever or Chills", value: "Fever/Chills" },
              { id: "sym_2", label: "Nausea or Dizziness", value: "Nausea/Dizziness" },
              { id: "sym_3", label: "Fatigue / Weakness", value: "Fatigue" },
              { id: "sym_4", label: "None of these", value: "No co-occurring symptoms" },
            ],
            allowFreeText: true,
          },
        };
      } else {
        // Triage Assessment Complete
        agentMsg = {
          message_id: `msg_agt_${Date.now()}`,
          conversation_id: conversationId,
          sender: "agent",
          message:
            "I have completed your initial symptom triage assessment. Based on your inputs, your triage severity is MODERATE. I have generated a detailed clinical summary and recommended next navigation steps.",
          predictionId: "pred_101",
          created_at: new Date().toISOString(),
        };
        if (conv) conv.status = "completed";
      }
    }

    MOCK_MESSAGES[conversationId].push(agentMsg);
    if (conv) conv.lastMessageText = agentMsg.message;

    return { userMsg, agentMsg };
  },

  switchLanguage: async (conversationId: string, newLang: string): Promise<ConversationMessage> => {
    await delay(200);
    if (MOCK_CONVERSATIONS[conversationId]) {
      MOCK_CONVERSATIONS[conversationId].language = newLang;
    }

    const langName = SUPPORTED_LANGUAGES.find((l) => l.code === newLang)?.name || newLang;

    const sysMsg: ConversationMessage = {
      message_id: `sys_${Date.now()}`,
      conversation_id: conversationId,
      sender: "system",
      message: `Language switched to ${langName}. Future responses will be translated automatically.`,
      created_at: new Date().toISOString(),
    };

    if (!MOCK_MESSAGES[conversationId]) MOCK_MESSAGES[conversationId] = [];
    MOCK_MESSAGES[conversationId].push(sysMsg);
    return sysMsg;
  },

  endConversation: async (conversationId: string): Promise<void> => {
    await delay(300);
    if (MOCK_CONVERSATIONS[conversationId]) {
      MOCK_CONVERSATIONS[conversationId].status = "completed";
      MOCK_CONVERSATIONS[conversationId].ended_at = new Date().toISOString();
    }
  },
};
