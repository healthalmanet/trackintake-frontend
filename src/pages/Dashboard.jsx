import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/context/AuthContext";
import AppointmentPage from "./AppointmentPage";

import UserProfileForm from "./dashboard/UserProfileForm";
import Tools from "./dashboard/Tools/Tools";
import BmiCalculator from "./dashboard/Tools/BmiCalculator";
import FatCalculator from "./dashboard/Tools/FatCalculator";
import FatResult from "./dashboard/Tools/FatResult";
import MealLogger from "./dashboard/Tools/MealLogger";
import NutritionSearch from "./dashboard/Tools/NutritionSearch";
import WeightTracker from "./dashboard/Tools/WeightTracker";
import WaterTracker from "./dashboard/Tools/WaterTracker";
import CustomReminder from "./dashboard/Tools/CustomReminder";
import HealthSection from "./dashboard/Tools/HealthSection";
import Meals from "./dashboard/Meals";
import Reports from "./Reports";

import HeroSection from "../components/components/HeroSection";
import QuickMealLogger from "../components/components/MealLogger/QuickMealLogger";
import WaterIntakeWidget from "../components/components/WaterTracker/WaterWidget";
import HealthTools from "../components/components/HealthSection";
import DietRecommendations from "../components/components/RecommendationSection";
import HealthDashboard from "../components/components/diabetic/HealthDashboard";
import LabReports from "./dashboard/health/LabReports";
import AddReport from "./dashboard/health/AddReport";
import BlogsPage from "../components/components/Blogs";
import PatientChat from "../components/components/messages/PatientChat";
import DashboardPlans from "./dashboard/plans";
import UpgradeCard from "../components/subscription/upgradecard";
import { getMySubscription } from "../api/subscriptionService";

import SubscriptionGuard from "../components/subscription/SubscriptionGuard";

const DashboardHome = ({
  waterUpdateTrigger,
  mealUpdateTrigger,
  onMealLogged,
  onWaterLogged,
}) => (
  <>
    <HeroSection
      waterUpdateTrigger={waterUpdateTrigger}
      mealUpdateTrigger={mealUpdateTrigger}
    />
    <UpgradeCard />
    <QuickMealLogger onMealLogged={onMealLogged} />
    <WaterIntakeWidget onWaterLogged={onWaterLogged} />
    <HealthTools />
    <DietRecommendations />
  </>
);

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();

  const [waterUpdateTrigger, setWaterUpdateTrigger] = useState(0);
  const [mealUpdateTrigger, setMealUpdateTrigger] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (userRole !== "user") {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <Routes>
        <Route path="plans" element={<DashboardPlans />} />
        <Route
          path="*"
          element={
            <SubscriptionGuard role="user">
              <Routes>
                <Route
                  index
                  element={
                    <DashboardHome
                      waterUpdateTrigger={waterUpdateTrigger}
                      mealUpdateTrigger={mealUpdateTrigger}
                      onMealLogged={() => setMealUpdateTrigger((prev) => prev + 1)}
                      onWaterLogged={() => setWaterUpdateTrigger((prev) => prev + 1)}
                    />
                  }
                />
                <Route path="user-profile" element={<UserProfileForm />} />
                <Route path="tools" element={<Tools />} />
                <Route path="tools/bmi" element={<BmiCalculator />} />
                <Route path="tools/fat-calculator" element={<FatCalculator />} />
                <Route path="fat-result" element={<FatResult />} />
                <Route path="tools/meal-log" element={<MealLogger />} />
                <Route path="tools/nutrition-search" element={<NutritionSearch />} />
                <Route path="tools/weight-tracker" element={<WeightTracker />} />
                <Route path="tools/water-tracker" element={<WaterTracker />} />
                <Route path="tools/custom-reminder" element={<CustomReminder />} />
                <Route path="health-section" element={<HealthSection />} />
                <Route path="health-dashboard" element={<HealthDashboard />} />
                <Route path="lab-reports" element={<LabReports />} />
                <Route path="add-report" element={<AddReport />} />
                <Route path="meals" element={<Meals />} />
                <Route path="reports" element={<Reports />} />
                <Route path="diabetes" element={<HealthDashboard />} />
                <Route path="blogs-section" element={<BlogsPage />} />
                <Route path="messages" element={<PatientChat />} />
                <Route path="appointments" element={<AppointmentPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </SubscriptionGuard>
          }
        />
      </Routes>
    </div>
  );
}

export default Dashboard;
