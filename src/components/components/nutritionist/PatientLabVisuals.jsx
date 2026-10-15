import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FaHeartbeat, FaTint, FaShieldAlt, FaFileMedicalAlt, FaChartLine } from "react-icons/fa";

// Helper Functions matching HealthDashboard.jsx
const getRemarkText = (key, value, diastolic = null) => {
  if (value === undefined || value === null || value === "" || isNaN(value)) return "N/A";
  const num = parseFloat(value);
  switch (key) {
    case "hba1c":
      if (num < 5.7) return "Normal";
      if (num <= 6.4) return "Prediabetes";
      return "High Risk";
    case "fasting_blood_sugar":
      if (num < 100) return "Normal";
      if (num <= 125) return "Prediabetes";
      return "High";
    case "postprandial_sugar":
      if (num < 140) return "Normal";
      if (num <= 199) return "Prediabetes";
      return "High";
    case "blood_pressure":
      if (!diastolic && diastolic !== 0) return "N/A";
      if (num < 120 && diastolic < 80) return "Normal";
      if (num <= 129 && diastolic < 80) return "Elevated";
      return "Hypertension";
    case "ldl_cholesterol":
      if (num < 100) return "Optimal";
      if (num <= 159) return "Borderline High";
      return "High";
    case "hdl_cholesterol":
      if (num >= 50) return "Optimal";
      if (num < 40) return "Low Risk";
      return "Normal";
    case "triglycerides":
      if (num < 150) return "Normal";
      if (num <= 199) return "Borderline High";
      return "High";
    case "tsh":
      if (num >= 0.4 && num <= 4.0) return "Normal";
      if (num < 0.4) return "Low (Hyperthyroid)";
      return "High (Hypothyroid)";
    case "vitamin_d3":
      if (num < 20) return "Deficient";
      if (num <= 29) return "Insufficient";
      return "Optimal";
    case "vitamin_b12":
      if (num < 200) return "Deficient";
      if (num <= 300) return "Borderline";
      return "Optimal";
    default:
      return "";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const THEME_VALUES = {
  primary: "#FF7043",
  primaryHover: "#F4511E",
  accent1: "#b45309", // Amber
  accent2: "#4338ca", // Indigo
  accent3: "#7e22ce", // Purple
  textStrong: "#263238",
  textDefault: "#546E7A",
  borderDefault: "#ECEFF1",
  dangerText: "#be123c",
};

const CHART_COLORS = [THEME_VALUES.primary, THEME_VALUES.accent2, THEME_VALUES.accent1, THEME_VALUES.accent3];

const METRIC_CARD_CLASSES = [
  "bg-[var(--color-success-bg-subtle,rgba(220,252,231,0.6))]",
  "bg-[var(--color-info-bg-subtle,rgba(224,242,254,0.6))]",
  "bg-[var(--color-warning-bg-subtle,rgba(255,237,213,0.6))]",
  "bg-[var(--color-accent-2-bg-subtle,rgba(224,231,255,0.6))]",
];

const ChartContainer = ({ title, children }) => (
  <div className="bg-[var(--color-bg-surface,#FFFFFF)] p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-border-default,#ECEFF1)] shadow-sm flex flex-col transition-all duration-300 hover:shadow-md hover:border-[var(--color-primary,#FF7043)]">
    <h3 className="text-base font-[var(--font-primary)] font-bold text-center mb-3 text-[var(--color-text-strong,#263238)]">
      {title}
    </h3>
    <div className="flex-grow w-full">{children}</div>
  </div>
);

ChartContainer.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const PatientLabVisuals = ({ reports = [] }) => {
  const [activeView, setActiveView] = useState("diabetes");

  // Normalize field names across serializer variations
  const normalizedReports = useMemo(() => {
    return (reports || []).map((r) => ({
      ...r,
      fasting_blood_sugar: r.fasting_blood_sugar ?? r.fasting_sugar,
      postprandial_sugar: r.postprandial_sugar ?? r.post_prandial_blood_sugar,
      hba1c: r.hba1c,
      blood_pressure_systolic: r.blood_pressure_systolic ?? r.systolic_bp,
      blood_pressure_diastolic: r.blood_pressure_diastolic ?? r.diastolic_bp,
      ldl_cholesterol: r.ldl_cholesterol ?? r.ldl,
      hdl_cholesterol: r.hdl_cholesterol ?? r.hdl,
      triglycerides: r.triglycerides,
      tsh: r.tsh,
      vitamin_d3: r.vitamin_d3,
      vitamin_b12: r.vitamin_b12,
    }));
  }, [reports]);

  // Chronological for trends
  const chronologicalReports = useMemo(() => {
    return [...normalizedReports].sort(
      (a, b) => new Date(a.report_date) - new Date(b.report_date)
    );
  }, [normalizedReports]);

  // Newest report for latest snapshot
  const latestReport = useMemo(() => {
    if (normalizedReports.length === 0) return null;
    return [...normalizedReports].sort(
      (a, b) => new Date(b.report_date) - new Date(a.report_date)
    )[0];
  }, [normalizedReports]);

  if (!reports || reports.length === 0) {
    return null;
  }

  const metricCategories = {
    diabetes: [
      { key: "fasting_blood_sugar", label: "Fasting Sugar", unit: "mg/dL", icon: <FaTint /> },
      { key: "postprandial_sugar", label: "Post-Meal Sugar", unit: "mg/dL", icon: <FaTint /> },
      { key: "hba1c", label: "HbA1c", unit: "%", icon: <FaTint /> },
    ],
    thyroid: [
      { key: "tsh", label: "TSH", unit: "µIU/mL", icon: <FaShieldAlt /> },
      { key: "vitamin_d3", label: "Vitamin D3", unit: "ng/mL", icon: <FaShieldAlt /> },
      { key: "vitamin_b12", label: "Vitamin B12", unit: "pg/mL", icon: <FaShieldAlt /> },
    ],
    heart: [
      { key: "ldl_cholesterol", label: "LDL Cholesterol", unit: "mg/dL", icon: <FaHeartbeat /> },
      { key: "hdl_cholesterol", label: "HDL Cholesterol", unit: "mg/dL", icon: <FaHeartbeat /> },
      { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", icon: <FaHeartbeat /> },
    ],
    hypertension: [
      { key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: <FaHeartbeat /> },
      { key: "fasting_blood_sugar", label: "Fasting Sugar", unit: "mg/dL", icon: <FaTint /> },
      { key: "hba1c", label: "HbA1c", unit: "%", icon: <FaTint /> },
    ],
  };

  const activeMetrics = metricCategories[activeView] || [];

  const renderDiabetesCharts = () => {
    const chartData = chronologicalReports.map((r) => ({
      date: formatDate(r.report_date),
      HbA1c: r.hba1c != null ? parseFloat(r.hba1c) : null,
      Fasting: r.fasting_blood_sugar != null ? parseFloat(r.fasting_blood_sugar) : null,
    }));

    const latestSugarData = [
      { name: "Fasting", value: latestReport?.fasting_blood_sugar ? parseFloat(latestReport.fasting_blood_sugar) : 0 },
      { name: "Post-Meal", value: latestReport?.postprandial_sugar ? parseFloat(latestReport.postprandial_sugar) : 0 },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="HbA1c Trend Over Time">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis domain={[4, "dataMax + 1"]} fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value) => [`${value}%`, "HbA1c"]} />
              <ReferenceLine
                y={6.5}
                label={{ value: "High Risk (6.5%)", fontSize: 11, fill: THEME_VALUES.dangerText, position: "insideTopLeft" }}
                stroke={THEME_VALUES.dangerText}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="HbA1c"
                stroke={CHART_COLORS[0]}
                strokeWidth={2.5}
                dot={{ r: 5, fill: CHART_COLORS[0] }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Latest Blood Sugar Levels">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={latestSugarData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="name" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value) => [`${value} mg/dL`, "Sugar Level"]} />
              <ReferenceLine
                y={100}
                label={{ value: "Normal Fasting (100)", fontSize: 11, position: "insideTopLeft", fill: THEME_VALUES.textDefault }}
                stroke={THEME_VALUES.borderDefault}
                strokeDasharray="3 3"
              />
              <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} barSize={55} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  };

  const renderThyroidCharts = () => {
    const chartData = chronologicalReports.map((r) => ({
      date: formatDate(r.report_date),
      TSH: r.tsh != null ? parseFloat(r.tsh) : null,
      VitD: r.vitamin_d3 != null ? parseFloat(r.vitamin_d3) : null,
    }));

    const latestTshData = [
      { name: "TSH", value: latestReport?.tsh ? parseFloat(latestReport.tsh) : 0 },
      { name: "Vit D3", value: latestReport?.vitamin_d3 ? parseFloat(latestReport.vitamin_d3) : 0 },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="TSH Trend (Thyroid Function)">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis domain={[0, "dataMax + 1"]} fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value, name) => [`${value}`, name]} />
              <ReferenceLine
                y={4.0}
                label={{ value: "Upper Limit (4.0)", fontSize: 11, fill: THEME_VALUES.dangerText, position: "insideTopLeft" }}
                stroke={THEME_VALUES.dangerText}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="TSH"
                stroke={CHART_COLORS[0]}
                strokeWidth={2.5}
                dot={{ r: 5, fill: CHART_COLORS[0] }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Latest Micronutrient & Hormone Snapshot">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={latestTshData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="name" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip />
              <ReferenceLine y={0.4} stroke={THEME_VALUES.borderDefault} strokeDasharray="2 2" />
              <ReferenceLine
                y={4.0}
                label={{ value: "Normal TSH Range (0.4-4.0)", fill: THEME_VALUES.textDefault, fontSize: 10, position: "insideTopLeft" }}
                stroke={THEME_VALUES.borderDefault}
                strokeDasharray="2 2"
              />
              <Bar dataKey="value" fill={CHART_COLORS[2]} barSize={55} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  };

  const renderHeartCharts = () => {
    const chartData = chronologicalReports.map((r) => ({
      date: formatDate(r.report_date),
      LDL: r.ldl_cholesterol != null ? parseFloat(r.ldl_cholesterol) : null,
      HDL: r.hdl_cholesterol != null ? parseFloat(r.hdl_cholesterol) : null,
      Triglycerides: r.triglycerides != null ? parseFloat(r.triglycerides) : null,
    }));

    const latestLipidData = [
      { name: "LDL", value: latestReport?.ldl_cholesterol ? parseFloat(latestReport.ldl_cholesterol) : 0 },
      { name: "HDL", value: latestReport?.hdl_cholesterol ? parseFloat(latestReport.hdl_cholesterol) : 0 },
      { name: "Triglycerides", value: latestReport?.triglycerides ? parseFloat(latestReport.triglycerides) : 0 },
    ].filter((item) => item.value > 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Lipid Panel Trend (mg/dL)">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value) => `${value} mg/dL`} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="LDL" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="HDL" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Triglycerides" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Latest Lipid Breakdown">
          <ResponsiveContainer width="100%" height={230}>
            {latestLipidData.length > 0 ? (
              <PieChart>
                <Pie
                  data={latestLipidData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {latestLipidData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} mg/dL`} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[var(--color-text-muted)]">
                No lipid parameters recorded in latest report
              </div>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  };

  const renderHypertensionCharts = () => {
    const chartData = chronologicalReports.map((r) => ({
      date: formatDate(r.report_date),
      Systolic: r.blood_pressure_systolic != null ? parseFloat(r.blood_pressure_systolic) : null,
      Diastolic: r.blood_pressure_diastolic != null ? parseFloat(r.blood_pressure_diastolic) : null,
    }));

    const latestBpData = [
      {
        name: "Blood Pressure",
        Systolic: latestReport?.blood_pressure_systolic ? parseFloat(latestReport.blood_pressure_systolic) : 0,
        Diastolic: latestReport?.blood_pressure_diastolic ? parseFloat(latestReport.blood_pressure_diastolic) : 0,
      },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Blood Pressure Trend (mmHg)">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis domain={[50, "dataMax + 10"]} fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value) => `${value} mmHg`} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <ReferenceLine
                y={120}
                label={{ value: "Elevated (120)", fontSize: 11, fill: THEME_VALUES.dangerText }}
                stroke={THEME_VALUES.dangerText}
                strokeDasharray="3 3"
              />
              <Line type="monotone" dataKey="Systolic" stroke={CHART_COLORS[0]} strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Diastolic" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Latest Blood Pressure Reading">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={latestBpData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="name" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value) => `${value} mmHg`} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <ReferenceLine y={120} stroke={THEME_VALUES.dangerText} strokeDasharray="3 3" />
              <ReferenceLine y={80} stroke={THEME_VALUES.borderDefault} strokeDasharray="3 3" />
              <Bar dataKey="Systolic" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} barSize={40} />
              <Bar dataKey="Diastolic" fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  };

  const chartViews = {
    diabetes: renderDiabetesCharts,
    thyroid: renderThyroidCharts,
    heart: renderHeartCharts,
    hypertension: renderHypertensionCharts,
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Visual Analytics Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-[var(--color-border-default)]">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)]">
            <FaChartLine size={18} />
          </span>
          <div>
            <h3 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)]">
              Clinical Biomarker Analytics
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Interactive diagnostic visualization and metabolic trendlines across {reports.length} report(s).
            </p>
          </div>
        </div>

        {/* Category switcher pills */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["Diabetes", "Thyroid", "Heart", "Hypertension"].map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view.toLowerCase())}
              className={`font-[var(--font-primary)] text-xs font-bold py-2 px-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
                activeView === view.toLowerCase()
                  ? "bg-[var(--color-primary)] text-white shadow-md scale-105"
                  : "bg-[var(--color-bg-surface)] text-[var(--color-text-default)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Latest Snapshot Cards (matching HealthDashboard) */}
      <div>
        <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Latest Biomarker Snapshot ({formatDate(latestReport?.report_date)})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeMetrics.map((metric, index) => {
            let value = "N/A";
            let remark = "N/A";

            if (metric.key === "blood_pressure") {
              const sys = latestReport?.blood_pressure_systolic;
              const dia = latestReport?.blood_pressure_diastolic;
              if (sys || dia) {
                value = `${sys || "N/A"}/${dia || "N/A"}`;
                remark = getRemarkText("blood_pressure", sys, dia);
              }
            } else {
              const rawVal = latestReport?.[metric.key];
              if (rawVal != null && rawVal !== "") {
                value = rawVal;
                remark = getRemarkText(metric.key, rawVal);
              }
            }

            const cardColor = METRIC_CARD_CLASSES[index % METRIC_CARD_CLASSES.length];

            return (
              <div
                key={metric.key}
                className={`p-4 sm:p-5 rounded-2xl border-2 border-transparent shadow-sm transition-all duration-300 hover:shadow-md hover:border-[var(--color-primary)] ${cardColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[var(--color-text-strong)] font-[var(--font-primary)] font-semibold text-sm">
                    {metric.label}
                  </h5>
                  <span className="text-xl text-[var(--color-primary)]">{metric.icon}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  {value}{" "}
                  <span className="text-xs sm:text-sm font-normal text-[var(--color-text-default)]">
                    {value !== "N/A" ? metric.unit : ""}
                  </span>
                </p>
                <p className="font-bold mt-1 text-xs text-[var(--color-primary)]">
                  {remark}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Trends Visual Charts */}
      <div>
        <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
          Historical Diagnostic Trendlines
        </h4>
        <div key={activeView} className="transition-all duration-300">
          {chartViews[activeView] ? chartViews[activeView]() : null}
        </div>
      </div>
    </div>
  );
};

PatientLabVisuals.propTypes = {
  reports: PropTypes.array.isRequired,
};

export default PatientLabVisuals;
