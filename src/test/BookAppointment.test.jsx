import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { extractErrorMessage } from "../components/components/appointments/BookAppointment";
import SlotPicker from "../components/components/appointments/SlotPicker";

describe("extractErrorMessage", () => {
  it("extracts string directly from non_field_errors array", () => {
    const error = {
      response: {
        data: {
          non_field_errors: ["This slot is reserved for Virtual appointments."]
        }
      }
    };
    expect(extractErrorMessage(error)).toBe("This slot is reserved for Virtual appointments.");
  });

  it("extracts string from raw array", () => {
    const error = {
      response: {
        data: ["This slot is reserved for Virtual appointments."]
      }
    };
    expect(extractErrorMessage(error)).toBe("This slot is reserved for Virtual appointments.");
  });

  it("extracts detail and message fields", () => {
    expect(extractErrorMessage({ response: { data: { detail: "Custom detail error" } } })).toBe("Custom detail error");
    expect(extractErrorMessage({ response: { data: { message: "Custom message error" } } })).toBe("Custom message error");
  });

  it("falls back gracefully when error is empty", () => {
    expect(extractErrorMessage(null, "Booking failed. Try again.")).toBe("Booking failed. Try again.");
  });
});

describe("SlotPicker Component", () => {
  const sampleSlots = [
    {
      id: 101,
      start_time: "09:00:00",
      end_time: "09:30:00",
      slot_type: "VIRTUAL",
      online_price: 500,
      offline_price: 700,
    },
    {
      id: 102,
      start_time: "10:00:00",
      end_time: "10:30:00",
      slot_type: "IN_PERSON",
      online_price: 500,
      offline_price: 700,
    },
    {
      id: 103,
      start_time: "11:00:00",
      end_time: "11:30:00",
      slot_type: "BOTH",
      online_price: 500,
      offline_price: 700,
    }
  ];

  it("only displays slots compatible with VIRTUAL mode", () => {
    render(
      <SlotPicker
        slots={sampleSlots}
        onBook={vi.fn()}
        loading={false}
        pendingSlotId={null}
        appointmentType="VIRTUAL"
      />
    );

    // Slot 101 (VIRTUAL) and 103 (BOTH) should be visible
    expect(screen.getByText("09:00:00 – 09:30:00")).toBeInTheDocument();
    expect(screen.getByText("11:00:00 – 11:30:00")).toBeInTheDocument();
    // Slot 102 (IN_PERSON) must NOT be visible
    expect(screen.queryByText("10:00:00 – 10:30:00")).not.toBeInTheDocument();
  });

  it("only displays slots compatible with IN_PERSON mode", () => {
    render(
      <SlotPicker
        slots={sampleSlots}
        onBook={vi.fn()}
        loading={false}
        pendingSlotId={null}
        appointmentType="IN_PERSON"
      />
    );

    // Slot 102 (IN_PERSON) and 103 (BOTH) should be visible
    expect(screen.getByText("10:00:00 – 10:30:00")).toBeInTheDocument();
    expect(screen.getByText("11:00:00 – 11:30:00")).toBeInTheDocument();
    // Slot 101 (VIRTUAL) must NOT be visible
    expect(screen.queryByText("09:00:00 – 09:30:00")).not.toBeInTheDocument();
  });

  it("displays loading spinner and banner while booking is in progress", () => {
    render(
      <SlotPicker
        slots={sampleSlots}
        onBook={vi.fn()}
        loading={true}
        pendingSlotId={101}
        appointmentType="VIRTUAL"
      />
    );

    expect(screen.getByText(/Confirming your appointment booking/i)).toBeInTheDocument();
    expect(screen.getByText(/^Booking\.\.\.$/i)).toBeInTheDocument();
  });
});
