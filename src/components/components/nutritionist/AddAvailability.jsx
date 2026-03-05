import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarDays,
  Trash2,
  Plus,
  Lock,
  Home,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

const AddAvailability = () => {
  const navigate = useNavigate();

  /* ---------------- Create Slot State ---------------- */
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [generatedSlots, setGeneratedSlots] = useState([]);

  /* ---------------- Existing Slots State ---------------- */
  const [unbookedSlots, setUnbookedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- Search & Filter ---------------- */
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [status, setStatus] = useState(""); // booked | unbooked | ""

  /* ---------------- UI State ---------------- */
  const [showUnbooked, setShowUnbooked] = useState(true);
  const [showBooked, setShowBooked] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  /* ---------------- Fetch Slots (WITH SEARCH) ---------------- */
  const fetchMySlots = async () => {
    try {
      const res = await axiosInstance.get(
        "/appointments/nutritionist/my-slots/",
        {
          params: {
            search: search || undefined,
            date: filterDate || undefined,
            status: status || undefined,
          },
        }
      );

      setUnbookedSlots(res.data?.unbooked_slots || []);
      setBookedSlots(res.data?.booked_slots || []);
    } catch {
      toast.error("Failed to load availability slots");
      setUnbookedSlots([]);
      setBookedSlots([]);
    }
  };

  useEffect(() => {
    fetchMySlots();
  }, []);

  // 🔁 debounce search
  useEffect(() => {
    const t = setTimeout(fetchMySlots, 400);
    return () => clearTimeout(t);
  }, [search, filterDate, status]);

  /* ---------------- Generate Slots ---------------- */
  const generateSlots = () => {
    if (!date || !startTime || !endTime) {
      toast.error("Please complete all fields");
      return;
    }

    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    const temp = [];
    let start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (start < end) {
      const next = new Date(start.getTime() + duration * 60000);
      if (next > end) break;

      temp.push({
        date,
        start_time: start.toTimeString().slice(0, 5),
        end_time: next.toTimeString().slice(0, 5),
      });

      start = next;
    }

    setGeneratedSlots(temp);
  };

  /* ---------------- Save Slot ---------------- */
  const saveSlot = async (slot) => {
    setLoading(true);
    try {
      await axiosInstance.post(
        "/appointments/nutritionist/add-availability/",
        slot
      );
      toast.success("Availability slot added");

      setGeneratedSlots((prev) =>
        prev.filter(
          (s) =>
            s.start_time !== slot.start_time ||
            s.end_time !== slot.end_time
        )
      );

      fetchMySlots();
    } catch {
      toast.error("Slot already exists");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Delete Slot ---------------- */
  const deleteSlot = async (id) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    try {
      await axiosInstance.delete(
        `/appointments/nutritionist/slots/${id}/delete/`
      );
      toast.success("Slot deleted");
      fetchMySlots();
    } catch {
      toast.error("Booked slots cannot be deleted");
    }
  };

  /* ---------------- Helpers ---------------- */
  const formatSlotDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <Toaster position="top-right" />

      {/* Top Bar */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => navigate("/nutritionist")}
            className="flex items-center gap-1 hover:text-green-600 font-medium"
          >
            <Home size={16} /> Home
          </button>
          <ChevronRight size={16} />
          <span className="font-semibold text-gray-800">
            Manage Availability
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="text-green-600" />
          <span className="text-lg font-bold text-gray-800">
            Availability Management
          </span>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">

        {/* ================= CREATE AVAILABILITY ================= */}
        <div className="bg-white rounded-xl border p-6 mb-10">
          <h2 className="text-lg font-semibold mb-4">
            Create Availability Slots
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <input type="date" min={today} value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-lg p-2"
            />
            <input type="time" value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border rounded-lg p-2"
            />
            <input type="time" value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border rounded-lg p-2"
            />
            <select value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="border rounded-lg p-2"
            >
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
            </select>
          </div>

          <button
            onClick={generateSlots}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Generate Slots
          </button>
        </div>

        {/* ================= GENERATED SLOTS ================= */}
        {generatedSlots.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3">
              Generated Slots
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {generatedSlots.map((slot, i) => (
                <div key={i}
                  className="p-4 border rounded-xl bg-green-50 flex justify-between items-center"
                >
                  <span className="font-medium">
                    {slot.start_time} – {slot.end_time}
                  </span>
                  <button
                    disabled={loading}
                    onClick={() => saveSlot(slot)}
                    className="text-green-700 font-semibold flex items-center gap-1"
                  >
                    <Plus size={16} /> Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEARCH ================= */}
        <div className="bg-white border rounded-xl p-4 mb-8">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search patient name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border pl-9 p-2 rounded w-full"
              />
            </div>

            <input type="date" value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border p-2 rounded"
            />

            <select value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">All Slots</option>
              <option value="booked">Booked</option>
              <option value="unbooked">Available</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setFilterDate("");
                setStatus("");
              }}
              className="border rounded p-2 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ================= AVAILABLE SLOTS ================= */}
        <button
          onClick={() => setShowUnbooked((v) => !v)}
          className="flex items-center gap-2 text-lg font-semibold mb-3"
        >
          <ChevronDown className={`${showUnbooked ? "" : "-rotate-90"}`} />
          🟢 Available Slots ({unbookedSlots.length})
        </button>

        {showUnbooked && (
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {unbookedSlots.map((slot) => (
              <div key={slot.id}
                className="p-4 rounded-xl border bg-green-50"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">
                      {slot.start_time} – {slot.end_time}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatSlotDate(slot.date)}
                    </p>
                  </div>
                  <Trash2
                    size={18}
                    className="text-red-500 cursor-pointer"
                    onClick={() => deleteSlot(slot.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= BOOKED SLOTS ================= */}
        <button
          onClick={() => setShowBooked((v) => !v)}
          className="flex items-center gap-2 text-lg font-semibold mb-3"
        >
          <ChevronDown className={`${showBooked ? "" : "-rotate-90"}`} />
          🔴 Booked Slots ({bookedSlots.length})
        </button>

        {showBooked && (
          <div className="grid md:grid-cols-3 gap-4">
            {bookedSlots.map((slot) => (
              <div key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className="p-4 rounded-xl border bg-orange-50 cursor-pointer"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">
                      {slot.start_time} – {slot.end_time}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatSlotDate(slot.date)}
                    </p>
                  </div>
                  <Lock size={18} className="text-orange-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAvailability;
