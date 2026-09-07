import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getPlans, createOrder, verifyPayment, getMySubscription, getBillingHistory } from "../../api/subscriptionService";
import { getPlanBenefits } from "../../api/planBenefits";
import { useSubscription } from "../../hook/useSubscription";
import { toast } from "react-toastify";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  CreditCard,
  History,
  Zap,
  RefreshCw,
  Crown,
  ChevronRight,
  Receipt,
  Check,
  X,
  Stethoscope,
  Bot,
  MessageSquare,
  Flame,
  ArrowUpRight
} from "lucide-react";

const PlansPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isForced = location.state?.forced;

  const [plans, setPlans] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("plans"); // "plans" | "billing"
  const [loadingId, setLoadingId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSub, setCurrentSub] = useState(null);
  const [refreshingSub, setRefreshingSub] = useState(false);

  const { subscription, loading: subLoading } = useSubscription();

  // Keep local currentSub state updated with hook or fresh fetch
  useEffect(() => {
    if (subscription) {
      setCurrentSub(subscription);
    }
  }, [subscription]);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setRefreshingSub(true);
      const data = await getMySubscription();
      setCurrentSub(data);
    } catch (err) {
      console.error("Failed to refresh subscription:", err);
    } finally {
      setRefreshingSub(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const history = await getBillingHistory();
      setBillingHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error("Failed to load billing history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    getPlans()
      .then((data) => setPlans(data.results || data || []))
      .catch((err) => {
        console.error("Failed to load plans:", err);
        toast.error("Could not load plans. Please refresh.");
      });

    fetchHistory();
  }, [fetchHistory]);

  // Auto-redirect back if forced user now has an active plan
  useEffect(() => {
    if (isForced && currentSub?.has_plan && currentSub?.is_active) {
      sessionStorage.removeItem("sub_checked");
      navigate("/dashboard");
    }
  }, [currentSub, navigate, isForced]);

  const handleBuy = async (plan) => {
    if (!plan || plan.price <= 0) return;
    try {
      setLoadingId(plan.id);
      const order = await createOrder(plan.id);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: "INR",
        order_id: order.order_id,
        name: "TrackIntake",
        description: `${plan.name} Plan Subscription`,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            sessionStorage.removeItem("sub_checked");
            toast.success("🎉 Plan activated successfully!");
            await fetchSubscriptionData();
            await fetchHistory();
            setActiveTab("billing");
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            toast.error("Payment completed but verification failed. Please contact support.");
          }
        },
        theme: { color: "#ff7a18" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Create order failed:", err);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  const hasActivePlan = currentSub?.has_plan && currentSub?.is_active && currentSub?.plan?.price > 0;
  const remainingDays = currentSub?.remaining_days ?? 0;
  const totalDuration = currentSub?.plan?.duration_days || 90;
  const progressPercent = Math.min(100, Math.max(0, Math.round((remainingDays / (totalDuration || 1)) * 100)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Warning if forced to buy */}
        {isForced && (
          <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-xl shadow-sm flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Action Required</p>
              <p className="text-xs text-amber-700">Please choose and activate a subscription plan to access all patient dashboard features.</p>
            </div>
          </div>
        )}

        {/* Header Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Membership & Billing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Flexible Plans for Your Health Journey
          </h1>
          <p className="text-base text-gray-600">
            Access personalized AI diet recommendations, nutritionist consultations, and comprehensive health logs.
          </p>
        </div>

        {/* ── ACTIVE PLAN BANNER / CARD ── */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white relative">
            <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-orange-500/20 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Current Subscription</span>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      {hasActivePlan ? currentSub?.plan?.name : "No Active Paid Plan"}
                      {hasActivePlan ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-300">
                          Inactive / Free
                        </span>
                      )}
                    </h2>
                  </div>
                </div>

                {hasActivePlan ? (
                  <p className="text-sm text-gray-300 max-w-xl">
                    Your {currentSub?.plan?.name} plan includes AI diet analysis, automated meal logs, and direct access to your nutritionist.
                  </p>
                ) : (
                  <p className="text-sm text-gray-300 max-w-xl">
                    You are currently not enrolled in an active membership. Upgrade below to unlock AI meal plans and consultations.
                  </p>
                )}

                {/* Meta details if active */}
                {hasActivePlan && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1">
                    {currentSub?.start_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Started: <strong>{new Date(currentSub.start_date).toLocaleDateString()}</strong></span>
                      </div>
                    )}
                    {currentSub?.expires_at && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span>Expires: <strong>{new Date(currentSub.expires_at).toLocaleDateString()}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Remaining Days Metric / Countdown */}
              {hasActivePlan && (
                <div className="bg-gray-800/80 border border-gray-700/60 rounded-2xl p-5 sm:min-w-[280px] space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Plan Validity</span>
                    <span className="text-2xl font-black text-orange-400">{remainingDays} <span className="text-sm font-normal text-gray-300">days left</span></span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700 text-xs">
                    <div>
                      <span className="text-gray-400 block">In-House Consults</span>
                      <strong className="text-white text-sm">{currentSub?.remaining_inhouse ?? 0} remaining</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Expert Consults</span>
                      <strong className="text-white text-sm">{currentSub?.remaining_expert ?? 0} remaining</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS (Plans vs. Billing History) ── */}
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("plans")}
              className={`pb-3.5 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "plans"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Zap className="w-4 h-4" />
              Available Plans
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`pb-3.5 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "billing"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <History className="w-4 h-4" />
              Billing History ({billingHistory.length})
            </button>
          </div>

          <button
            onClick={() => {
              fetchSubscriptionData();
              fetchHistory();
            }}
            disabled={refreshingSub || loadingHistory}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingSub || loadingHistory ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── TAB 1: AVAILABLE PLANS ── */}
        {activeTab === "plans" && (
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = currentSub?.plan?.id === plan.id && hasActivePlan;
                const isFeatured = plan.name?.toLowerCase().includes("go") || plan.name?.toLowerCase().includes("premium");
                const benefits = getPlanBenefits(plan);

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl bg-white transition-all duration-300 flex flex-col justify-between ${
                      isCurrentPlan
                        ? "border-2 border-emerald-500 shadow-md ring-4 ring-emerald-50"
                        : isFeatured
                        ? "border-2 border-orange-500 shadow-lg ring-4 ring-orange-50 -translate-y-1"
                        : "border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Featured / Current Plan Ribbon */}
                    {isCurrentPlan ? (
                      <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Current Plan
                      </div>
                    ) : isFeatured ? (
                      <div className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Recommended
                      </div>
                    ) : null}

                    <div className="p-6 sm:p-8 space-y-6">
                      {/* Title & Price */}
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                          {plan.duration_days ? `${plan.duration_days} Days Plan` : "Patient Tier"}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{plan.name}</h3>
                        
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                          <span className="text-sm font-medium text-gray-500">
                            {plan.duration_days ? `/${plan.duration_days} days` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Benefits Checklist */}
                      <div className="border-t border-gray-100 pt-6 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Features & Inclusions</p>
                        <ul className="space-y-2.5 text-sm">
                          {benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2.5 text-gray-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="p-6 sm:p-8 pt-0">
                      <button
                        disabled={isCurrentPlan || loadingId === plan.id}
                        onClick={() => handleBuy(plan)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                          isCurrentPlan
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                            : isFeatured
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-200 hover:shadow-lg"
                            : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                        }`}
                      >
                        {isCurrentPlan ? (
                          <>
                            <Check className="w-4 h-4" />
                            Active on Your Account
                          </>
                        ) : loadingId === plan.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Securing Checkout...
                          </>
                        ) : (
                          <>
                            <span>Choose {plan.name}</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Guarantee Banner */}
            <div className="bg-gray-50 rounded-xl border border-gray-200/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span><strong>100% Secure Payments</strong> processed via Razorpay with 256-bit encryption.</span>
              </div>
              <div className="flex items-center gap-3 font-medium text-gray-500">
                <span>Instant Activation</span>
                <span>•</span>
                <span>UPI / Cards / NetBanking</span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: COMPLETE BILLING HISTORY ── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-orange-500" />
                    Transaction & Billing Records
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">All subscriptions and consultation payments associated with your account.</p>
                </div>
                <button
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {loadingHistory ? (
                <div className="p-12 text-center text-gray-500 space-y-3">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                  <p className="text-sm">Fetching billing records...</p>
                </div>
              ) : billingHistory.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">No Billing History Found</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    You haven't made any purchases yet. When you buy a plan or pay consultation fees, your invoices and receipts will show here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="py-3.5 px-6">Plan / Item</th>
                        <th className="py-3.5 px-6">Date & Time</th>
                        <th className="py-3.5 px-6">Amount</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Payment Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {billingHistory.map((item) => {
                        const isSuccess = item.status === "success";
                        const isPending = item.status === "pending";

                        return (
                          <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-4 px-6 text-gray-900 font-bold flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              {item.plan_name}
                            </td>
                            <td className="py-4 px-6 text-gray-600 text-xs">
                              {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                            </td>
                            <td className="py-4 px-6 text-gray-900 font-bold">
                              ₹{item.amount}
                            </td>
                            <td className="py-4 px-6">
                              {isSuccess ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Paid
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Pending
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  {item.status}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-xs text-gray-500 font-mono">
                              {item.razorpay_payment_id || item.razorpay_order_id || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PlansPage;