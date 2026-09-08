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
  CalendarDays,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Copy,
  CheckCheck,
  Download,
  Printer,
  FileText,
  Activity,
  Award,
  ChevronRight,
} from "lucide-react";
import NutriNavbar from "./NutriNavbar";

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
    <div className="bg-[var(--color-bg-app)] font-[var(--font-secondary)] text-[var(--color-text-default)]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 animate-fade-in-up">
        {/* ======================================================== */}
        {/* 🌟 HERO BANNER                                           */}
        {/* ======================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--color-bg-surface)] via-[var(--color-bg-surface-alt)] to-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] p-6 sm:p-8 shadow-sm">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                <Crown size={14} />
                <span>Professional Subscription Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)] tracking-tight">
                Subscription & Billing
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
                Monitor your active practitioner tier, track subscription validity, manage renewals, and view full invoice records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-sm font-semibold text-[var(--color-text-strong)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[var(--color-primary)]" : ""} />
                <span>{isRefreshing ? "Refreshing..." : "Sync Plan"}</span>
              </button>

              <button
                onClick={() => setActiveTab("plans")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Sparkles size={16} />
                <span>Explore Plans</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 📊 SUMMARY METRIC CARDS                                  */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Plan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Current Plan
              </span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                <Crown size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)] truncate">
                {hasPlan ? subscription.plan.name : "Free / Inactive"}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                  }`}
                >
                  {isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {isActive ? "Active" : "No Plan"}
                </span>
                {hasPlan && (
                  <span className="text-xs text-[var(--color-text-muted)]">
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
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Validity Remaining
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  {hasPlan ? remainingDays : 0}
                </h3>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Days Left</span>
              </div>
              <div className="mt-2 w-full bg-[var(--color-bg-app)] h-2 rounded-full overflow-hidden border border-[var(--color-border-default)]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${hasPlan ? progressPercent : 0}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Expiry Date */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Expires On
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
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

          {/* Card 4: Billing History Count */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Total Invoices
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <Receipt size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  ₹{totalSpent}
                </h3>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Spent</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {billingHistory.length} paid transaction{billingHistory.length === 1 ? "" : "s"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ======================================================== */}
        {/* 📑 TAB NAVIGATION PILL                                    */}
        {/* ======================================================== */}
        <div className="flex flex-wrap p-1.5 bg-[var(--color-bg-surface)] rounded-2xl border-2 border-[var(--color-border-default)] shadow-sm max-w-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === "overview"
                ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-md"
                : "text-[var(--color-text-default)] hover:text-[var(--color-primary)]"
            }`}
          >
            <Crown size={16} />
            <span>Plan Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === "plans"
                ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-md"
                : "text-[var(--color-text-default)] hover:text-[var(--color-primary)]"
            }`}
          >
            <Sparkles size={16} />
            <span>Available Plans</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === "history"
                ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-md"
                : "text-[var(--color-text-default)] hover:text-[var(--color-primary)]"
            }`}
          >
            <History size={16} />
            <span>Billing History ({billingHistory.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* 👑 TAB 1: PLAN OVERVIEW                                   */}
        {/* ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {isLoading ? (
              <div className="p-16 text-center bg-[var(--color-bg-surface)] rounded-3xl border-2 border-[var(--color-border-default)]">
                <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[var(--color-text-muted)] font-medium">Loading subscription details...</p>
              </div>
            ) : hasPlan ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Plan Luxury Card */}
                <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[var(--color-bg-surface)] via-[var(--color-bg-surface-alt)] to-[var(--color-bg-surface)] border-2 border-[var(--color-border-hover)] shadow-lg space-y-6 relative overflow-hidden">
                  <div className="absolute -right-16 -top-16 w-48 h-48 bg-[var(--color-primary)]/15 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {isActive ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {isActive ? "Active Subscription" : "Expired"}
                        </span>
                        <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-2.5 py-1 rounded-lg border border-[var(--color-border-default)]">
                          Verified Practitioner
                        </span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] mt-3">
                        {subscription.plan.name}
                      </h2>
                    </div>

                    <div className="text-left sm:text-right bg-[var(--color-bg-surface)] p-4 rounded-2xl border-2 border-[var(--color-border-default)] shadow-sm">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                        ₹{subscription.plan.price}
                      </span>
                      <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                        for {subscription.plan.duration_days} days validity
                      </p>
                    </div>
                  </div>

                  {/* Validity Progress & Timeline Bar */}
                  <div className="p-5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                      <span className="text-[var(--color-text-strong)] flex items-center gap-1.5">
                        <Calendar size={16} className="text-[var(--color-primary)]" />
                        Valid Until: <span className="font-bold">{subscription.expires_at || "N/A"}</span>
                      </span>
                      <span className="text-emerald-600 font-bold">
                        {remainingDays} Days Remaining
                      </span>
                    </div>

                    <div className="w-full bg-[var(--color-bg-app)] h-3 rounded-full overflow-hidden border border-[var(--color-border-default)]">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--color-primary)] via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                      <span>Activated: {subscription.start_date || "N/A"}</span>
                      <span>Total Term: {subscription.plan.duration_days} Days</span>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span>All professional modules & AI engines are unlocked</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab("plans")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] font-bold text-sm shadow-md transition-all duration-200"
                      >
                        <span>Upgrade / Renew</span>
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan Entitlements & Features Card */}
                <div className="p-6 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-3">
                      <h3 className="text-lg font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-2">
                        <Sparkles size={18} className="text-[var(--color-primary)]" />
                        <span>Plan Entitlements</span>
                      </h3>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Unlocked
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-colors">
                        <div className="p-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex-shrink-0">
                          <Bot size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-text-strong)]">AI Smart Meal Recommender</p>
                          <span className="text-[11px] text-[var(--color-text-muted)]">Automated meal planning for assigned patients</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-colors">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 flex-shrink-0">
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-text-strong)]">Patient Messaging & Alerts</p>
                          <span className="text-[11px] text-[var(--color-text-muted)]">Real-time chat and communication</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-colors">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-text-strong)]">Bulk Excel (.xlsx) Onboarding</p>
                          <span className="text-[11px] text-[var(--color-text-muted)]">Upload hundreds of patients in one click</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-colors">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 flex-shrink-0">
                          <Search size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-text-strong)]">Nutrition Database Search</p>
                          <span className="text-[11px] text-[var(--color-text-muted)]">Comprehensive food macro & calorie lookup</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Your account is fully verified with unrestricted features.</span>
                  </div>
                </div>
              </div>
            ) : (
              /* No Active Plan State */
              <div className="p-12 text-center bg-[var(--color-bg-surface)] rounded-3xl border-2 border-dashed border-[var(--color-border-default)] space-y-4 shadow-sm">
                <div className="p-4 bg-orange-500/10 text-[var(--color-primary)] rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <Crown size={32} />
                </div>
                <h3 className="text-2xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  No Active Nutritionist Plan
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                  You do not currently have an active nutritionist plan. Activate a plan to continue managing your patients and utilizing AI diet generation.
                </p>
                <button
                  onClick={() => setActiveTab("plans")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] font-bold text-sm shadow-md transition-all"
                >
                  <Sparkles size={16} />
                  <span>Choose a Plan</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 💳 TAB 2: AVAILABLE PLANS                                 */}
        {/* ======================================================== */}
        {activeTab === "plans" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Flexible Practitioner Plans</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Select Your Subscription Plan
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                All plans include full platform access, patient bulk uploads, AI meal generation, and real-time consultation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {plans.map((p, idx) => {
                const isCurrent = subscription?.plan?.id === p.id && subscription?.is_active;
                const isRecommended = idx === 0 || p.name.toLowerCase().includes("hero") || p.name.toLowerCase().includes("pro");

                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`p-6 sm:p-8 rounded-3xl bg-[var(--color-bg-surface)] border-2 flex flex-col justify-between relative shadow-sm hover:shadow-xl transition-all ${
                      isCurrent
                        ? "border-emerald-500 shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                        : isRecommended
                        ? "border-[var(--color-primary)] shadow-[var(--color-primary)]/10"
                        : "border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]"
                    }`}
                  >
                    {isCurrent ? (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Current Active Plan</span>
                      </span>
                    ) : isRecommended ? (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>Recommended</span>
                      </span>
                    ) : null}

                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
                        <div>
                          <h3 className="text-2xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                            {p.name}
                          </h3>
                          <span className="text-xs text-[var(--color-text-muted)] font-medium">
                            Professional License
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-[var(--color-bg-app)] text-[var(--color-text-strong)] px-3 py-1.5 rounded-xl border border-[var(--color-border-default)]">
                          {p.duration_days} Days
                        </span>
                      </div>

                      <div className="py-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                            ₹{p.price}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)] font-semibold">
                            / {p.duration_days} days validity
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Approx. ₹{Math.round(p.price / (p.duration_days || 1))}/day
                        </p>
                      </div>

                      <div className="border-t border-[var(--color-border-default)] pt-4 space-y-3 text-xs sm:text-sm text-[var(--color-text-default)]">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                            <Check size={14} />
                          </div>
                          <span>AI Smart Diet Generation for Patients</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                            <Check size={14} />
                          </div>
                          <span>Direct Patient Real-Time Messaging</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                            <Check size={14} />
                          </div>
                          <span>Bulk Patient Spreadsheet (.xlsx) Upload</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                            <Check size={14} />
                          </div>
                          <span>Full Nutrition Calorie & Macro Search</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                            <Check size={14} />
                          </div>
                          <span>Patient Biomarker Reports & Lab Tracker</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8">
                      <button
                        onClick={() => handleBuyPlan(p)}
                        disabled={purchasingPlanId === p.id}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-200 shadow-md ${
                          isCurrent
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : isRecommended
                            ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)]"
                            : "bg-[var(--color-bg-app)] hover:bg-[var(--color-primary)] hover:text-white border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)]"
                        }`}
                      >
                        {purchasingPlanId === p.id ? (
                          <span className="inline-flex items-center gap-2 justify-center">
                            <RefreshCw size={16} className="animate-spin" /> Processing Payment...
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

            {/* Razorpay Trust Badge */}
            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0" />
                <span>256-Bit SSL Encrypted checkout. Powered securely by Razorpay.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[var(--color-text-strong)]">UPI • Cards • NetBanking • Wallets</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 📜 TAB 3: BILLING HISTORY                                 */}
        {/* ======================================================== */}
        {activeTab === "history" && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border-default)] pb-6">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-2.5">
                  <Receipt size={24} className="text-[var(--color-primary)]" />
                  <span>Billing & Payment Invoices</span>
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                  Complete history of orders, Razorpay transactions, and official invoices.
                </p>
              </div>

              {/* Search in History */}
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search
                    size={16}
                    className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Search invoices or IDs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 bg-[var(--color-bg-app)] border-[var(--color-border-default)] rounded-xl text-xs sm:text-sm text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="p-4 bg-[var(--color-bg-app)] text-[var(--color-text-muted)] rounded-2xl w-16 h-16 flex items-center justify-center mx-auto border border-[var(--color-border-default)]">
                  <Receipt size={32} />
                </div>
                <h4 className="text-lg font-bold text-[var(--color-text-strong)]">No Transactions Found</h4>
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                  {searchTerm
                    ? "No invoices matched your search query. Try clearing the search filter."
                    : "When you purchase or renew a subscription plan, all your transactions and receipts will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-border-default)] text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[11px]">
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
                          <td className="py-4 px-3 font-medium text-[var(--color-text-strong)] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-[var(--color-text-muted)]" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3 font-bold text-[var(--color-text-strong)]">
                            <span className="p-1.5 px-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-bold">
                              {item.plan_name}
                            </span>
                          </td>
                          <td className="py-4 px-3 font-black text-sm text-[var(--color-text-strong)]">
                            ₹{item.amount}
                          </td>
                          <td className="py-4 px-3 font-mono text-[11px] text-[var(--color-text-muted)]">
                            {item.razorpay_order_id ? (
                              <button
                                onClick={() => handleCopy(item.razorpay_order_id, `order-${item.id}`)}
                                className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                                title="Click to copy Order ID"
                              >
                                <span>{item.razorpay_order_id.slice(0, 14)}...</span>
                                {copiedId === `order-${item.id}` ? (
                                  <CheckCheck size={13} className="text-emerald-500" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="py-4 px-3 font-mono text-[11px] text-[var(--color-text-muted)]">
                            {item.razorpay_payment_id ? (
                              <button
                                onClick={() => handleCopy(item.razorpay_payment_id, `pay-${item.id}`)}
                                className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                                title="Click to copy Payment ID"
                              >
                                <span>{item.razorpay_payment_id.slice(0, 14)}...</span>
                                {copiedId === `pay-${item.id}` ? (
                                  <CheckCheck size={13} className="text-emerald-500" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-4 px-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                isSuccess
                                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                              }`}
                            >
                              {isSuccess ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {isSuccess ? "Paid" : item.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <button
                              onClick={() => setSelectedInvoice(item)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] hover:underline p-1"
                            >
                              <FileText size={14} />
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

        {/* ======================================================== */}
        {/* 🧾 INVOICE RECEIPT MODAL                                  */}
        {/* ======================================================== */}
        <AnimatePresence>
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--color-bg-surface)] w-full max-w-lg rounded-3xl border-2 border-[var(--color-border-default)] shadow-2xl p-6 sm:p-8 space-y-6 relative font-[var(--font-secondary)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <Receipt size={20} />
                    </span>
                    <h3 className="text-xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                      Payment Receipt
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 rounded-full hover:bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Plan:</span>
                      <span className="font-bold text-[var(--color-text-strong)]">{selectedInvoice.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Date & Time:</span>
                      <span className="font-medium text-[var(--color-text-strong)]">
                        {new Date(selectedInvoice.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Payment Gateway:</span>
                      <span className="font-medium text-[var(--color-text-strong)]">Razorpay Secure</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Status:</span>
                      <span className="font-bold text-emerald-600 uppercase text-xs">
                        {selectedInvoice.status || "Paid"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-[var(--color-border-default)] pb-1">
                      <span className="text-[var(--color-text-muted)]">Razorpay Order ID:</span>
                      <span className="font-mono text-[var(--color-text-strong)]">
                        {selectedInvoice.razorpay_order_id || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[var(--color-border-default)] pb-1">
                      <span className="text-[var(--color-text-muted)]">Razorpay Payment ID:</span>
                      <span className="font-mono text-[var(--color-text-strong)]">
                        {selectedInvoice.razorpay_payment_id || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                    <span className="font-bold text-[var(--color-text-strong)]">Total Amount Paid:</span>
                    <span className="text-2xl font-black text-emerald-700">₹{selectedInvoice.amount}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[var(--color-border-default)] font-bold text-xs text-[var(--color-text-strong)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                  >
                    <Printer size={16} />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-md transition-all"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default NutritionistSubscription;
