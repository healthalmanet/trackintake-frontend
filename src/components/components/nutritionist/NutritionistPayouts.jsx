import React, { useState, useEffect } from "react";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2,
  Calendar, User, Video, Search, RefreshCw,
  AlertCircle, ArrowUpRight, Filter, ChevronLeft, Percent, ShieldCheck
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
    <div className="min-h-screen pb-16 bg-white font-[var(--font-secondary)] text-slate-900">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 14 } }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BackButton to="/nutritionist" label="Dashboard" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-bold tracking-wider uppercase mb-1 border border-orange-200">
                Financial Management
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-[var(--font-primary)]">
                Appointment Earnings & Payouts
              </h1>
            </div>
          </div>

          <button
            onClick={fetchPayouts}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-slate-200 bg-white text-xs font-bold text-slate-900 hover:border-orange-500 hover:text-orange-600 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-orange-600" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ── Platform Commission Policy Notice ── */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-white border-2 border-orange-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700 shrink-0 mt-0.5 sm:mt-0">
              <Percent size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-[var(--font-primary)]">
                  Platform Commission Policy: {summary.commission_rate ?? 5}% Fee Cut
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                  Standard Rate
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                TrackIntake retains a {summary.commission_rate ?? 5}% platform commission on online consultations for scheduling, secure video rooms, and payment processing. All figures below represent your net take-home earnings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 bg-orange-100/70 px-3 py-1.5 rounded-xl shrink-0 self-end sm:self-center">
            <ShieldCheck size={15} className="text-orange-600" />
            <span>Automatic Deduction</span>
          </div>
        </div>

        {/* ── Summary Statistics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Net Earnings */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Net Take-Home
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-[var(--font-primary)]">
              ₹{Number(summary.total_earned || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              After {summary.commission_rate ?? 5}% platform cut
            </p>
          </div>

          {/* Pending Payout */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-orange-300 shadow-xs space-y-1 bg-orange-50/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
                Pending Payout
              </span>
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Clock size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-[var(--font-primary)]">
              ₹{Number(summary.pending_payout || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              To be transferred by Admin
            </p>
          </div>

          {/* Completed Payout */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Paid Out
              </span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 font-[var(--font-primary)]">
              ₹{Number(summary.completed_payout || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Disbursed to your account
            </p>
          </div>

          {/* Platform Fee & Bookings Combined Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Platform Cut ({summary.commission_rate ?? 5}%)
              </span>
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Percent size={18} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-600 font-[var(--font-primary)]">
              -₹{Number(summary.platform_commission_total || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Across {summary.total_bookings || 0} online sessions
            </p>
          </div>
        </div>

        {/* ── Toolbar: Filters & Search ── */}
        <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200 self-start max-w-full overflow-x-auto no-scrollbar">
            {[
              { key: "ALL", label: "All Payouts" },
              { key: "PENDING", label: "Pending" },
              { key: "PAID", label: "Completed (Paid)" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === tab.key
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-auto min-w-0 sm:min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-orange-500 focus:outline-none placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* ── Payouts Table ── */}
        <div className="rounded-3xl bg-white border-2 border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={26} className="animate-spin text-orange-600" />
              <p className="text-xs font-semibold text-slate-500">
                Loading earnings records...
              </p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <DollarSign size={36} className="mx-auto text-slate-400 opacity-60" />
              <h3 className="text-base font-bold text-slate-900">
                No Payment Records Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No online appointment bookings match your filter criteria. When patients book online consultations, your earnings will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3.5 px-4">Appt ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Session Date & Time</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Booking Fee</th>
                    <th className="py-3.5 px-4">Platform Fee Cut</th>
                    <th className="py-3.5 px-4">Net Payout</th>
                    <th className="py-3.5 px-4">Payout Status</th>
                    <th className="py-3.5 px-4">Admin Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payouts.map((item) => {
                    const isPending = item.payout_status === "PENDING";
                    const isPaid = item.payout_status === "PAID";
                    const commRate = item.commission_rate ?? summary.commission_rate ?? 5;
                    const commAmount = item.commission_amount ?? (item.fee_amount ? Number(((item.fee_amount * commRate) / 100).toFixed(2)) : 0);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          #{item.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">
                            {item.patient_name || "Patient"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {item.patient_email}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">
                            {fmtDate(item.session_date)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.session_time}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.appointment_type === "VIRTUAL" ? (
                            <span className="inline-flex items-center gap-1 font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg text-[10px]">
                              <Video size={11} /> Virtual
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px]">
                              In-Clinic
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          ₹{item.fee_amount || 0}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-orange-600">
                          {commAmount > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              -₹{commAmount} <span className="text-[10px] text-slate-400">({commRate}%)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">₹0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          ₹{item.payout_amount || item.fee_amount || 0}
                        </td>
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                              <Clock size={11} /> Pending Payout
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-900 border border-slate-300">
                              <CheckCircle2 size={11} /> Paid Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                              {item.payout_status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          {isPaid ? (
                            <div>
                              <p className="font-semibold text-slate-900">
                                {fmtDateTime(item.payout_marked_at)}
                              </p>
                              {item.payout_transaction_ref && (
                                <p className="font-mono text-[10px] text-slate-500">
                                  Ref: {item.payout_transaction_ref}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">Awaiting Admin Settlement</span>
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
