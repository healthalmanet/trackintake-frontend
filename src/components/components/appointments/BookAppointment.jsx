import React, { useEffect, useState } from "react";
import { getAvailableSlots, bookAppointment,getMyInHouseNutritionist,getExpertNutritionists } from "../../../api/appointmentApi";
import SlotPicker from "./SlotPicker";
import { useAuth } from "../../context/AuthContext";

const BookAppointment = ({ onBooked }) => {
  const { user } = useAuth();

  const [appointmentCategory, setAppointmentCategory] = useState("IN_HOUSE");
  const [appointmentType, setAppointmentType] = useState("IN_PERSON");

  const [experts, setExperts] = useState([]);
  const [expertId, setExpertId] = useState("");

  const [nutritionistId, setNutritionistId] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(false);

  // -------------------------------
  // IN-HOUSE: fetch assigned nutritionist
  // -------------------------------
  useEffect(() => {
    if (!user) return;

    if (appointmentCategory === "IN_HOUSE") {
      setExperts([]);
      setExpertId("");
      setSlots([]);
      setNutritionistId(null);

      getMyInHouseNutritionist()
        .then((res) => {
          setNutritionistId(res.data.nutritionist_id);
        })
        .catch(() => {
          setNutritionistId(null);
        });
    }
  }, [appointmentCategory, user]);

  // -------------------------------
  // EXPERT: fetch expert list
  // -------------------------------
  useEffect(() => {
    if (appointmentCategory === "EXPERT") {
      setNutritionistId(null);
      setExpertId("");
      setSlots([]);

      getExpertNutritionists()
        .then((res) => {
          setExperts(res.data); // [{id, name}]
        })
        .catch(() => {
          setExperts([]);
        });
    }
  }, [appointmentCategory]);

  // -------------------------------
  // Fetch slots
  // -------------------------------
  const fetchSlots = async () => {
    if (!nutritionistId || !date) return;

    try {
      const res = await getAvailableSlots(nutritionistId, date);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      setSlots(data);
    } catch {
      setSlots([]);
    }
  };

  // -------------------------------
  // Book appointment
  // -------------------------------
  const handleBook = async (slotId) => {
    try {
      setLoading(true);

      await bookAppointment({
        slot_id: slotId,
        appointment_category: appointmentCategory,
        appointment_type: appointmentType,
        expert_id: appointmentCategory === "EXPERT" ? expertId : null,
      });

      alert("Appointment booked successfully");

      await fetchSlots();
      onBooked?.();
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="border p-4 rounded bg-white">
      <h2 className="font-semibold mb-3">Book Appointment</h2>

      {/* Appointment Category */}
      <label className="block text-sm font-medium mb-1">
        Appointment With
      </label>
      <select
        value={appointmentCategory}
        onChange={(e) => setAppointmentCategory(e.target.value)}
        className="border p-2 w-full mb-3"
      >
        <option value="IN_HOUSE">In-House Nutritionist</option>
        <option value="EXPERT">Expert Nutritionist</option>
      </select>

      {/* Expert Dropdown */}
      {appointmentCategory === "EXPERT" && (
        <select
          value={expertId}
          onChange={(e) => {
            const id = e.target.value;
            setExpertId(id);
            setNutritionistId(id);
            setSlots([]);
          }}
          className="border p-2 w-full mb-2"
        >
          <option value="">Select Expert</option>
          {experts.map((exp) => (
            <option key={exp.id} value={exp.id}>
              {exp.name}
            </option>
          ))}
        </select>
      )}

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      {/* Appointment Type */}
      <select
        value={appointmentType}
        onChange={(e) => setAppointmentType(e.target.value)}
        className="border p-2 w-full mb-3"
      >
        <option value="IN_PERSON">In Person</option>
        <option value="VIRTUAL">Virtual</option>
      </select>

      {/* Check Availability */}
      <button
        onClick={fetchSlots}
        disabled={!date || !nutritionistId}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        Check Availability
      </button>

      {/* Slots */}
      <SlotPicker
        slots={slots}
        onBook={handleBook}
        loading={loading}
      />
    </div>
  );
};

export default BookAppointment;