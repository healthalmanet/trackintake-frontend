import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getMySubscription,
  getNutritionistPlans,
  getBillingHistory,
  createOrder,
  verifyPayment,
} from "../../../api/subscriptionService";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  CreditCard,
  History,
  RefreshCw,
  ShieldCheck,
  Check,
  X,
  Bot,
  MessageSquare,
  Search,
  Users,
  Receipt,
  ArrowUpRight,
  Zap,
  Copy,
  CheckCheck,
  Printer,
  FileText,
  BadgeCheck,
  Award,
  ChevronRight,
} from "lucide-react";

const NutritionistSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "plans" | "history"
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Load all initial subscription & billing data
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [subData, plansData, historyData] = await Promise.all([
        getMySubscription(),
        getNutritionistPlans(),
        getBillingHistory(),
      ]);

      setSubscription(subData);
      setPlans(Array.isArray(plansData) ? plansData : plansData.results || []);
      setBillingHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error("Error loading subscription data:", err);
      if (!isSilent) {
        toast.error("Failed to load subscription details. Please refresh.");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle plan purchase / upgrade via Razorpay
  const handleBuyPlan = async (plan) => {
    if (!plan || plan.price <= 0) return;
    setPurchasingPlanId(plan.id);
    const toastId = toast.loading(`Initiating checkout for ${plan.name}...`);

    try {
      const order = await createOrder(plan.id);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: "INR",
        order_id: order.order_id,
        name: "TrackIntake Nutritionist Plan",
        description: `${plan.name} Nutritionist Subscription`,
        handler: async (response) => {
          const verifyToastId = toast.loading("Verifying your payment...");
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("🎉 Plan activated successfully!", { id: verifyToastId });
            await fetchData(true);
            setActiveTab("overview");
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            toast.error("Payment completed but verification failed. Please contact support.", {
              id: verifyToastId,
            });
          }
        },
        theme: { color: "#FF7043" },
        prefill: {
          name: "Nutritionist",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      toast.dismiss(toastId);
    } catch (err) {
      console.error("Error creating plan order:", err);
      toast.error(err.response?.data?.error || "Failed to start payment. Please try again.", {
        id: toastId,
      });
    } finally {
      setPurchasingPlanId(null);
    }
  };

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasPlan = subscription?.has_plan && subscription?.plan;
  const isActive = subscription?.is_active;
  const remainingDays = subscription?.remaining_days ?? 0;
  const totalDuration = subscription?.plan?.duration_days || 30;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((remainingDays / (totalDuration || 1)) * 100))
  );

  // Total amount spent in billing history
  const totalSpent = useMemo(() => {
    return billingHistory.reduce((acc, cur) => {
      const amount = parseFloat(cur.amount) || 0;
      return acc + amount;
    }, 0);
  }, [billingHistory]);

  // Filtered billing history for search
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return billingHistory;
    const q = searchTerm.toLowerCase();
    return billingHistory.filter(
      (item) =>
        item.plan_name?.toLowerCase().includes(q) ||
        item.razorpay_order_id?.toLowerCase().includes(q) ||
        item.razorpay_payment_id?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
    );
  }, [billingHistory, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-[var(--font-secondary)] text-[var(--color-text-strong)]">
      
      {/* ── Top Header Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs p-6 sm:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider border border-[var(--color-border-hover)]">
              <Crown size={14} />
              <span>Practitioner Subscription Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] tracking-tight">
              Subscription & Billing
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Monitor your practitioner tier, renewal schedules, and access comprehensive payment invoices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-primary)] transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-98 disabled:opacity-50"
              title="Sync subscription data"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-[var(--color-primary)]" : ""} />
              <span>{isRefreshing ? "Syncing..." : "Sync Plan"}</span>
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-xs hover:shadow-[var(--color-primary)]/20 active:scale-98 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Explore Plans</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Summary Metric Cards (Harmonized Matching Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Plan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Current Tier
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Crown size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)] truncate">
              {hasPlan ? subscription.plan.name : "Free / Inactive"}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                {isActive ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                {isActive ? "Active Plan" : "No Active Term"}
              </span>
              {hasPlan && (
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  ₹{subscription.plan.price}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Validity Remaining */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Validity Remaining
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                {hasPlan ? remainingDays : 0}
              </h3>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Days Left</span>
            </div>
            <div className="mt-2 w-full bg-[var(--color-bg-app)] h-2 rounded-full overflow-hidden border border-[var(--color-border-default)]">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                style={{ width: `${hasPlan ? progressPercent : 0}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Expiry Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Term Expiry
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-[var(--color-text-strong)] truncate">
              {hasPlan && subscription.expires_at ? subscription.expires_at : "—"}
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {hasPlan ? `Started: ${subscription.start_date || "Active"}` : "No active term"}
            </p>
          </div>
        </motion.div>

        {/* Card 4: Invoices & Spend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Billing Records
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Receipt size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                ₹{totalSpent}
              </h3>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Total Invested</span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {billingHistory.length} recorded transaction{billingHistory.length === 1 ? "" : "s"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Tab Navigation Bar ── */}
      <div className="flex items-center gap-1.5 p-1 bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] shadow-xs max-w-xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
          }`}
        >
          <Crown size={15} />
          <span>Plan Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("plans")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "plans"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
          }`}
        >
          <Sparkles size={15} />
          <span>Available Plans</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "history"
              ? "bg-[var(--color-primary)] text-white shadow-xs"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
          }`}
        >
          <History size={15} />
          <span>Invoices ({billingHistory.length})</span>
        </button>
      </div>

      {/* ── TAB 1: PLAN OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="p-16 text-center bg-[var(--color-bg-surface)] rounded-3xl border border-[var(--color-border-default)]">
              <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-[var(--color-text-muted)] font-semibold">Loading subscription details...</p>
            </div>
          ) : hasPlan ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Active Plan Detail Card (7 Cols) */}
              <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-default)]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                        <CheckCircle2 size={12} />
                        {isActive ? "Active License" : "Expired"}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-bg-app)] px-2.5 py-0.5 rounded-lg border border-[var(--color-border-default)]">
                        Verified Practitioner
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] mt-2">
                      {subscription.plan.name}
                    </h2>
                  </div>

                  <div className="bg-[var(--color-bg-app)] p-3.5 rounded-2xl border border-[var(--color-border-default)] text-left sm:text-right">
                    <span className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                      ₹{subscription.plan.price}
                    </span>
                    <p className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">
                      for {subscription.plan.duration_days} days validity
                    </p>
                  </div>
                </div>

                {/* Validity Progress & Timeline Bar */}
                <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[var(--color-text-strong)] flex items-center gap-1.5">
                      <Calendar size={14} className="text-[var(--color-primary)]" />
                      Valid Until: <span className="font-extrabold">{subscription.expires_at || "N/A"}</span>
                    </span>
                    <span className="text-[var(--color-primary)] font-extrabold">
                      {remainingDays} Days Remaining
                    </span>
                  </div>

                  <div className="w-full bg-[var(--color-bg-surface)] h-2 rounded-full overflow-hidden border border-[var(--color-border-default)]">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
                    <span>Activated: {subscription.start_date || "N/A"}</span>
                    <span>Total Term: {subscription.plan.duration_days} Days</span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <ShieldCheck size={16} className="text-[var(--color-primary)]" />
                    <span>All clinical modules and AI generation tools active</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Upgrade / Renew</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>

              {/* Plan Entitlements & Features Card (5 Cols) */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-default)]">
                  <h3 className="text-base font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--color-primary)]" />
                    <span>Active Features</span>
                  </h3>
                  <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] px-2.5 py-0.5 rounded-md border border-[var(--color-border-hover)]">
                    Unlocked
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                    <div className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] flex-shrink-0">
                      <Bot size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-strong)]">AI Smart Meal Recommender</p>
                      <span className="text-[11px] text-[var(--color-text-muted)]">Automated meal formulation for patients</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                    <div className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] flex-shrink-0">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-strong)]">Direct Patient Messaging</p>
                      <span className="text-[11px] text-[var(--color-text-muted)]">Real-time chat & voice communication</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                    <div className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] flex-shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-strong)]">Bulk Excel (.xlsx) Onboarding</p>
                      <span className="text-[11px] text-[var(--color-text-muted)]">Instant patient spreadsheet imports</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                    <div className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] flex-shrink-0">
                      <Search size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-strong)]">Nutrition Database Search</p>
                      <span className="text-[11px] text-[var(--color-text-muted)]">Comprehensive macro & calorie database</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-2">
                  <BadgeCheck size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                  <span>Licensed for professional clinical consultation.</span>
                </div>
              </div>
            </div>
          ) : (
            /* No Active Plan State */
            <div className="p-12 text-center bg-[var(--color-bg-surface)] rounded-3xl border border-[var(--color-border-default)] space-y-4 shadow-xs">
              <div className="p-3.5 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] rounded-2xl w-14 h-14 flex items-center justify-center mx-auto">
                <Crown size={28} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                No Active Nutritionist Plan
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
                You do not currently have an active subscription. Choose a plan to unlock automated meal planning, direct patient chat, and virtual appointments.
              </p>
              <button
                onClick={() => setActiveTab("plans")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Choose a Plan</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: AVAILABLE PLANS ── */}
      {activeTab === "plans" && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              Select Your Subscription Plan
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              All plans include complete platform tools, AI meal generation, patient chat, and virtual availability slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {plans.map((p, idx) => {
              const isCurrent = subscription?.plan?.id === p.id && subscription?.is_active;
              const isRecommended = idx === 0 || p.name.toLowerCase().includes("hero") || p.name.toLowerCase().includes("pro");

              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className={`p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border-2 flex flex-col justify-between relative shadow-xs transition-all ${
                    isCurrent
                      ? "border-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-primary)]"
                      : isRecommended
                      ? "border-[var(--color-border-hover)] shadow-xs"
                      : "border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]"
                  }`}
                >
                  {isCurrent ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Current Active Plan</span>
                    </span>
                  ) : isRecommended ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Sparkles size={11} />
                      <span>Recommended</span>
                    </span>
                  ) : null}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                          {p.name}
                        </h3>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
                          Clinical License
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-[var(--color-bg-app)] text-[var(--color-text-strong)] px-3 py-1 rounded-xl border border-[var(--color-border-default)]">
                        {p.duration_days} Days
                      </span>
                    </div>

                    <div className="py-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                          ₹{p.price}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] font-semibold">
                          / {p.duration_days} days validity
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        Approx. ₹{Math.round(p.price / (p.duration_days || 1))}/day
                      </p>
                    </div>

                    <div className="border-t border-[var(--color-border-default)] pt-3.5 space-y-2.5 text-xs text-[var(--color-text-strong)]">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0">
                          <Check size={12} />
                        </div>
                        <span>AI Smart Diet Generation for Patients</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0">
                          <Check size={12} />
                        </div>
                        <span>Direct Patient Real-Time Messaging</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0">
                          <Check size={12} />
                        </div>
                        <span>Bulk Patient Spreadsheet (.xlsx) Upload</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0">
                          <Check size={12} />
                        </div>
                        <span>Full Nutrition Calorie & Macro Search</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0">
                          <Check size={12} />
                        </div>
                        <span>Patient Biomarkers & Zoom Consultations</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleBuyPlan(p)}
                      disabled={purchasingPlanId === p.id}
                      className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all duration-200 cursor-pointer shadow-xs ${
                        isCurrent
                          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                          : isRecommended
                          ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                          : "bg-[var(--color-bg-app)] hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border-default)] text-[var(--color-text-strong)]"
                      }`}
                    >
                      {purchasingPlanId === p.id ? (
                        <span className="inline-flex items-center gap-2 justify-center">
                          <RefreshCw size={13} className="animate-spin" /> Processing Payment...
                        </span>
                      ) : isCurrent ? (
                        "Renew Active Plan"
                      ) : (
                        `Activate ${p.name} Plan`
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Banner */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--color-primary)] flex-shrink-0" />
              <span>256-Bit SSL Encrypted checkout powered securely by Razorpay.</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-text-strong)]">
              <span>UPI • Debit/Credit Cards • NetBanking • Wallets</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: BILLING HISTORY ── */}
      {activeTab === "history" && (
        <div className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-5 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-default)] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-2">
                <Receipt size={18} className="text-[var(--color-primary)]" />
                <span>Billing & Payment Invoices</span>
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Complete history of transactions, Razorpay IDs, and official invoices.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                placeholder="Search invoices or IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border bg-[var(--color-bg-app)] border-[var(--color-border-default)] rounded-xl text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none transition-all"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="p-3 bg-[var(--color-bg-app)] text-[var(--color-text-muted)] rounded-2xl w-12 h-12 flex items-center justify-center mx-auto border border-[var(--color-border-default)]">
                <Receipt size={24} />
              </div>
              <h4 className="text-sm font-bold text-[var(--color-text-strong)]">No Transactions Found</h4>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                {searchTerm
                  ? "No invoices matched your search query. Try clearing the search keyword."
                  : "When you purchase or renew a subscription plan, all transaction receipts will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Date & Time</th>
                    <th className="pb-3 px-3">Plan Name</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Order ID</th>
                    <th className="pb-3 px-3">Payment ID</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {filteredHistory.map((item) => {
                    const isSuccess = item.status === "success" || item.status === "paid";
                    const formattedDate = item.created_at
                      ? new Date(item.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A";

                    return (
                      <tr key={item.id} className="hover:bg-[var(--color-bg-app)] transition-colors">
                        <td className="py-3 px-3 font-medium text-[var(--color-text-strong)] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[var(--color-primary)]" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-[var(--color-text-strong)]">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] text-[11px] font-bold">
                            {item.plan_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-black text-xs text-[var(--color-text-strong)]">
                          ₹{item.amount}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[var(--color-text-muted)]">
                          {item.razorpay_order_id ? (
                            <button
                              onClick={() => handleCopy(item.razorpay_order_id, `order-${item.id}`)}
                              className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                              title="Click to copy Order ID"
                            >
                              <span>{item.razorpay_order_id.slice(0, 12)}...</span>
                              {copiedId === `order-${item.id}` ? (
                                <CheckCheck size={12} className="text-[var(--color-primary)]" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[var(--color-text-muted)]">
                          {item.razorpay_payment_id ? (
                            <button
                              onClick={() => handleCopy(item.razorpay_payment_id, `pay-${item.id}`)}
                              className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                              title="Click to copy Payment ID"
                            >
                              <span>{item.razorpay_payment_id.slice(0, 12)}...</span>
                              {copiedId === `pay-${item.id}` ? (
                                <CheckCheck size={12} className="text-[var(--color-primary)]" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                            <BadgeCheck size={11} />
                            {isSuccess ? "Paid" : item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedInvoice(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:underline p-1 cursor-pointer"
                          >
                            <FileText size={13} />
                            <span>View Receipt</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Receipt Modal ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-bg-surface)] w-full max-w-md rounded-3xl border border-[var(--color-border-default)] shadow-2xl p-6 space-y-5 relative font-[var(--font-secondary)] text-[var(--color-text-strong)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                    <Receipt size={18} />
                  </span>
                  <h3 className="text-lg font-bold font-[var(--font-primary)]">
                    Payment Receipt
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-xl hover:bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Plan:</span>
                    <span className="font-bold">{selectedInvoice.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Date & Time:</span>
                    <span className="font-medium">
                      {new Date(selectedInvoice.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Payment Gateway:</span>
                    <span className="font-medium">Razorpay Secure</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Status:</span>
                    <span className="font-bold text-[var(--color-primary)] uppercase text-[11px]">
                      {selectedInvoice.status || "Paid"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between border-b border-[var(--color-border-default)] pb-1">
                    <span className="text-[var(--color-text-muted)]">Razorpay Order ID:</span>
                    <span className="font-mono">{selectedInvoice.razorpay_order_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--color-border-default)] pb-1">
                    <span className="text-[var(--color-text-muted)]">Razorpay Payment ID:</span>
                    <span className="font-mono">{selectedInvoice.razorpay_payment_id || "N/A"}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-hover)] flex justify-between items-center">
                  <span className="font-bold">Total Amount Paid:</span>
                  <span className="text-xl font-black text-[var(--color-primary)]">₹{selectedInvoice.amount}</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border border-[var(--color-border-default)] font-bold text-xs text-[var(--color-text-strong)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-primary)] transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NutritionistSubscription;
