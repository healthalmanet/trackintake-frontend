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
  }, [location.pathname]);

  const isProfileRoute = location.pathname.includes("/profile") || location.pathname.includes("/subscription");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-app)]">
      {/* 🌟 Persistent NutriNavbar across ALL nutritionist sub-pages */}
      <div className="sticky top-0 z-40 bg-[var(--color-bg-surface-glass)] backdrop-blur-md shadow-sm">
        <NutriNavbar />
      </div>

      {/* ⏳ Pending Admin Verification Top Alert Banner */}
      {!loadingProfile && !isVerified && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 flex-wrap z-30">
          <Clock size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Account Status: Pending Admin Verification.</strong> Your profile & subscription are active. Practice actions will fully unlock as soon as Admin approves your account.
          </span>
          <NavLink to="/nutritionist/profile" className="underline font-bold text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
            View Status <ArrowRight size={12} />
          </NavLink>
        </div>
      )}

      {/* 📄 Dynamic Routed Content with Suspense Code-Splitting */}
      <div className="flex-1 relative">
        {!loadingProfile && !isVerified && !isProfileRoute && (
          <div className="absolute inset-0 z-30 bg-[var(--color-bg-app)]/70 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
            <div className="max-w-md w-full bg-[var(--color-bg-surface)] border-2 border-amber-500/40 p-6 sm:p-8 rounded-3xl shadow-xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto">
                <Clock size={30} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-black font-[var(--font-primary)] text-[var(--color-text-strong)]">
                Admin Verification Pending
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed font-[var(--font-secondary)]">
                Welcome to TrackIntake! Your account registration & subscription access are active. Clinical practice features (assigning patients, diet plan generation, and patient chat) will automatically unlock once Admin completes your verification.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <NavLink
                  to="/nutritionist/profile"
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs shadow-sm hover:bg-[var(--color-primary-hover)] transition-all"
                >
                  View Profile & Pricing Status →
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
