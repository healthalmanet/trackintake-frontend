import React, { useState, useEffect, useCallback } from "react";
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
import { FaHeartbeat, FaTint, FaShieldAlt ,FaFileMedicalAlt} from "react-icons/fa";
import { Loader } from "lucide-react";
import AddInfoButton from "./AddInfoButton";
import AddDiabeticInfoModal from "./AddDiabeticInfoModal";
import { getDiabeticProfile } from "../../../api/diabeticApi";

// Helper Functions
const getRemarkText = (key, value, diastolic = null) => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  switch (key) {
    case "hba1c":
      if (value < 5.7) return "Normal";
      if (value <= 6.4) return "Prediabetes";
      return "High Risk";
    case "fasting_blood_sugar":
      if (value < 100) return "Normal";
      if (value <= 125) return "Prediabetes";
      return "High";
    case "blood_pressure":
      if (!diastolic && diastolic !== 0) return "N/A";
      if (value < 120 && diastolic < 80) return "Normal";
      if (value <= 129 && diastolic < 80) return "Elevated";
      return "Hypertension";
    case "ldl_cholesterol":
      if (value < 100) return "Optimal";
      if (value <= 159) return "Borderline High";
      return "High";
    case "triglycerides":
      if (value < 150) return "Normal";
      if (value <= 199) return "Borderline High";
      return "High";
    case "tsh":
      if (value >= 0.4 && value <= 4.0) return "Normal";
      if (value < 0.4) return "Low (Hyperthyroid)";
      return "High (Hypothyroid)";
    default:
      return "";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr || isNaN(new Date(dateStr).getTime())) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Theme Values (consistent with index.css for programmatic use in charts)
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
// Corrected fallbacks to match index.css
const METRIC_CARD_CLASSES = [
  "bg-[var(--color-success-bg-subtle,rgba(220,252,231,0.6))]",
  "bg-[var(--color-info-bg-subtle,rgba(224,242,254,0.6))]",
  "bg-[var(--color-warning-bg-subtle,rgba(255,237,213,0.6))]",
];

const EmptyDashboardState = ({ onAddReport }) => (
  <div
    className="flex flex-col items-center justify-center text-center p-10 mt-8 border-2 border-dashed border-[var(--color-border-default,#ECEFF1)] rounded-2xl bg-[var(--color-bg-surface,#FFFFFF)] shadow-lg opacity-0 animate-fade-up"
    style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
    role="region"
    aria-label="No health reports found"
  >
    <FaFileMedicalAlt className="w-20 h-20 text-[var(--color-primary)] opacity-30 mb-6" />
    <h2 className="text-2xl font-bold font-[var(--font-primary)] text-[var(--color-text-strong,#263238)] mb-3">
      Your Dashboard is Ready!
    </h2>
    <p className="max-w-xl text-lg text-[var(--color-text-default,#546E7A)] mb-8 leading-relaxed">
      It looks like you haven't added any health reports yet. Add your first
      one to start tracking key metrics, see historical trends, and take
      control of your health journey.
    </p>
    <AddInfoButton onClick={onAddReport} />
  </div>
);

EmptyDashboardState.propTypes = {
  onAddReport: PropTypes.func.isRequired,
};

// UI Sub-Components
const KeyMetricsOverview = ({ latestReport, activeView }) => {
  if (!latestReport) return null;
  const metricCategories = {
    diabetes: [
      { key: "fasting_blood_sugar", label: "Fasting Sugar", unit: "mg/dL", icon: <FaTint /> },
      { key: "postprandial_sugar", label: "Post-Meal Sugar", unit: "mg/dL", icon: <FaTint /> },
      { key: "hba1c", label: "HbA1c", unit: "%", icon: <FaTint /> },
    ],
    thyroid: [{ key: "tsh", label: "TSH", unit: "mU/L", icon: <FaShieldAlt /> }],
    heart: [
      { key: "ldl_cholesterol", label: "LDL", unit: "mg/dL", icon: <FaHeartbeat /> },
      { key: "hdl_cholesterol", label: "HDL", unit: "mg/dL", icon: <FaHeartbeat /> },
      { key: "triglycerides", label: "Triglycerides", unit: "mg/dL", icon: <FaHeartbeat /> },
    ],
    hypertension: [{ key: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: <FaHeartbeat /> }],
  };
  const metrics = metricCategories[activeView] || [];
  return (
    <div
      className="mb-10 opacity-0 animate-fade-up"
      style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
    >
      <h2 className="text-xl font-[var(--font-primary)] font-bold text-[var(--color-text-strong,#263238)] mb-4">
        Latest Snapshot
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const value =
            metric.key === "blood_pressure"
              ? `${latestReport.blood_pressure_systolic || "N/A"}/${
                  latestReport.blood_pressure_diastolic || "N/A"
                }`
              : latestReport[metric.key] || "N/A";
          const numericValue =
            metric.key === "blood_pressure" ? latestReport.blood_pressure_systolic : latestReport[metric.key];
          const remarkText = getRemarkText(
            metric.key,
            numericValue,
            latestReport.blood_pressure_diastolic
          );
          const cardColor = METRIC_CARD_CLASSES[index % METRIC_CARD_CLASSES.length];
          return (
            <div
              key={metric.key}
              className={`group p-5 rounded-2xl border-2 border-transparent shadow-md transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-2 hover:border-[var(--color-primary,#FF7043)] ${cardColor}`}
              role="region"
              aria-label={`${metric.label} metric`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[var(--color-text-strong,#263238)] font-[var(--font-primary)] font-semibold text-base">
                  {metric.label}
                </h3>
                <span className="text-2xl text-[var(--color-primary,#FF7043)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  {metric.icon}
                </span>
              </div>
              <p className="text-3xl font-bold text-[var(--color-text-strong,#263238)]">
                {value}{" "}
                <span className="text-base font-normal text-[var(--color-text-default,#546E7A)]">
                  {metric.unit}
                </span>
              </p>
              <p className="font-semibold mt-1 text-sm text-[var(--color-primary,#FF7043)]">
                {remarkText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

KeyMetricsOverview.propTypes = {
  latestReport: PropTypes.object,
  activeView: PropTypes.oneOf(["diabetes", "thyroid", "heart", "hypertension"]).isRequired,
};

const ChartContainer = ({ title, children, delay }) => (
  <div
    className="bg-[var(--color-bg-surface,#FFFFFF)] p-4 sm:p-6 rounded-2xl border-2 border-[var(--color-border-default,#ECEFF1)] shadow-lg h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-[var(--color-primary,#FF7043)] opacity-0 animate-fade-up"
    style={{ animationDelay: delay, animationFillMode: "forwards" }}
    role="region"
    aria-label={`${title} chart`}
  >
    <h3 className="text-lg font-[var(--font-primary)] font-semibold text-center mb-3 text-[var(--color-text-strong,#263238)]">
      {title}
    </h3>
    <div className="flex-grow">{children}</div>
  </div>
);

ChartContainer.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  delay: PropTypes.string.isRequired,
};

const HealthDashboard = () => {
  const [allReports, setAllReports] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("diabetes");
  const [modalOpen, setModalOpen] = useState(false);

 // In HealthDashboard component

const fetchReportData = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await getDiabeticProfile();
    // ✅ Updated to be more robust, checking for data nested in response.data or directly
    const reports = response?.data?.results || response?.results || [];

    if (reports.length > 0) {
      const sortedByNewest = reports.slice().sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
      setLatestReport(sortedByNewest[0]);
      const chronologicalReports = reports.slice().sort((a, b) => new Date(a.report_date) - new Date(b.report_date));
      setAllReports(chronologicalReports);
    } else {
      setLatestReport(null);
      setAllReports([]);
    }
  } catch (err) {
    setError(err.message || "Failed to load report data. Please try again.");
    setLatestReport(null);
    setAllReports([]);
  } finally {
    setIsLoading(false);
  }
}, []);


  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleModalSubmit = () => {
    setModalOpen(false);
    fetchReportData(); // Immediate refresh after submission
  };
  
   useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const Navigation = () => (
    <div
      className="flex flex-wrap items-center justify-between gap-4 mb-8 opacity-0 animate-fade-up"
      style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
    >
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {["Diabetes", "Thyroid", "Heart", "Hypertension"].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view.toLowerCase())}
            className={`font-[var(--font-primary)] font-semibold py-2 px-4 sm:px-5 rounded-lg shadow-sm transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#FF7043)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-app,#FFFDF9)] ${
              activeView === view.toLowerCase()
                ? "bg-[var(--color-primary,#FF7043)] text-[var(--color-text-on-primary,#FFFFFF)] shadow-lg"
                : "bg-[var(--color-bg-surface,#FFFFFF)] text-[var(--color-text-default,#546E7A)] hover:bg-[var(--color-bg-interactive-subtle,#f3f4f6)]"
            }`}
            aria-label={`View ${view} metrics`}
            aria-pressed={activeView === view.toLowerCase()}
          >
            {view}
          </button>
        ))}
      </div>
      <AddInfoButton onClick={() => setModalOpen(true)} />
    </div>
  );

  const renderDiabetesCharts = useCallback(() => {
    const chartData = allReports.map((r) => ({
      date: formatDate(r.report_date),
      HbA1c: r.hba1c,
    }));
    const latestSugarData = [
      { name: "Fasting", value: latestReport?.fasting_blood_sugar || 0 },
      { name: "Post-Meal", value: latestReport?.postprandial_sugar || 0 },
    ];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="HbA1c Trend" delay="500ms">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              aria-label="HbA1c trend over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis domain={[4, "dataMax + 1"]} fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip />
              <ReferenceLine
                y={6.5}
                label={{ value: "High Risk", fontSize: 12, fill: THEME_VALUES.dangerText }}
                stroke={THEME_VALUES.dangerText}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="HbA1c"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Latest Sugar Levels" delay="600ms">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={latestSugarData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              aria-label="Latest sugar levels"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="name" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip formatter={(value) => `${value} mg/dL`} />
              <ReferenceLine
                y={100}
                label={{ value: "Normal Fasting", fontSize: 12, position: "insideTopLeft", fill: THEME_VALUES.textDefault }}
                stroke={THEME_VALUES.borderDefault}
                strokeDasharray="3 3"
              />
              <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }, [allReports, latestReport]);

  const renderThyroidCharts = useCallback(() => {
    const chartData = allReports.map((r) => ({
      date: formatDate(r.report_date),
      TSH: r.tsh,
    }));
    const latestTshData = [{ name: "TSH", value: latestReport?.tsh || 0 }];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="TSH Trend" delay="500ms">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              aria-label="TSH trend over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis domain={[0, "dataMax + 1"]} fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip />
              <ReferenceLine
                y={4.0}
                label={{ value: "Upper Limit", fontSize: 12, fill: THEME_VALUES.textDefault, position: "insideTop" }}
                stroke={THEME_VALUES.borderDefault}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="TSH"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Latest TSH Reading" delay="600ms">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={latestTshData}
              margin={{ top: 25, right: 20, left: -10, bottom: 5 }}
              aria-label="Latest TSH reading"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="name" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip />
              <ReferenceLine y={0.4} stroke={THEME_VALUES.borderDefault} strokeDasharray="2 2" />
              <ReferenceLine
                y={4.0}
                label={{ value: "Normal Range", fill: THEME_VALUES.textDefault, position: "inside", angle: -90, dx: -55 }}
                stroke={THEME_VALUES.borderDefault}
                strokeDasharray="2 2"
              />
              <Bar dataKey="value" fill={CHART_COLORS[1]} barSize={60} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }, [allReports, latestReport]);

  const renderHeartCharts = useCallback(() => {
    const chartData = allReports.map((r) => ({
      date: formatDate(r.report_date),
      LDL: r.ldl_cholesterol,
      HDL: r.hdl_cholesterol,
      Triglycerides: r.triglycerides,
    }));
    const latestLipidData = [
      { name: "LDL", value: latestReport?.ldl_cholesterol || 0 },
      { name: "HDL", value: latestReport?.hdl_cholesterol || 0 },
      { name: "Triglycerides", value: latestReport?.triglycerides || 0 },
    ];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Lipid Panel Trend" delay="500ms">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              aria-label="Lipid panel trend over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Line
                type="monotone"
                dataKey="LDL"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="HDL"
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Triglycerides"
                stroke={CHART_COLORS[2]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Latest Lipid Composition" delay="600ms">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart aria-label="Latest lipid composition">
              <Pie
                data={latestLipidData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {latestLipidData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} mg/dL`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }, [allReports, latestReport]);

  const renderHypertensionCharts = useCallback(() => {
    const chartData = allReports.map((r) => ({
      date: formatDate(r.report_date),
      Systolic: r.blood_pressure_systolic,
      Diastolic: r.blood_pressure_diastolic,
    }));
    const latestBpData = [
      {
        name: "Latest",
        Systolic: latestReport?.blood_pressure_systolic || 0,
        Diastolic: latestReport?.blood_pressure_diastolic || 0,
      },
    ];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Blood Pressure Trend" delay="500ms">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              aria-label="Blood pressure trend over time"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="date" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} domain={[50, "dataMax + 10"]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <ReferenceLine
                y={120}
                label={{ value: "Elevated Systolic", fontSize: 12, fill: THEME_VALUES.dangerText }}
                stroke={THEME_VALUES.dangerText}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="Systolic"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Diastolic"
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Latest Blood Pressure" delay="600ms">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={latestBpData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              aria-label="Latest blood pressure reading"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
              <XAxis dataKey="name" fontSize={12} stroke={THEME_VALUES.textDefault} />
              <YAxis fontSize={12} stroke={THEME_VALUES.textDefault} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <ReferenceLine
                y={120}
                label={{ value: "Elevated", fill: THEME_VALUES.dangerText, fontSize: 12 }}
                stroke={THEME_VALUES.dangerText}
                strokeDasharray="3 3"
              />
              <ReferenceLine y={80} stroke={THEME_VALUES.borderDefault} strokeDasharray="3 3" />
              <Bar dataKey="Systolic" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Diastolic" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    );
  }, [allReports, latestReport]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[var(--color-bg-app,#FFFDF9)]">
        <Loader className="w-16 h-16 animate-spin text-[var(--color-primary,#FF7043)]" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="flex flex-col justify-center items-center h-screen bg-[var(--color-bg-app,#FFFDF9)] text-center p-4">
          <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            <p className="text-xl text-[var(--color-danger-text,#be123c)] font-[var(--font-primary)] mb-6">{error}</p>
            
            <AddInfoButton onClick={() => setModalOpen(true)} />
          </div>
        </div>
        <AddDiabeticInfoModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
          initialMode="create"
        />
      </>
    );
  }

  const viewToChartMap = {
    diabetes: renderDiabetesCharts,
    thyroid: renderThyroidCharts,
    heart: renderHeartCharts,
    hypertension: renderHypertensionCharts,
  };

  return (
    <>
      <div className="bg-[var(--color-bg-app,#FFFDF9)] min-h-screen">
        <main className="text-[var(--color-text-default,#546E7A)] p-4 sm:p-6 lg:p-8 font-[var(--font-secondary)] max-w-7xl mx-auto">
          <header className="mb-8 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            <h1 className="text-4xl font-[var(--font-primary)] font-bold text-[var(--color-text-strong,#263238)]">
              Health Dashboard
            </h1>
            <p className="text-[var(--color-text-default,#546E7A)] mt-2 text-lg">
              Your consolidated health report. Track your progress over time.
            </p>
          </header>
          
          {allReports.length === 0 ? (
            <EmptyDashboardState onAddReport={() => setModalOpen(true)} />
          ) : (
            <>
              <Navigation />
              <KeyMetricsOverview
                key={`${latestReport?.id}-${activeView}`}
                latestReport={latestReport}
                activeView={activeView}
              />
              <div
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
              >
                <h2 className="text-2xl font-[var(--font-primary)] font-bold text-[var(--color-text-strong,#263238)] mb-5 mt-10">
                  Historical Trends
                </h2>
                <div className="mt-4" key={activeView}>
                  {viewToChartMap[activeView]()}
                </div>
              </div>
              <div
                className="text-center mt-12 text-xs text-[var(--color-text-muted,#6b7281)] opacity-0 animate-fade-up"
                style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
              >
                Showing {allReports.length} report(s). Last updated on:{" "}
                {latestReport
                  ? new Date(latestReport.report_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </div>
            </>
          )}
        </main>
      </div>
      <AddDiabeticInfoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialMode="create"
      />
    </>
  );
};


export default HealthDashboard;