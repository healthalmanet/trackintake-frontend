import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus, CalendarCheck, Sparkles, Clock, CalendarDays } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import BookAppointment from "../components/components/appointments/BookAppointment";
import MyAppointments from "../components/components/appointments/MyAppointments";
import { getMyAppointments } from "../api/appointmentApi";

const AppointmentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "book";
  const [activeTab, setActiveTab] = useState(tabFromUrl); // "book" | "my-appointments"
  const [refresh, setRefresh] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Fetch count of appointments for tab badge
  useEffect(() => {
    getMyAppointments()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setAppointmentCount(list.length);
      })
      .catch(() => {});
  }, [refresh]);

  const handleAppointmentBooked = () => {
    setRefresh((prev) => !prev);
    // Auto transition to "My Appointments" upon successful booking
    handleTabChange("my-appointments");
  };

  return (
    <div className="w-full min-h-screen bg-[var(--color-bg-app)] py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[var(--color-bg-surface)] rounded-3xl border-2 border-[var(--color-border-default)] p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                  <CalendarDays size={20} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Consultation Hub
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Appointments & Consultations
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                Book 1-on-1 virtual Zoom video or in-clinic consultations with clinical nutritionists.
              </p>
            </div>

            {/* Segmented Tab Navigation Switcher */}
            <div className="inline-flex p-1.5 rounded-2xl bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)] self-start md:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => handleTabChange("book")}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === "book"
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                }`}
              >
                <CalendarPlus size={16} />
                <span>Book New Appointment</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("my-appointments")}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  activeTab === "my-appointments"
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                }`}
              >
                <CalendarCheck size={16} />
                <span>My Appointments</span>
                {appointmentCount > 0 && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      activeTab === "my-appointments"
                        ? "bg-white/20 text-white"
                        : "bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)]"
                    }`}
                  >
                    {appointmentCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Conditional Tab Content View */}
        <AnimatePresence mode="wait">
          {activeTab === "book" && (
            <motion.div
              key="book-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <BookAppointment onBooked={handleAppointmentBooked} />
            </motion.div>
          )}

          {activeTab === "my-appointments" && (
            <motion.div
              key="my-appointments-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <MyAppointments refresh={refresh} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppointmentPage;
