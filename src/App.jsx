import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./components/context/AuthContext";
import { Loader } from "lucide-react";
import { useState } from "react";

// Public pages (imports are unchanged)
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./components/components/ForgotPassword";
import ResetPassword from "./components/components/ResetPassword";
import Unauthorized from "./pages/Unauthorized";

// Role-based dashboards (imports are unchanged)
import OwnerPage from "./pages/OwnerPage";
import OperatorPage from "./pages/OperatorPage";
import NutritionistPage from "./pages/NutritionistPage";
import Dashboard from "./pages/Dashboard";

// Shared UI components (imports are unchanged)
import Navbar from "./components/components/Navbar";
import NotificationDropdown from "./components/components/NotificationDropdown";
import Footer from "./components/components/Footer";

import ProtectedRoute from "./components/components/ProtectedRoute";
import logo from "./assets/logo.png"; // Kept your logo import

import BlogDetail from "./components/components/BlogDetails";
import BlogsPage from "./components/components/Blogs";
import HomeBlog from "./components/components/HomeBlog";
// Toast notifications (kept your original react-toastify)
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProfileDropdown } from "./components/components/ProfileDropdown";
import QuickTools from "./components/components/nutritionist/QuickTools";
import SmartAssistant from "./components/components/nutritionist/SmartAssistant";
import NutritionPopup from "./components/components/nutritionist/NutritionPopup";
import ChatPopUp from "./components/components/messages/ChatPopUp"
import SocialAuthHandler from "./components/components/SocialAuthHandler";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";


function App() {
  const { isAuthenticated, user, loading } = useAuth();

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
     const [showNutrition, setShowNutrition] = useState(false);
     const [isChatOpen, setIsChatOpen] = useState(false);

   
   const handleOpenAssistant = () => setIsAssistantOpen(true);
 // This is the new, correct line
const handleOpenNutritionSearch = () => setShowNutrition(true);

  // Themed loading state
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

  // ✅ Logic is completely unchanged
  const getRedirectPath = () => {
    const role = user?.role?.toLowerCase();
    if (!role) return "/";
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
      {/* ✅ Navbar props are completely unchanged from your original code */}
      {isAuthenticated && user?.role === "user" && (
        <Navbar
          logo={<img src={logo} alt="logo" className="h-10 w-auto" />}
          align="center"
          links={[
            { label: "Home", to: "/dashboard" },
            { label: "Tools", to: "/dashboard/tools" },
            { label: "Health", to: "/dashboard/health-section" },
            { label: "Diet", to: "/dashboard/meals" },
            { label: "Progress", to: "/dashboard/reports" },
            { label: "Blogs", to: "/blogs-section" },
            { label: "Appointments", to: "/dashboard/appointments" },
            { label: "Plans", to: "/dashboard/plans" },
          ]}
          
          rightContent={
  <>
    <div className="flex items-center gap-4">
    <NotificationDropdown />
    <ProfileDropdown />
    </div>
  </>
}

        />
      )}

      {/* ✅ Routes are completely unchanged */}
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
        <Route path="/blogs" element={<HomeBlog/>} />
        <Route path="/blogs-section" element={<BlogsPage/>} />
        <Route path="/social-auth" element={<SocialAuthHandler />} />
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />

        
      </Routes>

      {/* ✅ Chatbot and Footer are completely unchanged */}
      {isAuthenticated && user?.role === "user" && 
      <>  
       <QuickTools 
        onOpenAssistant={handleOpenAssistant}
        onOpenNutrition={handleOpenNutritionSearch}
         onOpenChat={() => setIsChatOpen(true)}
          userRole={user?.role}
      />

       <SmartAssistant
        isVisible={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

       <NutritionPopup
        isVisible={showNutrition}
        onClose={() => setShowNutrition(false)}
      />

      <ChatPopUp 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
            />

      </>

      
    }
      {isAuthenticated && user?.role === "user" && <Footer />}

      {/* ✅ ToastContainer is completely unchanged in the JSX */}
      <ToastContainer position="top-right" autoClose={3000} pauseOnHover theme="light" />
    </>
  );
}

export default App;