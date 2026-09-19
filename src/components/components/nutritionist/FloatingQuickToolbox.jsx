import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Bot,
  Salad,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  Loader2,
  User,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  Paperclip,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { GoogleGenerativeAI } from "@google/generative-ai";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import NutritionSearch from "../../../pages/dashboard/Tools/NutritionSearch";
import {
  getMessages,
  sendMessage as sendNutriMessage,
  getAssignedPatients,
  markMessageAsRead,
} from "../../../api/nutritionistApi";
import {
  getMessages as getPatientMessages,
  sendMessage as sendPatientMessage,
  getMyNutritionist,
} from "../../../api/messagePatientApi";
import useWebSockets from "../../../api/useWebSockets";

const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  "AIzaSyDj2OzDZX-nwDUR9EO7Y9g4-11EdCVHlB4";

const SUGGESTED_ASSISTANT_PROMPTS = [
  "High protein vegetarian meal ideas",
  "How to balance macros for fat loss?",
  "Healthy Indian snacks for diabetes",
  "Post-workout meal recommendations",
];

const QUICK_NUTRITIONIST_SNIPPETS = [
  "Please log your meals for today in the meal tracker.",
  "Your lab reports look great! Let's continue this diet plan.",
  "Remember to maintain 2.5–3L water intake throughout the day.",
  "I have updated your weekly dietary instructions.",
];

export const FloatingQuickToolbox = ({
  isOpen,
  onClose,
  initialTab = "assistant",
  userRole = "nutritionist",
  targetPatientId = null,
  targetPatientName = null,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");

  // Whenever isOpen or initialTab updates, automatically restore/un-minimize the window
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setIsMinimized(false);
    }
  }, [initialTab]);

  // ----------------------------------------------------------------------
  // 1. CHAT / MESSAGES STATE & LOGIC
  // ----------------------------------------------------------------------
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [chatInputText, setChatInputText] = useState("");
  const [myNutritionistInfo, setMyNutritionistInfo] = useState(null);
  const chatBottomRef = useRef(null);

  // Normalize patient object
  const normalizePatient = (p) => ({
    id: p.patient_id || p.id,
    patient_id: p.patient_id || p.id,
    name: p.full_name || p.patient_name || p.name || `Patient #${p.patient_id || p.id}`,
    email: p.patient_email || p.email || "",
    phone: p.phone_number || "",
  });

  // Load patients for nutritionist
  const fetchNutritionistPatients = useCallback(async () => {
    if (userRole !== "nutritionist") return;
    try {
      const res = await getAssignedPatients();
      const rawList = res.data?.results || res.data || [];
      const list = rawList.map(normalizePatient);
      setPatientsList(list);

      // Auto-select if targetPatientId passed or first patient
      if (targetPatientId) {
        const found = list.find((p) => String(p.id) === String(targetPatientId));
        if (found) {
          setSelectedPatient(found);
        } else {
          setSelectedPatient({
            id: targetPatientId,
            patient_id: targetPatientId,
            name: targetPatientName || `Patient #${targetPatientId}`,
            email: "",
          });
        }
      } else if (list.length > 0 && !selectedPatient) {
        setSelectedPatient(list[0]);
      }
    } catch (err) {
      console.error("Failed to fetch assigned patients for quick chat:", err);
    }
  }, [userRole, targetPatientId, targetPatientName, selectedPatient]);

  // Load patient's nutritionist info if user role
  const fetchPatientNutritionist = useCallback(async () => {
    if (userRole !== "user") return;
    try {
      const res = await getMyNutritionist();
      if (res.data) {
        setMyNutritionistInfo(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch patient nutritionist info:", err);
    }
  }, [userRole]);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      if (userRole === "nutritionist") {
        fetchNutritionistPatients();
      } else {
        fetchPatientNutritionist();
      }
    }
  }, [isOpen, activeTab, userRole, fetchNutritionistPatients, fetchPatientNutritionist]);

  // Fetch messages with selected counterparty
  const loadChatHistory = useCallback(async () => {
    setLoadingChat(true);
    try {
      if (userRole === "nutritionist" && selectedPatient) {
        const patientId = selectedPatient.patient_id || selectedPatient.id;
        const res = await getMessages({ partner_id: patientId });
        const msgs = res.data?.results || res.data || [];
        setChatMessages(
          msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        );
        try {
          await markMessageAsRead({ sender_id: patientId });
        } catch {
          // ignore
        }
      } else if (userRole === "user") {
        const nutriId = myNutritionistInfo?.id;
        const res = await getPatientMessages(nutriId ? { partner_id: nutriId } : {});
        const msgs = res.data?.results || res.data || [];
        setChatMessages(
          msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        );
      }
    } catch (err) {
      console.error("Failed to load quick chat history:", err);
    } finally {
      setLoadingChat(false);
    }
  }, [userRole, selectedPatient, myNutritionistInfo]);

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === "chat") {
      loadChatHistory();
    }
  }, [isOpen, isMinimized, activeTab, loadChatHistory]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Real-time WebSocket updates for chat
  const handleIncomingChatMessage = useCallback(
    (msg) => {
      if (userRole === "nutritionist" && selectedPatient) {
        const patientId = selectedPatient.patient_id || selectedPatient.id;
        if (String(msg.sender_id) === String(patientId)) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      } else if (userRole === "user") {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    },
    [userRole, selectedPatient]
  );

  useWebSockets({ onMessage: handleIncomingChatMessage });

  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInputText.trim() || sendingChat) return;

    const textToSend = chatInputText.trim();
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender_id: user?.id,
      text: textToSend,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    // Instant optimistic render
    setChatMessages((prev) => [...prev, optimisticMsg]);
    setChatInputText("");
    setSendingChat(true);

    try {
      if (userRole === "nutritionist" && selectedPatient) {
        const patientId = selectedPatient.patient_id || selectedPatient.id;
        const res = await sendNutriMessage(patientId, textToSend);
        const serverMsg = res.data || {
          ...optimisticMsg,
          id: Date.now(),
          status: "sent",
        };
        setChatMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...serverMsg, status: "sent" } : m))
        );
      } else if (userRole === "user") {
        const res = await sendPatientMessage(textToSend);
        const serverMsg = res.data || {
          ...optimisticMsg,
          id: Date.now(),
          status: "sent",
        };
        setChatMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...serverMsg, status: "sent" } : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message. Please retry.");
      // Rollback optimistic message and restore input
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatInputText(textToSend);
    } finally {
      setSendingChat(false);
    }
  };

  // ----------------------------------------------------------------------
  // 2. SMART ASSISTANT STATE & LOGIC
  // ----------------------------------------------------------------------
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your **AI Clinical Nutrition Assistant**. Ask me about food macros, glycemic index, clinical diet protocols, or meal customizations!",
      timestamp: new Date(),
    },
  ]);
  const [loadingAssistant, setLoadingAssistant] = useState(false);
  const [copiedAssistantIdx, setCopiedAssistantIdx] = useState(null);
  const assistantBottomRef = useRef(null);

  const handleCopyAssistant = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedAssistantIdx(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedAssistantIdx(null), 2000);
  };

  const handleClearAssistant = () => {
    setAssistantMessages([
      {
        sender: "ai",
        text: "Conversation cleared. How can I assist you with clinical nutrition analysis today?",
        timestamp: new Date(),
      },
    ]);
  };

  const generateGeminiAssistant = async (userQuery) => {
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

    return "### 💡 Clinical Nutrition Summary\n\n• Maintain adequate hydration (~35ml per kg body weight).\n• Focus on whole, nutrient-dense foods with low glycemic index.\n• Ensure balanced distribution of quality protein, complex carbs, and healthy fats.";
  };

  const handleSendAssistant = async (queryText) => {
    const q = queryText || assistantQuestion;
    if (!q.trim() || loadingAssistant) return;

    const userMsg = { sender: "user", text: q, timestamp: new Date() };
    setAssistantMessages((prev) => [...prev, userMsg]);
    setAssistantQuestion("");
    setLoadingAssistant(true);

    try {
      const aiReply = await generateGeminiAssistant(q);
      setAssistantMessages((prev) => [
        ...prev,
        { sender: "ai", text: aiReply, timestamp: new Date() },
      ]);
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I encountered an issue analyzing this query. Please check your network or try again.",
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoadingAssistant(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assistant") {
      assistantBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [assistantMessages, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 pointer-events-none flex flex-col items-end font-[var(--font-secondary)]">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* ========================================================================= */
          /* MINIMIZED FLOATING PILL DOCK                                              */
          /* ========================================================================= */
          <motion.div
            key="minimized-dock"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            onClick={() => setIsMinimized(false)}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-2xl shadow-2xl cursor-pointer transition-all duration-200 group"
          >
            <div className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)]">
              {activeTab === "chat" && <MessageSquare size={16} />}
              {activeTab === "assistant" && <Bot size={16} />}
              {activeTab === "nutrition" && <Salad size={16} />}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-1.5">
                {activeTab === "chat"
                  ? userRole === "nutritionist"
                    ? `Chat: ${selectedPatient?.patient_name || "Patient"}`
                    : "Chat with Nutritionist"
                  : activeTab === "assistant"
                  ? "AI Smart Assistant"
                  : "Nutrition Search"}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                Click to restore window
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* EXPANDED NON-BLOCKING FLOATING WINDOW                                     */
          /* ========================================================================= */
          <motion.div
            key="floating-window"
            initial={{ opacity: 0, y: 25, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={`pointer-events-auto bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "w-[calc(100vw-2rem)] sm:w-[620px] h-[640px] max-h-[88vh]"
                : "w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[82vh]"
            }`}
          >
            {/* Top Window Bar */}
            <div className="p-3 sm:px-4 border-b-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex items-center justify-between gap-2 select-none flex-shrink-0">
              {/* Tool Tabs */}
              <div className="flex items-center gap-1 bg-[var(--color-bg-app)] p-1 rounded-2xl border border-[var(--color-border-default)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--color-border-hover)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>Messages</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("assistant")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "assistant"
                      ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)] shadow-xs border border-[var(--color-border-hover)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  <Bot size={14} />
                  <span>Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("nutrition")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "nutrition"
                      ? "bg-[var(--color-bg-surface)] text-emerald-600 shadow-xs border border-emerald-200"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  <Salad size={14} />
                  <span>Search</span>
                </button>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize"
                  className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors cursor-pointer"
                >
                  <Minus size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? "Restore width" : "Expand width"}
                  className="hidden sm:inline-flex p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  title="Close"
                  className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Window Content Body */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[var(--color-bg-app)]">
              {/* ========================================================================= */}
              {/* TAB 1: QUICK MESSAGES / LIVE CHAT                                         */}
              {/* ========================================================================= */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  {/* Nutritionist Searchable Patient Bar */}
                  {userRole === "nutritionist" && (
                    <div className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] p-2.5">
                      {/* Active Patient Card with Switcher Toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => setShowPatientSelector((prev) => !prev)}
                          className="flex-1 flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--color-bg-app)] cursor-pointer transition-colors min-w-0"
                          title="Click to search or switch patient"
                        >
                          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {(selectedPatient?.name || "P").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-[var(--color-text-strong)] truncate">
                                {selectedPatient?.name || "Select a Patient"}
                              </h4>
                              <ChevronDown size={13} className={`text-[var(--color-text-muted)] transition-transform ${showPatientSelector ? "rotate-180" : ""}`} />
                            </div>
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                              {selectedPatient?.email ? selectedPatient.email : "Click to select or search patient"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPatientSelector((prev) => !prev)}
                          className="px-2.5 py-1 text-[11px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] hover:bg-[var(--color-border-hover)] border border-[var(--color-border-hover)] rounded-xl transition-all cursor-pointer shrink-0"
                        >
                          {showPatientSelector ? "Close List" : "Search Patients"}
                        </button>
                      </div>

                      {/* Dropdown Search & Select Drawer */}
                      <AnimatePresence>
                        {showPatientSelector && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2.5 pt-2.5 border-t border-[var(--color-border-default)] space-y-2 overflow-hidden"
                          >
                            <div className="relative">
                              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                              <input
                                type="text"
                                value={patientSearchTerm}
                                onChange={(e) => setPatientSearchTerm(e.target.value)}
                                placeholder="Filter by patient name or email..."
                                autoFocus
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-strong)] focus:border-[var(--color-primary)] outline-none transition-all"
                              />
                            </div>

                            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                              {patientsList.filter((p) => {
                                const term = (patientSearchTerm || "").toLowerCase();
                                const name = (p.name || "").toLowerCase();
                                const email = (p.email || "").toLowerCase();
                                return name.includes(term) || email.includes(term);
                              }).length === 0 ? (
                                <p className="text-center py-3 text-[11px] text-[var(--color-text-muted)] italic">
                                  No patients found matching "{patientSearchTerm}"
                                </p>
                              ) : (
                                patientsList
                                  .filter((p) => {
                                    const term = (patientSearchTerm || "").toLowerCase();
                                    const name = (p.name || "").toLowerCase();
                                    const email = (p.email || "").toLowerCase();
                                    return name.includes(term) || email.includes(term);
                                  })
                                  .map((p) => {
                                    const isSelected = String(p.id) === String(selectedPatient?.id);
                                    return (
                                      <div
                                        key={p.id}
                                        onClick={() => {
                                          setSelectedPatient(p);
                                          setShowPatientSelector(false);
                                          setPatientSearchTerm("");
                                        }}
                                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs ${
                                          isSelected
                                            ? "bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-hover)]"
                                            : "hover:bg-[var(--color-bg-app)]"
                                        }`}
                                      >
                                        <div className="min-w-0 pr-2">
                                          <p className="font-bold text-[var(--color-text-strong)] truncate">
                                            {p.name}
                                          </p>
                                          {p.email && (
                                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                                              {p.email}
                                            </p>
                                          )}
                                        </div>
                                        {isSelected && (
                                          <Check size={14} className="text-[var(--color-primary)] shrink-0" />
                                        )}
                                      </div>
                                    );
                                  })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Patient role counterparty header */}
                  {userRole === "user" && myNutritionistInfo && (
                    <div className="p-2.5 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center">
                          {(myNutritionistInfo.name || "N").charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--color-text-strong)]">
                            {myNutritionistInfo.name || "Clinical Nutritionist"}
                          </p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">
                            {myNutritionistInfo.email || myNutritionistInfo.title || "In-House Nutrition Specialist"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200">
                        Assigned
                      </span>
                    </div>
                  )}

                  {/* Message Thread */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
                    {loadingChat ? (
                      <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--color-text-muted)] py-10">
                        <Loader2 size={22} className="animate-spin text-[var(--color-primary)] mb-2" />
                        Loading conversation history...
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--color-text-muted)]">
                        <div className="p-3 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] rounded-2xl mb-2">
                          <MessageSquare size={24} />
                        </div>
                        <p className="text-xs font-bold text-[var(--color-text-strong)]">
                          Start the Consultation
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 max-w-[220px]">
                          Send a quick message, diet recommendation, or clinical note to the patient.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMe =
                          String(msg.sender_id) === String(user?.id) ||
                          String(msg.sender) === String(user?.id);
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                isMe
                                  ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-tr-none font-medium"
                                  : "bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border border-[var(--color-border-default)] rounded-tl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text || msg.message}</p>
                              <span
                                className={`block text-[9px] mt-1 text-right ${
                                  isMe ? "text-white/70" : "text-[var(--color-text-muted)]"
                                }`}
                              >
                                {msg.timestamp
                                  ? new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Nutritionist Quick Snippets */}
                  {userRole === "nutritionist" && (
                    <div className="px-3 py-1.5 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex-shrink-0">
                        Quick:
                      </span>
                      {QUICK_NUTRITIONIST_SNIPPETS.map((snip, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setChatInputText(snip)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-bg-app)] hover:bg-[var(--color-primary-bg-subtle)] hover:text-[var(--color-primary)] border border-[var(--color-border-default)] whitespace-nowrap transition-colors cursor-pointer font-medium"
                        >
                          {snip.length > 25 ? snip.substring(0, 25) + "..." : snip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chat Input Form */}
                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-2.5 sm:p-3 bg-[var(--color-bg-surface)] border-t-2 border-[var(--color-border-default)] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Type a clinical message or note..."
                      disabled={sendingChat}
                      className="flex-1 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || sendingChat}
                      className="p-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {sendingChat ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: SMART AI ASSISTANT                                                 */}
              {/* ========================================================================= */}
              {activeTab === "assistant" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-strong)]">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Gemini Clinical Co-Pilot</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAssistant}
                      title="Clear conversation"
                      className="text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} /> Clear
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
                    {assistantMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 ${
                          msg.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {msg.sender === "ai" && (
                          <div className="w-7 h-7 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-0.5 border border-[var(--color-border-hover)]">
                            <Bot size={14} />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs relative group ${
                            msg.sender === "user"
                              ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-tr-none font-medium"
                              : msg.isError
                              ? "bg-red-500/10 text-red-700 border border-red-500/20 rounded-tl-none"
                              : "bg-[var(--color-bg-surface)] text-[var(--color-text-default)] border border-[var(--color-border-default)] rounded-tl-none"
                          }`}
                        >
                          {msg.sender === "ai" ? (
                            <div className="prose prose-xs max-w-none text-[var(--color-text-default)] prose-p:my-1 prose-headings:text-[var(--color-text-strong)] prose-headings:font-bold prose-strong:text-[var(--color-text-strong)] prose-ul:my-1 prose-li:my-0.5">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}

                          {msg.sender === "ai" && !msg.isError && (
                            <button
                              type="button"
                              onClick={() => handleCopyAssistant(msg.text, idx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] text-[10px] cursor-pointer"
                              title="Copy answer"
                            >
                              {copiedAssistantIdx === idx ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {loadingAssistant && (
                      <div className="flex gap-2.5 justify-start items-center text-xs text-[var(--color-text-muted)]">
                        <div className="w-7 h-7 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                          <Loader2 size={14} className="animate-spin" />
                        </div>
                        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="ml-1 text-[11px] font-medium">
                            Synthesizing nutrition response...
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={assistantBottomRef} />
                  </div>

                  {/* Suggested Prompts */}
                  {assistantMessages.length <= 3 && (
                    <div className="px-3 py-1.5 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)] flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex-shrink-0">
                        Prompts:
                      </span>
                      {SUGGESTED_ASSISTANT_PROMPTS.map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendAssistant(prompt)}
                          disabled={loadingAssistant}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-bg-app)] hover:bg-[var(--color-primary-bg-subtle)] hover:text-[var(--color-primary)] border border-[var(--color-border-default)] whitespace-nowrap transition-colors cursor-pointer font-medium disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Assistant Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAssistant();
                    }}
                    className="p-2.5 sm:p-3 bg-[var(--color-bg-surface)] border-t-2 border-[var(--color-border-default)] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={assistantQuestion}
                      onChange={(e) => setAssistantQuestion(e.target.value)}
                      placeholder="Ask about diet plans, food nutrients, GI values..."
                      disabled={loadingAssistant}
                      className="flex-1 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!assistantQuestion.trim() || loadingAssistant}
                      className="p-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loadingAssistant ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: NUTRITION INGREDIENT SEARCH                                        */}
              {/* ========================================================================= */}
              {activeTab === "nutrition" && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                  <NutritionSearch isPopup={true} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingQuickToolbox;
