import React, { useState, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import NutriNavbar from "../components/components/nutritionist/NutriNavbar";
import Footer from "../components/components/Footer";

// Eagerly load primary dashboard view
import NutritionistDashboard from "../components/components/nutritionist/NutritionistDashboard";

import QuickTools from "../components/components/nutritionist/QuickTools";
import SmartAssistant from "../components/components/nutritionist/SmartAssistant";
import NutritionPopup from "../components/components/nutritionist/NutritionPopup";

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
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  const handleOpenAssistant = () => setIsAssistantOpen(true);
  const handleOpenNutritionSearch = () => setShowNutrition(true);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-app)]">
      {/* 🌟 Persistent NutriNavbar across ALL nutritionist sub-pages */}
      <div className="sticky top-0 z-40 bg-[var(--color-bg-surface-glass)] backdrop-blur-md shadow-sm">
        <NutriNavbar />
      </div>

      {/* 📄 Dynamic Routed Content with Suspense Code-Splitting */}
      <div className="flex-1">
        <Suspense fallback={<PageFallbackLoader />}>
          <Routes>
            <Route path="/" element={<NutritionistDashboard />} />
            <Route path="patient/:id" element={<PatientDetailsPage />} />
            <Route path="chat" element={<Chat />} />
            <Route path="search" element={<NutritionSearchLayout />} />
            <Route path="availability" element={<AddAvailability />} />
            <Route path="subscription" element={<NutritionistSubscription />} />
            <Route path="profile" element={<NutritionistProfile />} />
          </Routes>
        </Suspense>
      </div>

      {/* 🦶 Persistent Footer on Nutritionist side */}
      <Footer />

      {/* 🛠️ Floating Tools & Overlays */}
      <QuickTools 
        onOpenAssistant={handleOpenAssistant}
        onOpenNutrition={handleOpenNutritionSearch}
        userRole="nutritionist"
      />

      {isAssistantOpen && (
        <SmartAssistant
          isVisible={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      )}

      {showNutrition && (
        <NutritionPopup
          isVisible={showNutrition}
          onClose={() => setShowNutrition(false)}
        />
      )}
    </div>
  );
};

export default NutritionistPage;
