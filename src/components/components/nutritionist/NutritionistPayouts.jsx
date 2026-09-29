import React, { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2,
  Calendar, User, Video, Search, RefreshCw,
  AlertCircle, ArrowUpRight, Filter, ChevronLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getNutritionistPayouts } from "../../../api/appointmentApi";
import BackButton from "./BackButton";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NutritionistPayouts = () => {
  const [summary, setSummary] = useState({
    total_earned: 0,
    pending_payout: 0,
    completed_payout: 0,
    total_bookings: 0,
  });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | PAID
  const [search, setSearch] = useState("");

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "ALL") params.payout_status = statusFilter;
      if (search) params.search = search;

      const res = await getNutritionistPayouts(params);
      setSummary(res.data?.summary || {});
      setPayouts(res.data?.payouts || []);
    } catch (err) {
      console.error("Failed to load nutritionist payouts:", err);
      toast.error("Could not fetch payment and payout records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchPayouts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen pb-16 bg-[var(--color-bg-app)] font-[var(--font-secondary)] text-[var(--color-text-strong)]">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 14 } }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BackButton to="/nutritionist" label="Dashboard" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tracking-wider uppercase mb-1 border border-emerald-500/20">
                Financial Management
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Appointment Earnings & Payouts
              </h1>
            </div>
          </div>

          <button
            onClick={fetchPayouts}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs font-bold text-[var(--color-text-strong)] hover:bg-[var(--color-bg-surface-alt)] transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[var(--color-primary)]" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ── Summary Statistics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total Earnings */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Total Earnings
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              ₹{Number(summary.total_earned || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
              From online booking fees
            </p>
          </div>

          {/* Pending Payout */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-amber-500/30 shadow-xs space-y-1 bg-gradient-to-br from-[var(--color-bg-surface)] to-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pending Payout
              </span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 font-[var(--font-primary)]">
              ₹{Number(summary.pending_payout || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 font-medium">
              To be transferred by Admin
            </p>
          </div>

          {/* Completed Payout */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-emerald-500/30 shadow-xs space-y-1 bg-gradient-to-br from-[var(--color-bg-surface)] to-emerald-500/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Paid Out
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 font-[var(--font-primary)]">
              ₹{Number(summary.completed_payout || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium">
              Disbursed to your account
            </p>
          </div>

          {/* Total Bookings */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Online Consultations
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              {summary.total_bookings || 0}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
              Platform appointment sessions
            </p>
          </div>
        </div>

        {/* ── Toolbar: Filters & Search ── */}
        <div className="p-4 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] self-start">
            {[
              { key: "ALL", label: "All Payouts" },
              { key: "PENDING", label: "Pending" },
              { key: "PAID", label: "Completed (Paid)" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? "bg-[var(--color-primary)] text-white shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs text-[var(--color-text-strong)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* ── Payouts Table ── */}
        <div className="rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={26} className="animate-spin text-[var(--color-primary)]" />
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                Loading earnings records...
              </p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <DollarSign size={36} className="mx-auto text-[var(--color-text-muted)] opacity-50" />
              <h3 className="text-base font-bold text-[var(--color-text-strong)]">
                No Payment Records Found
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                No online appointment bookings match your filter criteria. When patients book online consultations, your earnings will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-[var(--color-text-muted)] uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3.5 px-4">Appt ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Session Date & Time</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Fee Collected</th>
                    <th className="py-3.5 px-4">Payout Amount</th>
                    <th className="py-3.5 px-4">Payout Status</th>
                    <th className="py-3.5 px-4">Admin Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-default)]">
                  {payouts.map((item) => {
                    const isPending = item.payout_status === "PENDING";
                    const isPaid = item.payout_status === "PAID";
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[var(--color-bg-surface-alt)] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--color-text-strong)]">
                          #{item.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[var(--color-text-strong)]">
                            {item.patient_name || "Patient"}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[180px]">
                            {item.patient_email}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[var(--color-text-strong)]">
                            {fmtDate(item.session_date)}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {item.session_time}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.appointment_type === "VIRTUAL" ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px]">
                              <Video size={11} /> Virtual
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px]">
                              In-Clinic
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[var(--color-text-muted)]">
                          ₹{item.fee_amount || 0}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[var(--color-text-strong)] text-sm">
                          ₹{item.payout_amount || item.fee_amount || 0}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock size={11} /> Pending Payout
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 size={11} /> Paid Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
                              {item.payout_status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-[var(--color-text-muted)]">
                          {isPaid ? (
                            <div>
                              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {fmtDateTime(item.payout_marked_at)}
                              </p>
                              {item.payout_transaction_ref && (
                                <p className="font-mono text-[10px] text-gray-500">
                                  Ref: {item.payout_transaction_ref}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-gray-400">Awaiting Admin Settlement</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutritionistPayouts;
