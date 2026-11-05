import React, { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import NutriNavbar from "../components/components/nutritionist/NutriNavbar";
import Footer from "../components/components/Footer";
import { getNutritionistProfile } from "../api/nutritionistApi";
import { Clock, ShieldAlert, Lock, ArrowRight } from "lucide-react";

// Eagerly load primary dashboard view
import NutritionistDashboard from "../components/components/nutritionist/NutritionistDashboard";

import QuickTools from "../components/components/nutritionist/QuickTools";
import FloatingQuickToolbox from "../components/components/nutritionist/FloatingQuickToolbox";

import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

// Lazy-load heavy sub-routes to split JS bundles (PatientDetails, Subscription, Chat, Profile, Availability)
const PatientDetailsPage = lazy(() => import("../components/components/nutritionist/PatientDetailsPage"));
const Chat = lazy(() => import("../components/components/nutritionist/Chat"));
const AddAvailability = lazy(() => import("../components/components/nutritionist/AddAvailability"));
const NutritionSearchLayout = lazy(() => import("../components/components/nutritionist/NutritionSearchLayout"));
const NutritionistSubscription = lazy(() => import("../components/components/nutritionist/NutritionistSubscription"));
const NutritionistProfile = lazy(() => import("../components/components/nutritionist/NutritionistProfile"));
const NutritionistPayouts = lazy(() => import("../components/components/nutritionist/NutritionistPayouts"));

const PageFallbackLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-semibold text-[var(--color-text-muted)] font-[var(--font-secondary)]">Loading page...</p>
    </div>
  </div>
);

const NutritionistPage = () => {
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [toolboxTab, setToolboxTab] = useState("assistant");
  const [isVerified, setIsVerified] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getNutritionistProfile();
        if (res.data && res.data.nutritionist_profile) {
          setIsVerified(res.data.nutritionist_profile.is_verified ?? true);
        }
      } catch (err) {
        console.error("Failed to check verification status:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchStatus();
  }, []); // Only fetch once on mount, avoiding unnecessary blocking API calls on every route transition

  const isProfileRoute = location.pathname.includes("/profile") || location.pathname.includes("/subscription");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-app)]">
      {/* 🌟 Persistent NutriNavbar across ALL nutritionist sub-pages */}
      <div className="sticky top-0 z-40 bg-[var(--color-bg-surface-glass)] backdrop-blur-md shadow-sm">
        <NutriNavbar />
      </div>

      {/* ⏳ Pending Admin Verification Top Alert Banner */}
      {!loadingProfile && !isVerified && (
        <div className="bg-white border-b-2 border-orange-200 px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-slate-900 flex items-center justify-center gap-2.5 flex-wrap z-30 shadow-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-black text-[11px] uppercase tracking-wider shadow-xs">
            <Clock size={12} className="shrink-0 stroke-[2.5]" />
            <span>Verification Pending</span>
          </span>
          <span className="text-slate-800">
            Your profile & subscription are active. Clinical practice actions will fully unlock as soon as Admin completes verification.
          </span>
          <NavLink
            to="/nutritionist/profile"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition-colors border border-orange-300"
          >
            <span>View Status</span>
            <ArrowRight size={13} />
          </NavLink>
        </div>
      )}

      {/* 📄 Dynamic Routed Content with Suspense Code-Splitting */}
      <div className="flex-1 relative">
        {!loadingProfile && !isVerified && !isProfileRoute && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
            <div className="max-w-md w-full bg-white border-2 border-slate-200 p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto border border-orange-200 shadow-xs">
                <Clock size={32} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black font-[var(--font-primary)] text-slate-900">
                Admin Verification Pending
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-[var(--font-secondary)]">
                Welcome to TrackIntake! Your account registration & subscription access are active. Clinical practice features (assigning patients, diet plan generation, and patient chat) will automatically unlock once Admin completes your verification.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <NavLink
                  to="/nutritionist/profile"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all"
                >
                  View Profile & Verification Status →
                </NavLink>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<PageFallbackLoader />}>
          <Routes>
            <Route path="subscription" element={<NutritionistSubscription />} />
            <Route
              path="*"
              element={
                <SubscriptionGuard role="nutritionist">
                  <Routes>
                    <Route index element={<NutritionistDashboard />} />
                    <Route path="patient/:id" element={<PatientDetailsPage />} />
                    <Route
                      path="chat"
                      element={
                        <SubscriptionGuard role="nutritionist" feature="nutri_chat_allowed" featureName="Direct Patient Messaging">
                          <Chat />
                        </SubscriptionGuard>
                      }
                    />
                    <Route path="search" element={<NutritionSearchLayout />} />
                    <Route
                      path="availability"
                      element={
                        <SubscriptionGuard role="nutritionist" feature="nutri_online_appointment_allowed" featureName="Appointment Scheduling">
                          <AddAvailability />
                        </SubscriptionGuard>
                      }
                    />
                    <Route path="profile" element={<NutritionistProfile />} />
                    <Route path="payouts" element={<NutritionistPayouts />} />
                  </Routes>
                </SubscriptionGuard>
              }
            />
          </Routes>
        </Suspense>
      </div>

      {/* 🦶 Persistent Footer on Nutritionist side */}
      <Footer />

      {/* 🛠️ Floating Non-Blocking Quick Toolbox */}
      <QuickTools 
        onOpenAssistant={() => {
          setToolboxTab("assistant");
          setIsToolboxOpen(true);
        }}
        onOpenGuide={() => {
          setToolboxTab("guide");
          setIsToolboxOpen(true);
        }}
        onOpenNutrition={() => {
          setToolboxTab("nutrition");
          setIsToolboxOpen(true);
        }}
        onOpenChat={() => {
          setToolboxTab("chat");
          setIsToolboxOpen(true);
        }}
        userRole="nutritionist"
      />

      <FloatingQuickToolbox
        isOpen={isToolboxOpen}
        onClose={() => setIsToolboxOpen(false)}
        initialTab={toolboxTab}
        userRole="nutritionist"
      />
    </div>
  );
};

export default NutritionistPage;
