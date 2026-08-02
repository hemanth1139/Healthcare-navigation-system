export type ConversationStatus = "active" | "completed" | "abandoned";
export type MessageSender = "user" | "agent" | "system";
export type InputType = "text" | "voice";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export interface QuickReplyOption {
  id: string;
  label: string;
  value: string;
}

export interface FollowUpQuestion {
  question_id: string;
  question_text: string;
  options?: QuickReplyOption[];
  allowFreeText?: boolean;
  isAnswered?: boolean;
  selectedOptionId?: string;
}

export interface ConversationMessage {
  message_id: string;
  conversation_id: string;
  sender: MessageSender;
  message: string;
  translated_message?: string;
  created_at: string;
  input_type?: InputType;
  followUpQuestion?: FollowUpQuestion;
  isEmergencyAlert?: boolean;
  predictionId?: string;
}

export interface Conversation {
  conversation_id: string;
  profile_id: string;
  language: string;
  input_type: InputType;
  started_at: string;
  ended_at?: string;
  status: ConversationStatus;
  hasEmergencyAlert?: boolean;
  lastMessageText?: string;
}

export interface VoiceRecorderState {
  status: "idle" | "recording" | "processing" | "transcribed";
  durationSeconds: number;
  transcribedText?: string;
}
