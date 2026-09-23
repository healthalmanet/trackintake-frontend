import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Responsive Back Button for Nutritionist pages
 * Supports custom fallback route or browser history back (-1).
 */
const BackButton = ({
  to,
  label = "Back",
  className = "",
  fallback = "/nutritionist",
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-[var(--color-text-strong)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 ${className}`}
      aria-label={label}
    >
      <ArrowLeft size={16} className="text-[var(--color-primary)] transition-transform group-hover:-translate-x-1" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
