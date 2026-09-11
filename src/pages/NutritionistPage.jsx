import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NutritionistDashboard from "../components/components/nutritionist/NutritionistDashboard";
import PatientDetailsPage from "../components/components/nutritionist/PatientDetailsPage";
import Chat from "../components/components/nutritionist/Chat";
import QuickTools from "../components/components/nutritionist/QuickTools";
import SmartAssistant from "../components/components/nutritionist/SmartAssistant";
import NutritionPopup from "../components/components/nutritionist/NutritionPopup";
import AddAvailability from "../components/components/nutritionist/AddAvailability";
import NutritionSearchLayout from "../components/components/nutritionist/NutritionSearchLayout";
import NutritionistSubscription from "../components/components/nutritionist/NutritionistSubscription";
import NutritionistProfile from "../components/components/nutritionist/NutritionistProfile";
import NutriNavbar from "../components/components/nutritionist/NutriNavbar";
import Footer from "../components/components/Footer";

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

      {/* 📄 Dynamic Routed Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<NutritionistDashboard />} />
          <Route path="patient/:id" element={<PatientDetailsPage />} />
          <Route path="chat" element={<Chat />} />
          <Route path="search" element={<NutritionSearchLayout />} />
          <Route path="availability" element={<AddAvailability />} />
          <Route path="subscription" element={<NutritionistSubscription />} />
          <Route path="profile" element={<NutritionistProfile />} />
        </Routes>
      </div>

      {/* 🦶 Persistent Footer on Nutritionist side */}
      <Footer />

      {/* 🛠️ Floating Tools & Overlays */}
      <QuickTools 
        onOpenAssistant={handleOpenAssistant}
        onOpenNutrition={handleOpenNutritionSearch}
        userRole="nutritionist"
      />

      <SmartAssistant
        isVisible={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      <NutritionPopup
        isVisible={showNutrition}
        onClose={() => setShowNutrition(false)}
      />
    </div>
  );
};

export default NutritionistPage;
