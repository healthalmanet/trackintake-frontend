import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getDiabeticProfile } from "../../../api/diabeticApi";
import axiosInstance from "../../../api/axiosInstance";
import { Loader, Eye, Trash2, Plus, FlaskConical } from "lucide-react";
import { toast } from "react-hot-toast";

const KEY_FIELDS = [
  { key: "fasting_blood_sugar", label: "Fasting Sugar", unit: "mg/dL" },
  { key: "hba1c", label: "HbA1c", unit: "%" },
  { key: "ldl_cholesterol", label: "LDL", unit: "mg/dL" },
  { key: "blood_pressure_systolic", label: "Blood Pressure", unit: "mmHg", diastolicKey: "blood_pressure_diastolic" },
  { key: "vitamin_d3", label: "Vitamin D3", unit: "ng/mL" },
  { key: "tsh", label: "TSH", unit: "mIU/L" },
];

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDiabeticProfile();
      const data = res?.results || res?.data?.results || [];
      setReports(data.sort((a, b) => new Date(b.report_date) - new Date(a.report_date)));
    } catch {
      toast.error("Failed to load lab reports.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await axiosInstance.delete(`/lab-reports/${id}/`);
      toast.success("Report deleted.");
      fetchReports();
    } catch {
      toast.error("Failed to delete report.");
    }
  };

  const countParams = (report) =>
    KEY_FIELDS.filter(({ key }) => report[key] != null && report[key] !== "").length +
    Object.keys(report).filter(
      (k) => !["id", "report_date", "report_file", "lab_name"].includes(k) && report[k] != null && report[k] !== ""
    ).length - KEY_FIELDS.filter(({ key }) => report[key] != null).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--color-bg-app)]">
        <Loader className="w-12 h-12 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-app)] min-h-screen">
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-[var(--font-secondary)]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-[var(--font-primary)] text-[var(--color-text-strong)]">
              My Lab Reports
            </h1>
            <p className="text-[var(--color-text-default)] mt-1">
              Total Reports:{" "}
              <span className="font-semibold text-[var(--color-primary)]">{reports.length}</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/add-report")}
            className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] font-semibold px-4 py-2 rounded-lg transition-all shadow-md"
          >
            <Plus size={16} /> Add Report
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-[var(--color-border-default)] rounded-2xl bg-[var(--color-bg-surface)]">
            <FlaskConical className="w-16 h-16 mx-auto text-[var(--color-primary)] opacity-30 mb-4" />
            <p className="text-xl font-semibold text-[var(--color-text-strong)]">No lab reports yet.</p>
            <p className="text-[var(--color-text-default)] mt-1 mb-6">Add your first report to start tracking.</p>
            <button
              onClick={() => navigate("/dashboard/add-report")}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] font-semibold px-6 py-2 rounded-lg transition-all"
            >
              + Add Report
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const date = new Date(report.report_date).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              });
              const totalParams = Object.keys(report).filter(
                (k) => !["id", "report_date", "report_file", "lab_name"].includes(k) &&
                  report[k] != null && report[k] !== ""
              ).length;

              return (
                <div
                  key={report.id}
                  className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl p-5 shadow-md hover:shadow-lg hover:border-[var(--color-primary)] transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧪</span>
                      <h3 className="font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] text-lg">
                        Lab Report - {date}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.report_file && (
                        <a
                          href={report.report_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--color-info-text)] hover:bg-[var(--color-info-bg-subtle)] rounded-full transition-colors"
                          title="View Report File"
                        >
                          <Eye size={18} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg-subtle)] rounded-full transition-colors"
                        title="Delete Report"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                    {KEY_FIELDS.filter(({ key }) => report[key] != null && report[key] !== "").map(({ key, label, unit, diastolicKey }) => (
                      <div key={key}>
                        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                        <p className="font-semibold text-[var(--color-text-strong)] text-sm">
                          {diastolicKey
                            ? `${report[key]}/${report[diastolicKey]} ${unit}`
                            : `${report[key]} ${unit}`}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--color-border-default)]">
                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                      📊 {totalParams} parameters measured
                    </span>
                    {report.lab_name && (
                      <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                        🏥 Lab: {report.lab_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LabReports;
