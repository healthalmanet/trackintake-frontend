import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDiabeticProfile } from "../../../api/diabeticApi";
import { toast } from "react-hot-toast";
import { Loader, UploadCloud, X, Plus } from "lucide-react";

const defaultForm = {
  date: new Intl.DateTimeFormat("en-CA").format(new Date()),
  weight_kg: "", height_cm: "", waist_circumference_cm: "",
  blood_pressure_systolic: "", blood_pressure_diastolic: "",
  fasting_blood_sugar: "", postprandial_sugar: "", hba1c: "",
  ldl_cholesterol: "", hdl_cholesterol: "", triglycerides: "",
  crp: "", esr: "", uric_acid: "", creatinine: "", urea: "",
  alt: "", ast: "", vitamin_d3: "", vitamin_b12: "", tsh: "",
};

const FIELD_PLACEHOLDERS = {
  weight_kg: "e.g., 70.5", height_cm: "e.g., 175", waist_circumference_cm: "e.g., 82",
  blood_pressure_systolic: "e.g., 120", blood_pressure_diastolic: "e.g., 80",
  fasting_blood_sugar: "e.g., 95", postprandial_sugar: "e.g., 140", hba1c: "e.g., 5.4",
  ldl_cholesterol: "e.g., 100", hdl_cholesterol: "e.g., 50", triglycerides: "e.g., 150",
  crp: "e.g., 1.2", esr: "e.g., 10", uric_acid: "e.g., 5.5",
  creatinine: "e.g., 0.9", urea: "e.g., 20", alt: "e.g., 25", ast: "e.g., 22",
  vitamin_d3: "e.g., 35", vitamin_b12: "e.g., 450", tsh: "e.g., 2.1",
};

const formatLabel = (field) =>
  field.replace(/_/g, " ")
    .replace(/\b(kg|cm|d3|b12)\b/gi, (m) => m.toUpperCase())
    .replace(/\b(alt|ast|tsh|crp|esr|hdl|ldl)\b/gi, (m) => m.toUpperCase())
    .replace(/\b\w/g, (c) => c.toUpperCase());

const SECTIONS = [
  { title: "Physical Measurements", fields: ["weight_kg", "height_cm", "waist_circumference_cm"] },
  { title: "Blood Pressure", fields: ["blood_pressure_systolic", "blood_pressure_diastolic"] },
  { title: "Blood Sugar", fields: ["fasting_blood_sugar", "postprandial_sugar", "hba1c"] },
  { title: "Lipid Panel", fields: ["ldl_cholesterol", "hdl_cholesterol", "triglycerides"] },
  { title: "Kidney & Liver", fields: ["creatinine", "urea", "uric_acid", "alt", "ast"] },
  { title: "Vitamins & Thyroid", fields: ["vitamin_d3", "vitamin_b12", "tsh"] },
  { title: "Inflammation Markers", fields: ["crp", "esr"] },
];

const CATEGORY_OPTIONS = ["Diabetes", "Thyroid", "Heart", "Kidney", "Liver", "Vitamins", "Other"];

const AddReport = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("auto");
  const [formData, setFormData] = useState(defaultForm);
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [additionalParams, setAdditionalParams] = useState([]);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(f.type)) {
      toast.error("Only PDF, JPG, PNG files are allowed.");
      e.target.value = "";
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB.");
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleExtract = () => {
    if (!file) { toast.error("Please select a file first."); return; }
    setExtracting(true);
    // Simulate extraction — replace with actual API call if available
    setTimeout(() => {
      setExtracting(false);
      toast.success("File uploaded. Please fill in values manually after review.");
    }, 1500);
  };

  const addParameter = () => {
    setAdditionalParams((prev) => [...prev, { name: "", value: "", unit: "", category: "Other" }]);
  };

  const removeParameter = (idx) => {
    setAdditionalParams((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateParameter = (idx, field, value) => {
    setAdditionalParams((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleClear = () => {
    setFormData(defaultForm);
    setFile(null);
    setAdditionalParams([]);
    setVerified(false);
    const fi = document.getElementById("report_file");
    if (fi) fi.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) { toast.error("Report date is required."); return; }
    if (!verified) { toast.error("Please verify that all information is correct."); return; }
    setLoading(true);
    try {
      const payload = new FormData();
      for (const key in formData) {
        if (formData[key] !== "" && formData[key] !== null) {
          payload.append(key === "date" ? "report_date" : key, formData[key]);
        }
      }
      if (file) payload.append("report_file", file);
      await createDiabeticProfile(payload);
      toast.success("Lab report added successfully!");
      navigate("/dashboard/lab-reports");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-app)] min-h-screen font-[var(--font-secondary)]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-[var(--font-primary)] text-[var(--color-text-strong)]">
            Add New Lab Report
          </h1>
          <p className="text-[var(--color-text-default)] mt-1">
            Upload a report or enter your health metrics manually
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[var(--color-border-default)] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("auto")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${activeTab === "auto"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
              }`}
          >
            📄 Auto-Extract from Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-[2px] ${activeTab === "manual"
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
              }`}
          >
            ✏️ Manual Entry
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Auto-Extract Tab */}
          {activeTab === "auto" && (
            <div className="bg-[var(--color-primary-subtle,#fff3ee)] border border-[var(--color-primary-subtle)] rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-[var(--color-text-strong)]">
                Upload Lab Report (PDF/Image)
              </p>
              <div className="flex items-center gap-3">
                <input
                  id="report_file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="report_file"
                  className="flex-1 flex items-center justify-between bg-white border border-[var(--color-border-default)] rounded-lg px-4 py-2.5 cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                >
                  <span className="text-sm text-[var(--color-text-muted)] truncate">
                    {file ? file.name : "Choose File   No file chosen"}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFile(null); const fi = document.getElementById("report_file"); if (fi) fi.value = ""; }}
                      className="ml-2 p-1 rounded-full text-[var(--color-danger-text)] hover:bg-red-50 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={extracting || !file}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {extracting ? <Loader size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  Extract & Auto-Fill
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Supported formats: PDF, JPG, PNG. Max size: 10MB
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                💡 Tip: The review table will show extracted values for you to confirm.
              </div>
            </div>
          )}

          {/* Report Date */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-strong)] mb-2">
              Report Date <span className="text-[var(--color-danger-text)]">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              max={new Intl.DateTimeFormat("en-CA").format(new Date())}
              onChange={handleChange}
              required
              className="w-full max-w-xs bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Sectioned fields */}
          {SECTIONS.map(({ title, fields }) => (
            <div key={title}>
              <h2 className="text-base font-semibold text-[var(--color-text-strong)] mb-3">{title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <div key={field}>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                      {formatLabel(field)}
                    </label>
                    <input
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      placeholder={FIELD_PLACEHOLDERS[field] || ""}
                      type="number"
                      step="any"
                      className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] px-3 py-2.5 rounded-lg text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Parameters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Additional Parameters</h2>
              <button
                type="button"
                onClick={addParameter}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] text-sm font-semibold rounded-lg transition-all"
              >
                <Plus size={14} /> Add Parameter
              </button>
            </div>
            {additionalParams.length > 0 && (
              <div className="space-y-3">
                {additionalParams.map((param, idx) => (
                  <div key={idx} className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <input
                        value={param.name}
                        onChange={(e) => updateParameter(idx, "name", e.target.value)}
                        placeholder="Parameter name"
                        className="bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      <input
                        value={param.value}
                        onChange={(e) => updateParameter(idx, "value", e.target.value)}
                        placeholder="Value"
                        className="bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      <input
                        value={param.unit}
                        onChange={(e) => updateParameter(idx, "unit", e.target.value)}
                        placeholder="Unit"
                        className="bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      />
                      <select
                        value={param.category}
                        onChange={(e) => updateParameter(idx, "category", e.target.value)}
                        className="bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParameter(idx)}
                      className="mt-2 text-xs text-[var(--color-danger-text)] hover:underline font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Checkbox */}
          <div className={`border-2 rounded-xl p-4 transition-colors ${verified ? "border-[var(--color-success-text)] bg-[var(--color-success-bg-subtle)]" : "border-yellow-200 bg-yellow-50"}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--color-primary)] flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-strong)]">
                  ✓ I verify that all information is correct
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Please review all entered values before submitting.
                </p>
              </div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate("/dashboard/health-dashboard")}
              className="px-4 py-2.5 rounded-lg border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] text-sm font-semibold hover:bg-[var(--color-bg-interactive-subtle)] transition-all"
            >
              Edit Latest
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-lg border-2 border-[var(--color-danger-text)] text-[var(--color-danger-text)] text-sm font-semibold hover:bg-[var(--color-danger-bg-subtle)] transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-lg border-2 border-[var(--color-border-default)] text-[var(--color-text-default)] text-sm font-semibold hover:bg-[var(--color-bg-interactive-subtle)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !verified}
              className="ml-auto flex items-center gap-2 px-8 py-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] text-sm font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader size={16} className="animate-spin" /> Saving...</> : "Submit Report"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddReport;
