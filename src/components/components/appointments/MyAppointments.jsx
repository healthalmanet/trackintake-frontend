import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/appointments/my/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
      setAppointments(data);
    } catch {
      toast.error("Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const onFocus = () => fetchAppointments();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const cancelAppointment = async (appointmentId) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await axiosInstance.post(
        `/appointments/appointments/${appointmentId}/cancel/`
      );
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const canCancelAppointment = (date, startTime) => {
    const slotDateTime = new Date(`${date}T${startTime}`);
    return new Date() < slotDateTime;
  };

  const formatSlotDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (value) =>
    new Date(value).toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6">My Appointments</h1>

      {loading ? (
        <p>Loading...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments found</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="p-4 border rounded-xl bg-white shadow"
            >
              <p className="font-semibold">
                Nutritionist: {a.nutritionist_name}
              </p>

              {/* ✅ SLOT TIME + DATE */}
              <div className="mt-1">
                <p className="font-semibold">
                  {a.slot.start_time} – {a.slot.end_time}
                </p>
                <p className="text-sm text-gray-600">
                  {formatSlotDate(a.slot.date)}
                </p>
              </div>

              {/* ✅ BOOKING DATE */}
              <p className="text-sm text-gray-600 mt-1">
                Booked on: {formatDateTime(a.created_at)}
              </p>

              <p className="text-sm mt-2">
                Type: {a.appointment_type}
              </p>

              <p className="text-sm mt-1">
                Status: {a.status}
              </p>

              {a.status === "CONFIRMED" && (
                <button
                  disabled={
                    !canCancelAppointment(
                      a.slot.date,
                      a.slot.start_time
                    )
                  }
                  onClick={() => cancelAppointment(a.id)}
                  className={`mt-3 font-semibold ${
                    canCancelAppointment(
                      a.slot.date,
                      a.slot.start_time
                    )
                      ? "text-red-600"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;