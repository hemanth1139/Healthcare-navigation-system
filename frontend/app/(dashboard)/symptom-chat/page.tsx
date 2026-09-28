"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Bot,
  User,
  Plus,
  PhoneCall,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  Stethoscope,
  Building2,
  Sparkles,
  Info,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

interface PredictionReport {
  prediction_id: string;
  predicted_disease: string;
  confidence_score: number;
  prediction_model?: string;
  triggered_rules?: string[];
  severity?: {
    severity?: string;
    urgency_level?: string;
    emergency_flag?: boolean;
    explanation?: string;
  };
  specialist?: {
    specialist?: string;
    reason?: string;
  };
  primary_symptom?: string;
  associated_symptoms?: string[];
  symptoms_used?: string[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  quickReplies?: string[];
  isEmergency?: boolean;
  predictionReport?: PredictionReport;
}

interface ConversationItem {
  id: string;
  title: string;
  date: string;
  status: "active" | "completed";
  preview: string;
  predictionId?: string;
}

const INITIAL_GREETING: Message = {
  id: "m-init",
  sender: "ai",
  text: "Hello! I am your AI HealthCare Clinical Navigator.\n\nPlease describe the symptoms you are experiencing today (e.g. 'I have had a throbbing headache since this morning' or 'I have severe chest tightness').\n\nI will ask a few follow-up questions to understand your situation and guide you to the appropriate level of care.",
  time: "Just now",
};

export default function SymptomChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [completedPredictionId, setCompletedPredictionId] = useState<string>("");
  const [activePredictionReport, setActivePredictionReport] = useState<PredictionReport | null>(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load patient's conversation list
  const loadConversations = async () => {
    try {
      const { data } = await api.get("/conversations");
      if (Array.isArray(data) && data.length > 0) {
        const list: ConversationItem[] = data.map((c: any) => ({
          id: c.conversationId || c.conversation_id || c.id,
          title: c.lastMessageText ? c.lastMessageText.slice(0, 32) + "..." : "Symptom Assessment",
          date: c.startedAt || c.started_at
            ? new Date(c.startedAt || c.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "Recent",
          status: c.status || "active",
          preview: c.lastMessageText || "Clinical intake session",
          predictionId: c.predictionId,
        }));
        setConversations(list);
      }
    } catch (err) {
      console.warn("[Chat] Could not fetch conversations list:", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // When switching conversations, load messages & prediction report
  const selectConversation = async (convId: string) => {
    setActiveConvId(convId);
    setErrorMessage(null);
    setIsCompleted(false);
    setActivePredictionReport(null);
    setCompletedPredictionId("");

    try {
      const { data: convData } = await api.get(`/conversations/${convId}`);
      if (convData?.messages && Array.isArray(convData.messages)) {
        const mapped: Message[] = convData.messages.map((m: any) => ({
          id: m.message_id || String(Math.random()),
          sender: m.sender === "assistant" || m.sender === "agent" ? "ai" : "user",
          text: m.message,
          time: m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Past",
        }));
        setMessages(mapped.length > 0 ? mapped : [INITIAL_GREETING]);
      }

      if (convData.status === "completed" || convData.predictionId) {
        setIsCompleted(true);
        // Load prediction
        try {
          const { data: predData } = await api.get(`/predictions/${convId}`);
          if (predData) {
            setActivePredictionReport(predData);
            setCompletedPredictionId(predData.prediction_id || convId);
          }
        } catch {
          // No prediction yet
        }
      }
    } catch {
      // Keep default
    }
  };

  const handleNewConversation = async () => {
    setErrorMessage(null);
    try {
      const { data } = await api.post("/conversations", { language: "en", input_type: "text" });
      const newId = data?.conversationId || data?.conversation_id;
      if (!newId) throw new Error("Backend failed to return a valid conversation ID");
      
      const newConv: ConversationItem = {
        id: newId,
        title: "New Symptom Check",
        date: "Just now",
        status: "active",
        preview: "Session initiated...",
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newId);
    } catch (err) {
      console.error("[Chat] Failed to create new conversation:", err);
      setErrorMessage("Failed to start a new symptom assessment. Please try again later.");
      return;
    }

    setMessages([INITIAL_GREETING]);
    setIsCompleted(false);
    setActivePredictionReport(null);
    setCompletedPredictionId("");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setErrorMessage(null);

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    let currentConvId = activeConvId;

    try {
      // Ensure we have a conversation ID
      if (!currentConvId) {
        const { data: convData } = await api.post("/conversations", { language: "en", input_type: "text" });
        currentConvId = convData?.conversationId || convData?.conversation_id;
        if (!currentConvId) throw new Error("Could not initialize a conversation ID.");
        setActiveConvId(currentConvId);
      }

      const res = await api.post(`/conversations/${currentConvId}/messages`, {
        message: text,
        input_type: "text",
      });

      const resData = res.data;
      const responseText =
        resData?.message ||
        "I have recorded your symptoms and evaluated the clinical urgency.";

      const isEmergency = Boolean(resData?.isEmergencyAlert || resData?.is_emergency);

      let quickReplies: string[] | undefined = undefined;
      if (resData?.followUpQuestion?.options && Array.isArray(resData.followUpQuestion.options)) {
        quickReplies = resData.followUpQuestion.options.map((opt: any) => opt.label || opt.value);
      }

      const predictionReport = resData?.predictionReport || null;
      if (predictionReport) {
        setActivePredictionReport(predictionReport);
      }

      const aiMsg: Message = {
        id: `m-${Date.now() + 1}`,
        sender: "ai",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isEmergency,
        quickReplies,
        predictionReport: predictionReport || undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);

      const predId = resData?.predictionId || resData?.prediction_id;
      if (predId || resData?.completed || isEmergency) {
        setCompletedPredictionId(predId || currentConvId);
        setIsCompleted(true);
        // Refresh conversations list in sidebar
        loadConversations();
      }
    } catch (err: any) {
      console.error("[Chat] Send message error:", err);
      setErrorMessage("Unable to continue the symptom assessment. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const getUrgencyBadge = (urgencyLevel?: string) => {
    const norm = (urgencyLevel || "").toUpperCase();
    if (norm.includes("EMERGENCY")) {
      return {
        bg: "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300",
        label: "EMERGENCY",
        dot: "bg-rose-500 animate-ping",
      };
    }
    if (norm.includes("NON_URGENT") || norm.includes("NON-URGENT") || norm.includes("MODERATE")) {
      return {
        bg: "bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300",
        label: "NON-URGENT",
        dot: "bg-teal-500",
      };
    }
    if (norm.includes("URGENT")) {
      return {
        bg: "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300",
        label: "URGENT",
        dot: "bg-amber-500",
      };
    }
    return {
      bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
      label: "ROUTINE",
      dot: "bg-emerald-500",
    };
  };

  return (
    <div className="h-[calc(100vh-115px)] flex flex-col md:flex-row gap-4">
      {/* Left Panel: Past Consultations */}
      <div className="hidden md:flex w-72 flex-col card-clinical p-4 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0D9488]" />
            <span>Consultations</span>
          </span>
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors cursor-pointer"
            title="Start New Symptom Assessment"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No previous consultations recorded yet.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                  activeConvId === conv.id
                    ? "bg-teal-500/10 dark:bg-teal-950/40 border-[#0D9488] shadow-sm"
                    : "border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{conv.title}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      conv.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{conv.preview}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">{conv.date}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Clinical Symptom Intake & Assessment */}
      <div className="flex-1 flex flex-col card-clinical overflow-hidden">
        {/* Header with Title & Guidance */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Symptom Assessment & Clinical Triage
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Describe symptoms naturally • Generative Intake • Python Rule-Based Urgency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <Link
                href={completedPredictionId ? `/predictions/${completedPredictionId}` : "/predictions"}
                className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Full Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <button
              onClick={handleNewConversation}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Check
            </button>
          </div>
        </div>

        {/* Informational Guidance Alert Bar */}
        <div className="px-4 py-2 bg-teal-500/5 border-b border-teal-500/10 text-[11px] text-teal-800 dark:text-teal-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#0D9488]" />
          <span>
            Describe your symptoms and answer follow-up questions to evaluate clinical urgency and connect with the right care.
          </span>
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-end gap-2.5 max-w-[88%] sm:max-w-[80%]">
                {m.sender === "ai" && (
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-[#0D9488] dark:text-[#14B8A6] flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#0D9488] text-white rounded-br-none shadow-md"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                {m.sender === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mb-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>

              {/* Emergency Warning Sign Card */}
              {m.isEmergency && (
                <div className="mt-3 w-full max-w-xl p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/50 text-rose-700 dark:text-rose-300 animate-emergency-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Urgent Medical Attention Required
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        Emergency indicators detected. Please seek immediate professional medical attention or call emergency services.
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:108"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call 108 / 112</span>
                  </a>
                </div>
              )}

              {/* Quick Reply Suggestion Chips */}
              {m.quickReplies && m.quickReplies.length > 0 && !isCompleted && (
                <div className="flex flex-wrap gap-2 mt-3 ml-10">
                  {m.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(reply)}
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-[#0D9488] transition-all shadow-sm cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Inline Assessment Completion Summary Card */}
          {isCompleted && activePredictionReport && (
            <div className="mt-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#0D9488]/30 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Clinical Assessment Outcome
                  </h3>
                </div>

                {/* Urgency Badge */}
                {(() => {
                  const badge = getUrgencyBadge(activePredictionReport.severity?.urgency_level);
                  return (
                    <span className={`px-3 py-1 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Structured Symptoms Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Primary Symptom</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {activePredictionReport.primary_symptom || (activePredictionReport.symptoms_used && activePredictionReport.symptoms_used[0]) || "Reported Concern"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Associated Signs</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {activePredictionReport.associated_symptoms && activePredictionReport.associated_symptoms.length > 0
                      ? activePredictionReport.associated_symptoms.join(", ")
                      : "None"}
                  </span>
                </div>
              </div>

              {/* Rationale & Explanation */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assessment Rationale</span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activePredictionReport.severity?.explanation || "Clinical evaluation completed using deterministic triage rules."}
                </p>
              </div>

              {/* Triggered Red Flags / Indicators */}
              {activePredictionReport.triggered_rules && activePredictionReport.triggered_rules.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Triggered Indicators</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activePredictionReport.triggered_rules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                      >
                        • {rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Specialist & Next Step Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Specialist</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {activePredictionReport.specialist?.specialist || "General Physician"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/hospitals"
                    className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Find Nearby Hospitals</span>
                  </Link>

                  <Link
                    href={`/predictions/${activePredictionReport.prediction_id || completedPredictionId}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  >
                    Detailed Report
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce delay-200" />
                <span className="text-[11px] text-slate-500 ml-1.5">Analyzing symptoms with clinical rules...</span>
              </div>
            </div>
          )}

          {/* Error Message with Retry */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
              <span>{errorMessage}</span>
              <button
                onClick={() => handleSendMessage()}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                isCompleted
                  ? "Assessment complete. Start a new consultation or describe new symptoms..."
                  : "Describe your symptoms (e.g. onset, severity, location)..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="p-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
