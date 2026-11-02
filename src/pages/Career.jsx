import '../index.css';
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  UserPlus,
  ArrowRight,
  HelpCircle,
  Briefcase,
  Sparkles,
  MapPin,
  ChevronRight,
  Globe,
  HeartHandshake,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import Navbar from '../components/components/Navbar';
import Footer from '../components/components/Footer';
import { useAuth } from '../components/context/AuthContext';

/* ── JOB DATA ───────────────────────────────────────────── */
const JOBS = [
  {
    id: 1,
    summary:"Join our team as a Nutritionist & Dietitian Intern and gain hands-on experience in client nutrition assessments and personalized diet planning. Collaborate with senior dietitians, track client progress, and contribute to real cases while pursuing your nutrition degree.",
    title: "🥗 Nutritionist & Dietitian ",
    responsibilities: [
      "Assist in client nutrition assessments and consultations",
      "Prepare personalized diet plans based on health goals",
      "Track client progress and provide feedback",
      "Work with senior dietitians on live cases",
      "Maintain client records and reports",
    ],

    requirements: [
      { icon: "🎓", label: "Nutrition Degree (Pursuing/Completed)" },
      { icon: "📖", label: "Basic Diet Planning Knowledge" },
      { icon: "🗣️", label: "Communication Skills" },
      { icon: "❤️", label: "Passion for Health" },
    ],

    workTypes: [
      { key: "full", label: "Full-Time" },
      { key: "part", label: "Part-Time" },
      { key: "freelance", label: "Freelancer" },
    ],

    experienceLevels: [
      { key: "fresher", label: "Fresher (0-1 Year)"  },
      { key: "1to3", label: "Junior (1–3 Years) " },
      { key: "3plus", label: "Senior (3+ Years)" },
    ],

    location: [
   
    
      { label: "Location", value: "Remote" },

    ],

    applyLink: "https://docs.google.com/forms/d/e/1FAIpQLSfOAV47RQbEkCYt-1ukO3gQFHJFDN9xFwcOvdDbwhS_qo9chQ/viewform",
   
  },

  {
    id: 2,
    summary:"We are seeking a skilled Full Stack Python Developer to join our team. In this role, you will develop backend services using Django and Python, build RESTful APIs, and create a responsive UI with React and Tailwind CSS. You will also manage our PostgreSQL database and ensure seamless integration between frontend and backend components.",
    title: "💻 Full Stack Developer ",
    responsibilities: [
      "Develop backend services using Django and Python",
      "Build RESTful APIs and integrate with frontend",
      "Develop UI using React and Tailwind CSS",
      "Manage PostgreSQL database and queries",
      "Ensure smooth frontend-backend integration",
      "Debug and optimize application performance",
    ],

    requirements: [
      { icon: "🐍", label: "Python (Django)" },
      { icon: "⚛️", label: "React.js" },
      { icon: "🎨", label: "Tailwind CSS" },
      { icon: "🗄️", label: "PostgreSQL" },
      { icon: "🔗", label: "REST APIs" },
      { icon: "🧠", label: "Problem Solving" },
      { icon: "🗣️", label: "Communication" },
    ],

    workTypes: [
      { key: "full", label: "Full-Time" },
      { key: "part", label: "Part-Time" },
      { key: "freelance", label: "Freelancer" },
    ],

    experienceLevels: [
      { key: "fresher", label: "Fresher (0-1 Year)"  },
      { key: "1to3", label: "Junior (1–3 Years) " },
      { key: "3plus", label: "Senior (3+ Years)" },
    ],

    location: [

      { label: "Location", value: "Remote" },
      
    ],

    applyLink: "https://docs.google.com/forms/d/e/1FAIpQLSfOAV47RQbEkCYt-1ukO3gQFHJFDN9xFwcOvdDbwhS_qo9chQ/viewform",
    
  },
  
  {
  id: 3,
  title: "📈 Sales & Marketing Executive",
  
  summary:
    "We are looking for a dynamic and result-oriented Sales & Marketing Executive to drive user acquisition, onboard nutritionists, and promote the TrackIntake platform across B2B and B2C channels.",

  responsibilities: [
    "Onboard nutritionists, dieticians, and healthcare professionals",
    "Generate leads via cold calling, LinkedIn outreach, and networking",
    "Conduct product demos and explain platform benefits",
    "Convert leads into active users/clients",
    "Execute digital marketing campaigns (social media, email, WhatsApp)",
    "Promote platform through online and offline channels",
    "Create awareness in colleges, clinics, and communities",
    "Coordinate webinars, workshops, and demo sessions",
    "Maintain sales pipeline and track conversions",
    "Follow up with prospects and close deals",
    "Analyze market trends and competitors",
    "Manage client relationships and ensure engagement",
    "Drive subscription sales and revenue growth",
  ],

  requirements: [
    { icon: "🗣️", label: "Communication Skills" },
    { icon: "📊", label: "Sales & Negotiation" },
    { icon: "📢", label: "Digital Marketing Basics" },
    { icon: "🎯", label: "Target-Oriented Mindset" },
    { icon: "🤝", label: "Relationship Management" },
    { icon: "🧠", label: "Strategic Thinking" },
    { icon: "💪", label: "Self-Driven & Independent" },
  ],

  workTypes: [
    { key: "full", label: "Full-Time" },
    { key: "part", label: "Part-Time" },
    { key: "freelance", label: "Freelancer" },
  ],

  experienceLevels: [
    { key: "fresher", label: "Fresher (0–1 Year)" },
    { key: "1to3", label: "Junior (1–3 Years)" },
    { key: "3plus", label: "Senior (3+ Years)" },
  ],

  location: [
    { label: "Location", value: "Remote" },
  ],

  applyLink: "https://docs.google.com/forms/d/e/1FAIpQLSfOAV47RQbEkCYt-1ukO3gQFHJFDN9xFwcOvdDbwhS_qo9chQ/viewform",
}
];

/* ── JOB ITEM ───────────────────────────────── */
function JobItem({ job, isOpen, onToggle, onApply }) {
  return (
    <div
      className="rounded-2xl transition-all"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: isOpen
          ? '1.5px solid var(--color-primary)'
          : '1px solid var(--color-border-default)',
        boxShadow: isOpen
          ? '0 8px 30px rgba(255,112,67,0.15)'
          : '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top */}
      <div className="p-4 pb-3 flex flex-col md:flex-row md:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-strong)' }}>
            {job.title}
          </h3>

          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {job.summary} 
          </p>

        

          
        </div>

        <div className="flex items-center gap-3">
        

          <button
            onClick={onToggle}
            className="text-xs font-bold px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
            }}
          >
            {isOpen ? "Hide location" : "View Details"}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {isOpen && (
        <div
          className="px-4 pb-4 pt-2 animate-fade-in-up"
          style={{ borderTop: '1px solid var(--color-border-default)' }}
        >
          {/* Responsibilities */}
          <div className="mb-3">
            <p className="text-xs font-bold mb-1">What You’ll Do</p>
            <ul className="text-xs space-y-1">
              {job.responsibilities.map((r) => (
                <li key={r} className="flex gap-2">
                  <span style={{ color: 'var(--color-primary)' }}>✔</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="my-3 border-t" style={{ borderColor: 'var(--color-border-default)' }} />

          {/* Requirements */}
          <div className="mb-3">
            <p className="text-xs font-bold mb-1">What We’re Looking For</p>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((r) => (
                <span
                  key={r.label}
                  className="text-[10px] px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(255,112,67,0.08)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  {r.icon} {r.label}
                </span>
              ))}
            </div>
          </div>

          {/* Work Type */}
          <div className="mb-3">
            <p className="text-xs font-bold mb-1">Work Type</p>
            <div className="flex flex-wrap gap-2">
              {job.workTypes?.map((w) => (
                <span
                  key={w.key}
                  className="text-[10px] px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--color-bg-surface-alt)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  {w.label}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="mb-3">
            <p className="text-xs font-bold mb-1">Experience Level</p>
            <div className="flex flex-wrap gap-2">
             <ul className="pl-4">
  {job.experienceLevels?.map((e) => (
    <li key={e.key} className="mb-1">
      <span
        className="text-[10px] px-2 py-1 rounded inline-block"
        style={{
          backgroundColor: 'rgba(255,112,67,0.08)',
          border: '1px solid var(--color-border-default)',
        }}
      >
       <span style={{ color: 'var(--color-primary)' }}>✔</span> {e.label}
      </span>
    </li>
  ))}
</ul>
            </div>
          </div>

          <div className="my-3 border-t" style={{ borderColor: 'var(--color-border-default)' }} />

          {/* location */}
          <div className="mb-3">
            <p className="text-xs font-bold mb-2">Location</p>
            <div className="grid grid-cols-2 gap-3">
              {job.location.map((d) => (
                <div
                  key={d.label}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-surface-alt)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
             
                  <p className="text-xs font-bold">{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Apply */}
          <button
            type="button"
            onClick={() => onApply(job)}
            className="w-full mt-3 text-sm font-bold py-2.5 rounded-lg text-center block transition-all hover:opacity-90 active:scale-[0.99] cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
            }}
          >
            Apply Now →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ───────────────────────────────── */
export default function Career() {
  const [openId, setOpenId] = useState(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // App.jsx renders Navbar & Footer if isAuthenticated && user?.role === "user"
  const hasGlobalNav = isAuthenticated && user?.role === "user";

  const publicNavLinks = [
    { label: "Home", to: "/" },
    { label: "Career", to: "/career" },
    { label: "Blogs", to: "/blogs" },
    { label: "Contact", to: "/contact" },
  ];

  const handleApplyClick = (job) => {
    setSelectedJobForApply(job);
  };

  const handleConfirmRegistered = () => {
    if (selectedJobForApply?.applyLink) {
      window.open(selectedJobForApply.applyLink, "_blank", "noopener,noreferrer");
    }
    setSelectedJobForApply(null);
  };

  const handleGoToRegister = () => {
    const isNutritionist =
      selectedJobForApply?.id === 1 ||
      selectedJobForApply?.title?.toLowerCase().includes("nutritionist");
    const targetUrl = isNutritionist ? "/register?role=nutritionist" : "/register?role=user";
    setSelectedJobForApply(null);
    navigate(targetUrl);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between" style={{ backgroundColor: 'var(--color-bg-app)' }}>
      {/* ── Top Navigation Bar (for visitors and non-user roles) ── */}
      {!hasGlobalNav && (
        <Navbar
          links={publicNavLinks}
          align="right"
          rightContent={
            user ? (
              <Link
                to={user.role === "nutritionist" ? "/nutritionist" : "/dashboard"}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-md transition-all hover:scale-105"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] px-4 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full shadow-md transition-all duration-300 hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )
          }
        />
      )}

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-[1020px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 font-[var(--font-secondary)]">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">
            Home
          </Link>
          <ChevronRight size={13} />
          <span className="text-[var(--color-text-strong)] font-semibold">
            Careers
          </span>
        </nav>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-xl border border-orange-500/20 text-white"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff8a50 50%, #f4511e 100%)',
          }}
        >
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider mb-4 border border-white/25">
              <Sparkles size={13} />
              <span>Careers at TrackIntake</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold font-[var(--font-primary)] tracking-tight leading-tight mb-3">
              Shape the Future of Personalized Health & Nutrition
            </h1>

            <p className="text-xs sm:text-base text-white/90 leading-relaxed font-normal mb-6">
              Help us empower certified dietitians and everyday health seekers through cutting-edge dietary analytics, meal management, and seamless clinical care.
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-white/20 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-amber-200" />
                <span>100% Remote-First</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake size={16} className="text-amber-200" />
                <span>Health & Clinical Mission</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-amber-200" />
                <span>High-Growth Ecosystem</span>
              </div>
            </div>
          </div>

          {/* Decorative glowing gradient ring */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        </motion.div>

        {/* Why Work With Us Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-2xl border transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
              <Globe size={20} />
            </div>
            <h4 className="text-sm font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] mb-1">
              Flexible Remote Work
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Work from wherever you're most productive with asynchronous communication and clear ownership.
            </p>
          </div>

          <div
            className="p-5 rounded-2xl border transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <Sparkles size={20} />
            </div>
            <h4 className="text-sm font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] mb-1">
              Direct Health Impact
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Touch thousands of lives helping patients balance blood sugar, maintain hydration, and achieve wellness.
            </p>
          </div>

          <div
            className="p-5 rounded-2xl border transition-all hover:shadow-md"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] mb-1">
              Mentorship & Growth
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Collaborate directly with senior dietitians and full-stack engineers in a fast-paced environment.
            </p>
          </div>
        </section>

        {/* Section Title */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2.5">
              <Briefcase size={22} className="text-[var(--color-primary)]" />
              <span>Available Opportunities</span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
              Click on any role to view detailed responsibilities, experience levels, and qualifications.
            </p>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-[var(--color-primary)] border border-orange-500/20">
            {JOBS.length} Openings
          </span>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {JOBS.map((job) => (
            <JobItem
              key={job.id}
              job={job}
              isOpen={openId === job.id}
              onToggle={() =>
                setOpenId(prev => (prev === job.id ? null : job.id))
              }
              onApply={handleApplyClick}
            />
          ))}
        </div>

      </main>

      {/* ── Footer ── */}
      {!hasGlobalNav && <Footer />}

      {/* ── Registration Check Modal ── */}
      <AnimatePresence>
        {selectedJobForApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJobForApply(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl z-10 border border-[var(--color-border-default)] overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-strong)',
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedJobForApply(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-surface-alt)] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>

              {/* Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[var(--color-primary)] flex items-center justify-center mb-4 border border-orange-500/20">
                <HelpCircle size={26} />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold font-[var(--font-primary)] mb-2 text-[var(--color-text-strong)]">
                Have you registered on the website?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-default)] leading-relaxed mb-4">
                Please register on TrackIntake first before applying for{" "}
                <span className="font-semibold text-[var(--color-primary)]">
                  {selectedJobForApply.title.trim()}
                </span>.
              </p>

              {/* Role Requirement Callout */}
              <div
                className="p-3.5 rounded-xl mb-5 text-xs border leading-relaxed"
                style={{
                  backgroundColor: 'var(--color-bg-surface-alt)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {selectedJobForApply.id === 1 || selectedJobForApply.title.toLowerCase().includes("nutritionist") ? (
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none">🥗</span>
                    <div>
                      <strong className="text-[var(--color-text-strong)]">Practitioner Requirement:</strong> Candidates applying for Nutritionist & Dietitian positions must register through our <strong>Nutritionist Portal</strong>.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none">💼</span>
                    <div>
                      <strong className="text-[var(--color-text-strong)]">Candidate Screening:</strong> A registered TrackIntake account is required for candidate identity verification and application processing.
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {/* Option: Yes, I am registered */}
                <button
                  type="button"
                  onClick={handleConfirmRegistered}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} />
                    <span>Yes, I am registered</span>
                  </div>
                  <ArrowRight size={16} />
                </button>

                {/* Option: No, register first */}
                <button
                  type="button"
                  onClick={handleGoToRegister}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between border-2 transition-all duration-200 cursor-pointer hover:bg-[var(--color-bg-surface-alt)]"
                  style={{
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus size={18} />
                    <span>
                      {selectedJobForApply.id === 1 || selectedJobForApply.title.toLowerCase().includes("nutritionist")
                        ? "No, open Nutritionist Register"
                        : "No, open Register Portal"}
                    </span>
                  </div>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Bottom Login Link */}
              <div className="mt-4 pt-3 text-center border-t border-[var(--color-border-default)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Already registered but not signed in?{" "}
                  <Link
                    to="/login"
                    onClick={() => setSelectedJobForApply(null)}
                    className="font-bold underline text-[var(--color-primary)] hover:opacity-80"
                  >
                    Log in here
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}