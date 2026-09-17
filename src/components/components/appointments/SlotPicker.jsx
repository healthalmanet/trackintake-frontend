import React, { useState, useMemo } from "react";
import { Video, Clock, Building2, Layers, Sun, Sunrise, Sunset, Sparkles } from "lucide-react";

const SlotPicker = ({ slots, onBook, loading, appointmentType = "VIRTUAL" }) => {
  const [timeFilter, setTimeFilter] = useState("ALL"); // ALL | MORNING | AFTERNOON | EVENING

  // Filter slots by time of day
  const filteredSlots = useMemo(() => {
    if (!Array.isArray(slots)) return [];
    return slots.filter((slot) => {
      if (timeFilter === "ALL") return true;
      const hour = parseInt(slot.start_time.split(":")[0], 10);
      if (timeFilter === "MORNING") return hour < 12;
      if (timeFilter === "AFTERNOON") return hour >= 12 && hour < 17;
      if (timeFilter === "EVENING") return hour >= 17;
      return true;
    });
  }, [slots, timeFilter]);

  if (!Array.isArray(slots) || slots.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
        <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-subtle)] opacity-40" />
        <p className="text-[var(--color-text-muted)] text-sm font-semibold">
          No open slots found for this date
        </p>
        <p className="text-[var(--color-text-subtle)] text-xs mt-1">
          Please select another date or check other consultation modes to view open times.
        </p>
      </div>
    );
  }

  const morningCount = slots.filter((s) => parseInt(s.start_time.split(":")[0], 10) < 12).length;
  const afternoonCount = slots.filter((s) => {
    const h = parseInt(s.start_time.split(":")[0], 10);
    return h >= 12 && h < 17;
  }).length;
  const eveningCount = slots.filter((s) => parseInt(s.start_time.split(":")[0], 10) >= 17).length;

  return (
    <div className="space-y-3 mt-3">
      {/* Time of Day Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
        {[
          { key: "ALL", label: `All Times (${slots.length})`, icon: <Clock size={12} /> },
          { key: "MORNING", label: `Morning (${morningCount})`, icon: <Sunrise size={12} /> },
          { key: "AFTERNOON", label: `Afternoon (${afternoonCount})`, icon: <Sun size={12} /> },
          { key: "EVENING", label: `Evening (${eveningCount})`, icon: <Sunset size={12} /> },
        ].map((f) => (
          <button
            type="button"
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeFilter === f.key
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
            }`}
          >
            {f.icon}
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {filteredSlots.length === 0 ? (
        <div className="text-center py-6 px-3 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            No slots in the {timeFilter.toLowerCase()} slot window. Try selecting "All Times".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredSlots.map((slot) => {
            const mode = slot.slot_type || "VIRTUAL";
            const isInPerson = mode === "IN_PERSON";
            const isBoth = mode === "BOTH";

            // Compute the price based on active appointmentType or slot default
            const effectivePrice = appointmentType === "IN_PERSON"
              ? (slot.offline_price ?? slot.price ?? 0)
              : (slot.online_price ?? slot.price ?? 0);

            const isPayAtClinic = appointmentType === "IN_PERSON" && slot.offline_payment_required === false;

            return (
              <button
                key={slot.id}
                disabled={loading}
                onClick={() => onBook(slot.id)}
                className="group relative flex flex-col p-3.5 rounded-2xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-surface-alt)] transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-xs hover:shadow-md cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs sm:text-sm font-black text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                    {slot.start_time} – {slot.end_time}
                  </span>

                  {/* Mode Badge */}
                  {mode === "VIRTUAL" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      <Video size={10} /> Online
                    </span>
                  )}
                  {isInPerson && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Building2 size={10} /> In-Clinic
                    </span>
                  )}
                  {isBoth && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      <Layers size={10} /> Online / Clinic
                    </span>
                  )}
                </div>

                {/* Price and Payment terms */}
                <div className="flex items-center justify-between w-full mt-1 pt-2 border-t border-[var(--color-border-default)]/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[var(--color-text-strong)] text-xs sm:text-sm">
                      ₹{effectivePrice}
                    </span>
                    {isPayAtClinic ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        Pay at Clinic
                      </span>
                    ) : effectivePrice > 0 ? (
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                        Online / Quota
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md">
                        Plan Included
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[var(--color-primary)] group-hover:underline">
                    Select Slot →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
