"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Mic,
  Bot,
  User,
  Plus,
  PhoneCall,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  quickReplies?: string[];
  isEmergency?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  date: string;
  status: "active" | "completed";
  preview: string;
}

const INITIAL_GREETING: Message = {
  id: "m-init",
  sender: "ai",
  text: "Hello! I am your AI HealthCare Navigator. Please describe the symptoms you are experiencing today, including when they started and how severe they feel.",
  time: "Just now",
};

export default function SymptomChatPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [completedPredictionId, setCompletedPredictionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/conversations")
      .then(({ data }) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const list: ConversationItem[] = data.map((c: any) => ({
            id: c.conversation_id || c.id,
            title: c.summary || "Symptom Consultation",
            date: c.started_at
              ? new Date(c.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Recent",
            status: c.status || "completed",
            preview: c.last_message || "Clinical intake session",
          }));
          setConversations(list);
          setActiveConvId(list[0].id);
        }
      })
      .catch((err) => {
        console.warn("[Chat] Could not fetch conversations list:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNewConversation = async () => {
    try {
      const { data } = await api.post("/conversations", { language: "en", input_type: "text" });
      const newId = data?.conversation_id || `conv_${Date.now()}`;
      const newConv: ConversationItem = {
        id: newId,
        title: "New Symptom Check",
        date: "Just now",
        status: "active",
        preview: "Session initiated...",
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newId);
    } catch {
      const fallbackId = `conv_${Date.now()}`;
      setActiveConvId(fallbackId);
    }

    setMessages([INITIAL_GREETING]);
    setIsCompleted(false);
    setCompletedPredictionId("");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    try {
      let currentConvId = activeConvId;
      if (!currentConvId) {
        const { data: convData } = await api.post("/conversations", { language: "en", input_type: "text" });
        currentConvId = convData?.conversation_id || `conv_${Date.now()}`;
        setActiveConvId(currentConvId);
      }

      const { data: resData } = await api.post(`/conversations/${currentConvId}/messages`, {
        message: text,
        input_type: "text",
      });

      const responseText =
        resData?.message ||
        resData?.content ||
        "I have recorded your symptoms. If you experience worsening pain, breathlessness, or dizziness, seek medical attention immediately.";

      const isEmergency = Boolean(
        resData?.is_emergency ||
          /chest pain|heart attack|cannot breathe|severe bleeding/i.test(text)
      );

      const aiMsg: Message = {
        id: `m-${Date.now() + 1}`,
        sender: "ai",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isEmergency,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (resData?.prediction_id || resData?.completed) {
        setCompletedPredictionId(resData.prediction_id || currentConvId);
        setIsCompleted(true);
      }
    } catch (err) {
      console.warn("[Chat] Backend send message error, generating safe response:", err);
      const isEmergency = /chest pain|heart attack|cannot breathe|severe bleeding/i.test(text);
      const aiMsg: Message = {
        id: `m-${Date.now() + 1}`,
        sender: "ai",
        text: isEmergency
          ? "CRITICAL WARNING: If you are having chest pain or acute breathing difficulty, please proceed immediately to an emergency care facility or call 108."
          : "Thank you for describing your symptoms. Are there any other accompanying issues such as fever, sweating, or pain radiation?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isEmergency,
        quickReplies: isEmergency
          ? undefined
          : ["No other symptoms", "Mild fever", "Dizziness or weakness"],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-115px)] flex flex-col md:flex-row gap-4">
      {/* Left Panel (Desktop): Previous Conversations */}
      <div className="hidden md:flex w-72 flex-col card-clinical p-4 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0D9488]" />
            <span>Consultations</span>
          </span>
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white transition-colors"
            title="Start New Conversation"
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
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all ${
                  activeConvId === conv.id
                    ? "bg-teal-500/10 dark:bg-teal-950/40 border-[#0D9488] shadow-sm"
                    : "border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{conv.title}</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        conv.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{conv.preview}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">{conv.date}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Active Chat Area */}
      <div className="flex-1 flex flex-col card-clinical overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  AI Clinical Triage Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Powered by Gemini 2.5 Flash • Clinical Guidance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <Link
                href={completedPredictionId ? `/predictions/${completedPredictionId}` : "/predictions"}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white font-bold text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
              >
                <span>View Prediction Report</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={handleNewConversation}
              className="md:hidden px-3 py-1.5 rounded-xl bg-[#0D9488] text-white text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
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

              {/* Emergency Alert Red Banner */}
              {m.isEmergency && (
                <div className="mt-3 w-full max-w-xl p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-700 dark:text-rose-300 animate-emergency-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Emergency Warning Sign Detected
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        If you experience severe tightness, fainting, or pain radiating to arms, seek emergency care immediately.
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:108"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call 108</span>
                  </a>
                </div>
              )}

              {/* Quick Reply Option Buttons */}
              {m.quickReplies && m.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 ml-10">
                  {m.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(reply)}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-[#0D9488] transition-all shadow-sm cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator Animation */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-[#0D9488] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>

        {/* Completion Action Callout Banner */}
        {isCompleted && (
          <div className="p-3 bg-teal-500/10 border-t border-teal-500/20 px-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0D9488] dark:text-[#14B8A6] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Assessment Completed • Diagnostic Prediction Ready</span>
            </span>
            <Link
              href={completedPredictionId ? `/predictions/${completedPredictionId}` : "/predictions"}
              className="px-4 py-1.5 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition-colors"
            >
              View Report
            </Link>
          </div>
        )}

        {/* Text Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2.5 rounded-xl text-slate-400 hover:text-[#0D9488] hover:bg-teal-50 dark:hover:bg-slate-900 transition-colors"
              title="Voice Input (Microphone)"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder="Describe your symptoms (e.g. headache, fever, cough)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#0D9488]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
