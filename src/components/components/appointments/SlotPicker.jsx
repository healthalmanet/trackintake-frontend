import React from "react";
import { Video, Clock } from "lucide-react";

const SlotPicker = ({ slots, onBook, loading }) => {
  if (!Array.isArray(slots) || slots.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
        <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-subtle)] opacity-40" />
        <p className="text-[var(--color-text-muted)] text-sm font-medium">
          No available slots for this date
        </p>
        <p className="text-[var(--color-text-subtle)] text-xs mt-1">
          Please select another date to view nutritionist availability
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
      {slots.map((slot) => (
        <button
          key={slot.id}
          disabled={loading}
          onClick={() => onBook(slot.id)}
          className="group relative flex flex-col p-3 rounded-xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-surface-alt)] transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
              {slot.start_time} – {slot.end_time}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <Video size={10} /> Virtual
            </span>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Click to book Zoom video consultation
          </span>
        </button>
      ))}
    </div>
  );
};

export default SlotPicker;
