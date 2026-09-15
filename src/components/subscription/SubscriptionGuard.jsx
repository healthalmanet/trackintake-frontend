import React from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../hook/useSubscription";
import { Lock, Crown, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const SubscriptionGuard = ({ children, role = "user" }) => {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[var(--color-text-muted)] font-[var(--font-secondary)]">
          Checking subscription status...
        </p>
      </div>
    );
  }

  const hasActiveSubscription = subscription && subscription.has_plan && subscription.is_active;

  if (hasActiveSubscription) {
    return children;
  }

  const planRedirectPath = role === "nutritionist" ? "/nutritionist/subscription" : "/dashboard/plans";

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 font-[var(--font-secondary)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-lg w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden"
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Lock / Crown Badge */}
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 relative">
          <Crown className="w-10 h-10 text-amber-500" />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)] mb-3">
          Subscription Required
        </h2>

        <p className="text-[var(--color-text-muted)] text-sm sm:text-base leading-relaxed mb-6">
          To access full dashboard features, meal analytics, and consultations as a{" "}
          <strong className="text-[var(--color-text-strong)] capitalize">{role}</strong>, an active plan subscription is required.
        </p>

        {/* Value Proposition List */}
        <div className="bg-[var(--color-bg-surface-glass,#f8fafc)] border border-[var(--color-border-default)] rounded-2xl p-4 mb-8 text-left space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-[var(--color-text-strong)] font-medium">
            <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Unlock personalized AI meal planning & diet logs</span>
          </div>
          <div className="flex items-center gap-2.5 text-[var(--color-text-strong)] font-medium">
            <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Direct consultation with expert nutritionists</span>
          </div>
          <div className="flex items-center gap-2.5 text-[var(--color-text-strong)] font-medium">
            <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Comprehensive health reports & progress tracking</span>
          </div>
        </div>

        {/* Primary CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(planRedirectPath)}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 px-6 rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-5 h-5 fill-white/20" />
          <span>Choose a Subscription Plan</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          Instant activation • Upgrade or cancel anytime
        </p>
      </motion.div>
    </div>
  );
};

export default SubscriptionGuard;
