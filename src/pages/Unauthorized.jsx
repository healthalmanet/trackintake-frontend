import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LayoutDashboard, LogOut, LogIn, Home, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../components/context/AuthContext";

const Unauthorized = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const attemptedPath = state.from || null;
  const requiredRole = state.requiredRole || null;
  const currentRole = (user?.role || state.userRole || "User").toLowerCase();

  const getDashboardPath = () => {
    switch (currentRole) {
      case "owner":
        return "/owner";
      case "operator":
        return "/operator";
      case "nutritionist":
        return "/nutritionist";
      case "user":
      default:
        return "/dashboard";
    }
  };

  const getRoleDisplayName = (role) => {
    if (!role) return "User";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-app)] text-center p-4 sm:p-6 font-[var(--font-secondary)]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-[var(--color-bg-surface)] p-8 sm:p-10 rounded-2xl shadow-xl border border-[var(--color-border-default)] w-full max-w-lg flex flex-col items-center"
      >
        {/* Shield Icon */}
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 bg-[var(--color-danger-bg-subtle)] rounded-full flex items-center justify-center mb-5 ring-8 ring-red-50"
        >
          <ShieldAlert className="w-10 h-10 text-[var(--color-danger-text)]" strokeWidth={2.2} />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl font-[var(--font-primary)] font-bold text-[var(--color-text-strong)] mb-2"
        >
          Access Denied
        </motion.h1>

        {/* Subtitle description */}
        <motion.p
          variants={itemVariants}
          className="text-base text-[var(--color-text-default)] mb-5 max-w-md leading-relaxed"
        >
          {isAuthenticated ? (
            <>
              You do not have the required permissions to view this page
              {attemptedPath ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded ml-1 text-gray-700">{attemptedPath}</span> : ""}.
              {requiredRole && (
                <span className="block mt-1 text-sm text-[var(--color-text-muted)]">
                  Required Role: <strong className="text-[var(--color-primary)]">{getRoleDisplayName(requiredRole)}</strong>
                </span>
              )}
            </>
          ) : (
            "Your session may have expired or you need to be signed in with an authorized account to access this page."
          )}
        </motion.p>

        {/* User Info Card if Authenticated */}
        {isAuthenticated && user && (
          <motion.div
            variants={itemVariants}
            className="w-full bg-[var(--color-bg-surface-alt)] p-4 rounded-xl border border-[var(--color-border-default)] mb-6 text-left flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="font-semibold text-[var(--color-text-strong)] truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-green-600 inline" />
                  Role: <span className="font-medium text-gray-800">{getRoleDisplayName(user.role || currentRole)}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardPath()}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-[var(--color-primary-hover)] transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl border border-gray-300 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Switch Account</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-[var(--color-primary-hover)] transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In Again</span>
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl border border-gray-300 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Homepage</span>
              </Link>
            </>
          )}
        </motion.div>

        {/* Secondary Back Navigation */}
        <motion.div variants={itemVariants} className="mt-5 flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isAuthenticated ? getDashboardPath() : "/");
              }
            }}
            className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <span>•</span>
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;