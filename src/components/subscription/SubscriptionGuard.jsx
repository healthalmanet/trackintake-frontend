import React, { useState, useEffect, useCallback } from "react";
import { useSubscription } from "../../hook/useSubscription";
import {
  getPlans,
  getNutritionistPlans,
  createOrder,
  verifyPayment,
  getMySubscription,
} from "../../api/subscriptionService";
import { getPlanBenefits } from "../../api/planBenefits";
import {
  Lock,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Check,
  CreditCard,
  RefreshCw,
  Star,
  Flame,
  Award,
  Stethoscope,
  HeartHandshake,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const SubscriptionGuard = ({ children, role = "user", feature = null, featureName = null }) => {
  const { subscription, loading: hookLoading } = useSubscription();
  const [localSub, setLocalSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Sync hook subscription to localSub
  useEffect(() => {
    if (subscription) {
      setLocalSub(subscription);
    }
  }, [subscription]);

  // Load plans based on role
  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    setLoadError(null);
    try {
      const fetcher = role === "nutritionist" ? getNutritionistPlans : getPlans;
      const data = await fetcher();
      const planList = Array.isArray(data) ? data : data?.results || [];
      // Sort plans by price ascending
      planList.sort((a, b) => (a.price || 0) - (b.price || 0));
      setPlans(planList);
    } catch (err) {
      console.error("Failed to load subscription plans:", err);
      setLoadError("Unable to load subscription plans. Please try again.");
    } finally {
      setLoadingPlans(false);
    }
  }, [role]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Direct In-Place Razorpay Purchase
  const handleBuyPlan = async (plan) => {
    if (!plan) return;
    if (plan.price <= 0) {
      toast.info("This is a free tier plan. Checking status...");
      return;
    }

    // Verify Razorpay SDK availability
    if (!window.Razorpay) {
      toast.error("Payment gateway is initializing. Please refresh the page or try again in a moment.");
      return;
    }

    setPurchasingId(plan.id);
    const toastId = toast.loading(`Initiating secure checkout for ${plan.name}...`);

    try {
      const order = await createOrder(plan.id);

      const options = {
        key: order.key,
        amount: order.amount,
        currency: "INR",
        order_id: order.order_id,
        name: "TrackIntake",
        description: `${plan.name} Plan (${role === "nutritionist" ? "Practitioner" : "Member"} Access)`,
        handler: async (response) => {
          toast.update(toastId, {
            render: "Verifying your payment with Razorpay...",
            type: "info",
            isLoading: true,
          });

          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Clear cached subscription and refresh
            try {
              sessionStorage.removeItem("user_sub_cache");
              sessionStorage.removeItem("sub_checked");
            } catch {
              // Ignore sessionStorage errors
            }

            const freshSub = await getMySubscription();
            setLocalSub(freshSub);

            toast.update(toastId, {
              render: "🎉 Plan activated successfully! Access unlocked.",
              type: "success",
              isLoading: false,
              autoClose: 4000,
              closeButton: true,
            });
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            toast.update(toastId, {
              render: "Payment completed but verification failed. Please contact support.",
              type: "error",
              isLoading: false,
              autoClose: 5000,
              closeButton: true,
            });
          } finally {
            setPurchasingId(null);
          }
        },
        theme: { color: role === "nutritionist" ? "#0284c7" : "#ff7a18" },
        modal: {
          ondismiss: () => {
            setPurchasingId(null);
            toast.dismiss(toastId);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        toast.update(toastId, {
          render: `Payment failed: ${response.error?.description || "Transaction cancelled."}`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
          closeButton: true,
        });
        setPurchasingId(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Order creation failed:", err);
      const errMsg = err?.response?.data?.error || err?.response?.data?.detail || "Failed to create payment order. Please try again.";
      toast.update(toastId, {
        render: errMsg,
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeButton: true,
      });
      setPurchasingId(null);
    }
  };

  // Determine active subscription & plan
  const activeSubData = (localSub && localSub.has_plan) ? localSub : (subscription && subscription.has_plan ? subscription : null);
  const hasActiveSubscription = activeSubData && activeSubData.is_active;
  const activePlan = activeSubData?.plan;

  // Check feature permission if feature prop is provided
  const isFeatureAllowed = feature
    ? Boolean(activePlan && (activePlan[feature] === true || activePlan[feature] > 0))
    : true;

  // If active and feature is allowed, render guarded children immediately
  if (hasActiveSubscription && isFeatureAllowed) {
    return children;
  }

  // Initial loading state
  if (hookLoading && !localSub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <Crown className="w-5 h-5 text-[var(--color-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-muted)] font-[var(--font-secondary)]">
          Checking your subscription status...
        </p>
      </div>
    );
  }

  const formatDuration = (days) => {
    if (!days) return "Ongoing";
    if (days === 30) return "1 Month";
    if (days === 90) return "3 Months";
    if (days === 180) return "6 Months";
    if (days === 365) return "1 Year";
    return `${days} Days`;
  };

  const isFeatureLocked = hasActiveSubscription && !isFeatureAllowed;

  return (
    <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 font-[var(--font-secondary)] flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full mx-auto">
        {/* ── Top Header Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 max-w-2xl mx-auto"
        >
          {isFeatureLocked ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
              <Lock className="w-4 h-4 text-rose-500" />
              <span>Feature Upgrade Required</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold tracking-wide uppercase mb-4 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
              <span>Active Subscription Required</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] tracking-tight leading-tight mb-3">
            {isFeatureLocked ? (
              <>
                Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500">{featureName || "This Feature"}</span>
              </>
            ) : role === "nutritionist" ? (
              <>
                Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Practitioner Hub</span>
              </>
            ) : (
              <>
                Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">TrackIntake Plan</span>
              </>
            )}
          </h1>

          <p className="text-[var(--color-text-muted)] text-sm sm:text-base leading-relaxed">
            {isFeatureLocked
              ? `Your current tier (${activePlan?.name || "Active Tier"}) does not support ${featureName || "this feature"}. Upgrade to one of the higher-tier plans below to unlock this capability immediately.`
              : role === "nutritionist"
              ? "Select an active practitioner subscription to manage client appointments, issue diet plans, conduct live consultations, and access clinical analytics."
              : "Subscribe to unlock personalized AI meal planning, track macros & water logs, and get direct consultations with certified clinical nutritionists."}
          </p>
        </motion.div>

        {/* ── Plans Grid or Loaders ── */}
        {loadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-3xl p-6 h-96 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/2" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-3/4" />
                  <div className="space-y-2 pt-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-5/6" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-4/6" />
                  </div>
                </div>
                <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl max-w-md mx-auto space-y-4">
            <RefreshCw className="w-8 h-8 text-[var(--color-primary)] mx-auto" />
            <p className="text-sm text-[var(--color-text-strong)]">{loadError}</p>
            <button
              onClick={fetchPlans}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-md"
            >
              Retry Loading Plans
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[var(--color-text-strong)]">No plans available at the moment.</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Please check back shortly or contact support.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${plans.length === 1 ? "max-w-md mx-auto" : plans.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"} gap-6 sm:gap-8 items-stretch`}>
            {plans.map((plan, idx) => {
              const isPopular = idx === 1 || plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("gold");
              const benefits = getPlanBenefits(plan);
              const isPurchasing = purchasingId === plan.id;
              const isCurrentPlan = activePlan?.id === plan.id;
              const includesRequestedFeature = feature ? Boolean(plan[feature] === true || plan[feature] > 0) : true;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                  className={`relative rounded-3xl flex flex-col justify-between p-6 sm:p-8 transition-all duration-300 ${
                    isCurrentPlan
                      ? "bg-emerald-500/5 border-2 border-emerald-500/40 shadow-sm"
                      : isPopular
                      ? "bg-[var(--color-bg-surface)] border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 scale-[1.02] z-10"
                      : "bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] shadow-md"
                  }`}
                >
                  {/* Top Badges */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 flex-wrap justify-center">
                    {isCurrentPlan ? (
                      <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Current Plan
                      </span>
                    ) : isPopular ? (
                      <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-[11px] uppercase tracking-wider shadow-md flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> Most Popular
                      </span>
                    ) : null}

                    {feature && includesRequestedFeature && !isCurrentPlan && (
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Includes {featureName || "Feature"}
                      </span>
                    )}
                  </div>

                  {/* Plan Content */}
                  <div>
                    {/* Header */}
                    <div className="mb-6 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                          {plan.name}
                        </h3>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-[var(--color-text-muted)]">
                          {formatDuration(plan.duration_days)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] tracking-tight">
                          ₹{plan.price}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-muted)]">
                          / {formatDuration(plan.duration_days)}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 pt-4 border-t border-[var(--color-border-default)] mb-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        What's Included:
                      </span>
                      {benefits.length > 0 ? (
                        benefits.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-text-strong)]">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>{b}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-text-strong)]">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>Full Dashboard & Tools Access</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-text-strong)]">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>Direct Chat & Real-Time Updates</span>
                          </div>
                          <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-text-strong)]">
                            <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span>Comprehensive Analytics & Reports</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Buy CTA Button */}
                  <motion.button
                    whileHover={{ scale: isPurchasing || isCurrentPlan ? 1 : 1.02 }}
                    whileTap={{ scale: isPurchasing || isCurrentPlan ? 1 : 0.98 }}
                    disabled={isPurchasing || isCurrentPlan}
                    onClick={() => handleBuyPlan(plan)}
                    className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isCurrentPlan
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default border border-emerald-500/30"
                        : isPopular
                        ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 cursor-pointer"
                        : "bg-[var(--color-text-strong)] hover:bg-[var(--color-primary)] text-[var(--color-bg-app)] hover:text-white cursor-pointer"
                    } ${isPurchasing ? "opacity-75 cursor-not-allowed" : ""}`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Opening Razorpay Checkout...</span>
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Active Plan</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>{isFeatureLocked ? `Upgrade to ${plan.name}` : `Buy ${plan.name} Directly`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Trust & Security Banner ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-6 border-t border-[var(--color-border-default)] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[var(--color-text-muted)] font-medium text-center"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Instant Razorpay Payment Activation</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Automatic Access Grant (No Refresh Needed)</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionGuard;
