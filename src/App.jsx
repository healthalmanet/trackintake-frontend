import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./components/context/AuthContext";
import { Loader } from "lucide-react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./components/components/ForgotPassword";
import ResetPassword from "./components/components/ResetPassword";
import Unauthorized from "./pages/Unauthorized";

import OwnerPage from "./pages/OwnerPage";
import OperatorPage from "./pages/OperatorPage";
import NutritionistPage from "./pages/NutritionistPage";
import Dashboard from "./pages/Dashboard";

import Navbar from "./components/components/Navbar";
import NotificationDropdown, { pushFoodSuggestionNotification } from "./components/components/NotificationDropdown";
import Footer from "./components/components/Footer";
import ProtectedRoute from "./components/components/ProtectedRoute";
import logo from "./assets/logo.png";

import BlogDetail from "./components/components/BlogDetails";
import BlogsPage from "./components/components/Blogs";
import HomeBlog from "./components/components/HomeBlog";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";

import { ProfileDropdown } from "./components/components/ProfileDropdown";
import QuickTools from "./components/components/nutritionist/QuickTools";
import FloatingQuickToolbox from "./components/components/nutritionist/FloatingQuickToolbox";
import SocialAuthHandler from "./components/components/SocialAuthHandler";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import PrivacyPolicy from "./pages/dashboard/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ContactPage from "./pages/dashboard/Tools/Contact";

import useWebSockets from "./api/useWebSockets";
import { FoodSuggestionToast } from "./components/FoodSuggestionToast";
import { FoodSuggestionsDrawer } from "./components/components/FoodSuggestionsDrawer";
import Career from "./pages/Career";
import axiosInstance from "./api/axiosInstance";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper to calculate daily slot: Morning (5-12), Afternoon (12-17), Evening (17-5)
function getSlotConfig() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      slot: "morning",
      mealType: "Breakfast",
      title: "Morning Energy Recommendation",
      icon: "🌅",
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      slot: "afternoon",
      mealType: "Lunch",
      title: "Afternoon Balanced Lunch",
      icon: "☀️",
    };
  }
  return {
    slot: "evening",
    mealType: "Dinner",
    title: "Evening Restorative Meal",
    icon: "🌙",
  };
}

// ── Stable no-op callbacks defined OUTSIDE the component ────────
// This ensures they never change reference between renders,
// so useWebSockets' useEffect never re-runs and clears the handler.
const noop = () => { };

function App() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [toolboxTab, setToolboxTab] = useState("assistant");
  const [suggestion, setSuggestion] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitData, setDrawerInitData] = useState(null);

  // Stable callback — useCallback with [] is correct here
  const handleSuggestion = useCallback((data) => {
    console.log("🍽️ Food suggestion received via WebSocket:", data);
    const { icon, title } = getSlotConfig();
    setSuggestion({
      message: data.message || "",
      topSuggestion: data.top_suggestion || "",
      reason: data.reason || "",
      caloriesLeft: data.calories_left || 0,
      slot: data.slot,
      slotIcon: icon,
      slotTitle: title,
      receivedAt: Date.now(),
    });
  }, []);

  // ── useWebSockets with stable references ─────────────────────
  useWebSockets({
    onReminder: noop,
    onMessage: noop,
    onSuggestion: handleSuggestion,
  });

  // ── Open food drawer from notification click ──────────────────
  useEffect(() => {
    const handleOpenDrawer = (e) => {
      setDrawerInitData(e.detail || null);
      setDrawerOpen(true);
    };
    window.addEventListener("trackintake:open_food_drawer", handleOpenDrawer);
    return () => window.removeEventListener("trackintake:open_food_drawer", handleOpenDrawer);
  }, []);

  // ── Trigger AI Food Suggestion on Dashboard ───────────────────
  // Maximum 3 times a day: Morning (5-12), Afternoon (12-17), Evening (17-5).
  // Deduplicated across page refreshes via localStorage key.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "user") return;

    // Trigger specifically on dashboard routes
    const isDashboard = location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard");
    if (!isDashboard) return;

    const { slot, mealType, title, icon } = getSlotConfig();
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local format
    const storageKey = `trackintake_suggestion_slot_${user.id}_${today}_${slot}`;

    // If already triggered for this time slot today, do NOT trigger again on refresh!
    if (localStorage.getItem(storageKey) === "true") {
      return;
    }

    // Mark as triggered immediately to avoid race conditions
    localStorage.setItem(storageKey, "true");

    axiosInstance.get(`/suggest-foods/?meal_type=${mealType}&period=daily&slot=${slot}`)
      .then((res) => {
        const top = res.data?.suggestions?.[0];
        if (!top) return;

        const advice = res.data?.overall_advice || `Time for ${mealType}! Here's your personalized AI suggestion:`;

        // 1. Show Pop-up Toast
        setSuggestion({
          message: advice,
          topSuggestion: top.food_name,
          portionSize: top.portion_size,
          reason: top.reasons?.[0] || "Clinically tailored to your nutritional targets.",
          caloriesLeft: res.data?.remaining_nutrients?.calories || top.calories,
          slot,
          slotTitle: title,
          slotIcon: icon,
          suitabilityTags: top.suitability_tags || [],
          receivedAt: Date.now(),
        });

        // 2. Add in-app notification in NotificationDropdown
        pushFoodSuggestionNotification({
          id: Date.now(),
          title: `${icon} ${title}`,
          text: `${top.food_name}: ${top.reasons?.[0] || advice}`,
          data: res.data,
        });
      })
      .catch((err) => {
        console.warn("Could not fetch slot food suggestions:", err);
      });
  }, [isAuthenticated, user?.id, location.pathname]);

  const handleOpenAssistant = () => setIsAssistantOpen(true);
  const handleOpenNutritionSearch = () => setShowNutrition(true);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[var(--color-bg-app)] font-[var(--font-secondary)]">
        <Loader className="w-16 h-16 animate-spin text-[var(--color-primary)]" />
        <p className="text-xl text-[var(--color-text-strong)] font-[var(--font-primary)] mt-4">
          Loading Application...
        </p>
      </div>
    );
  }

  const getRedirectPath = () => {
    const role = user?.role?.toLowerCase();
    if (!role) return "/dashboard";
    switch (role) {
      case "owner":
      case "operator":
      case "nutritionist":
        return `/${role}`;
      case "user":
      default:
        return "/dashboard";
    }
  };

  return (
    <>
      {isAuthenticated && user?.role === "user" && (
        <Navbar
          logo={<img src={logo} alt="logo" className="h-10 w-auto" />}
          align="center"
          links={[
            { label: "Home", to: "/dashboard" },
            { label: "Tools", to: "/dashboard/tools" },
            {
              label: "Health", children: [
                { label: "Health Dashboard", to: "/dashboard/health-dashboard" },
                { label: "Lab Reports", to: "/dashboard/lab-reports" },
                { label: "Add Report", to: "/dashboard/add-report" },
              ]
            },
            { label: "Diet", to: "/dashboard/meals" },
            { label: "Progress", to: "/dashboard/reports" },
            { label: "Blogs", to: "/blogs-section" },
            { label: "Appointments", to: "/dashboard/appointments" },
            { label: "Plans", to: "/dashboard/plans" },
          ]}
          rightContent={
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <ProfileDropdown />
            </div>
          }
        />
      )}

      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <Register />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <ForgotPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={isAuthenticated ? <Navigate to={getRedirectPath()} /> : <ResetPassword />} />
        <Route path="/owner" element={<ProtectedRoute requiredRole="owner"><OwnerPage /></ProtectedRoute>} />
        <Route path="/operator" element={<ProtectedRoute requiredRole="operator"><OperatorPage /></ProtectedRoute>} />
        <Route path="/nutritionist/*" element={<ProtectedRoute requiredRole="nutritionist"><NutritionistPage /></ProtectedRoute>} />
        <Route path="/dashboard/*" element={<ProtectedRoute requiredRole="user"><Dashboard /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/blog/:blogId" element={<BlogDetail />} />
        <Route path="/blogs" element={<HomeBlog />} />
        <Route path="/blogs-section" element={<BlogsPage />} />
        <Route path="/social-auth" element={<SocialAuthHandler />} />
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/Contact" element={<ContactPage />} />
        <Route path="/pages/Career" element={<Career />} />
      </Routes>


      {isAuthenticated && user?.role === "user" && (
        <>
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
            userRole={user?.role}
          />
          <FloatingQuickToolbox
            isOpen={isToolboxOpen}
            onClose={() => setIsToolboxOpen(false)}
            initialTab={toolboxTab}
            userRole={user?.role}
          />
          <FoodSuggestionToast
            suggestion={suggestion}
            onDismiss={() => setSuggestion(null)}
            onViewAll={() => {
              setDrawerInitData(null); // drawer fetches fresh data itself
              setDrawerOpen(true);
            }}
          />

          <FoodSuggestionsDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            initialData={drawerInitData}
          />
        </>
      )}

      {isAuthenticated && user?.role === "user" && <Footer />}

      <ToastContainer position="top-right" autoClose={3000} pauseOnHover theme="light" />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </>
  );
}

export default App;