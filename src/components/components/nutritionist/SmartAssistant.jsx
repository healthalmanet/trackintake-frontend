import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Fetch Gemini API Key with fallback
const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  "AIzaSyDj2OzDZX-nwDUR9EO7Y9g4-11EdCVHlB4";

const SUGGESTED_PROMPTS = [
  "High protein vegetarian meal ideas",
  "How to balance macros for fat loss?",
  "Healthy Indian snacks for diabetes",
  "Post-workout meal recommendations",
];

const SmartAssistant = ({ isVisible, onClose }) => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your **AI Nutrition Assistant**. Ask me anything about food macros, diet planning, clinical nutrition guidelines, or healthy meal ideas!",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isVisible, messages]);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Answer copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        sender: "ai",
        text: "Conversation cleared. How can I assist you with your nutrition goals today?",
        timestamp: new Date(),
      },
    ]);
  };

  const generateGeminiResponse = async (userQuery) => {
    const systemPrompt = `You are an expert clinical and dietary nutrition assistant for the TrackIntake health platform.
Provide helpful, scientifically grounded, practical, and clear nutrition guidance.
Format your responses neatly using markdown headings, bold text, and bullet points where helpful.
User Query: "${userQuery}"`;

    const modelNames = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-flash-latest",
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();
        if (text) return text;
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next fallback:`, err);
      }
    }

    // Fallback: Attempt local backend chatbot endpoint if Gemini direct fails
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:7000/api";
      const res = await fetch(`${backendUrl}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuery }),
      });
      const data = await res.json();
      if (data.answer && data.answer !== "Answer not found") {
        return data.answer;
      }
    } catch (backendErr) {
      console.warn("Backend chat fallback also unavailable:", backendErr);
    }

    throw new Error("Unable to reach AI services at this moment.");
  };

  const handleSend = async (queryToSend) => {
    const userQuery = (queryToSend || question).trim();
    if (!userQuery || loading) return;

    // Add user message
    const newMessages = [
      ...messages,
      { sender: "user", text: userQuery, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setQuestion("");
    setLoading(true);

    try {
      const aiResponse = await generateGeminiResponse(userQuery);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: aiResponse, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error("SmartAssistant Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I apologize, but I encountered a temporary connection issue. Please try asking your question again.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[var(--color-bg-surface)] rounded-3xl border-2 border-[var(--color-border-default)] shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden font-[var(--font-secondary)]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-2 border-[var(--color-border-default)] flex items-center justify-between bg-gradient-to-r from-[var(--color-bg-surface)] via-[var(--color-bg-surface-alt)] to-[var(--color-bg-surface)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--color-primary)] to-amber-400 flex items-center justify-center text-white shadow-md">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-2">
                    Smart AI Nutrition Assistant
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      Live
                    </span>
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Instant dietary insights, recipe macros & meal guidance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  title="Clear conversation"
                  className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors"
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors"
                  aria-label="Close Assistant"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[var(--color-bg-app)]">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-1 border border-[var(--color-primary)]/20">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm relative group ${
                      msg.sender === "user"
                        ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-tr-none font-medium"
                        : msg.isError
                        ? "bg-red-500/10 text-red-700 border border-red-500/20 rounded-tl-none"
                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-default)] border border-[var(--color-border-default)] rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "ai" ? (
                      <div className="prose prose-sm max-w-none text-[var(--color-text-default)] prose-p:my-1 prose-headings:text-[var(--color-text-strong)] prose-headings:font-bold prose-strong:text-[var(--color-text-strong)] prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {msg.sender === "ai" && !msg.isError && (
                      <button
                        onClick={() => handleCopy(msg.text, idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] text-[11px]"
                        title="Copy answer"
                      >
                        {copiedIndex === idx ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-[var(--color-text-strong)] flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start items-center text-xs text-[var(--color-text-muted)]">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="ml-1 font-medium">Analyzing nutrition databases...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 3 && (
              <div className="px-4 py-2 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)] flex items-center gap-2 overflow-x-auto custom-scrollbar">
                <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                  <Lightbulb size={12} className="text-amber-500" /> Suggestions:
                </span>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    disabled={loading}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-[var(--color-text-default)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all font-medium disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 sm:p-4 bg-[var(--color-bg-surface)] border-t-2 border-[var(--color-border-default)] flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about diet plans, food nutrients, health tips..."
                disabled={loading}
                className="flex-1 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] px-4 py-3 rounded-2xl text-xs sm:text-sm text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all shadow-inner disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="p-3.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SmartAssistant;
