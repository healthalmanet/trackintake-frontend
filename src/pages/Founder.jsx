import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Globe,
  Quote,
  Sparkles,
  ArrowLeft,
  Briefcase,
  Cpu,
  Layers,
  Building2,
  Users2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Navbar from '../components/components/Navbar';
import Footer from '../components/components/Footer';
import { useAuth } from '../components/context/AuthContext';
import founderImg from '../assets/founder_yeshwant_maheshram.jpg';
import logo from '../assets/logo.png';

const Founder = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // App.jsx automatically renders patient Navbar and Footer when isAuthenticated && user?.role === "user"
  const hasGlobalNav = isAuthenticated && user?.role === "user";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const publicNavLinks = [
    { label: "Home", to: "/" },
    { label: "Career", to: "/career" },
    { label: "Blogs", to: "/blogs" },
    { label: "Contact", to: "/contact" },
  ];

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else if (isAuthenticated) {
      const role = user?.role?.toLowerCase();
      if (role === 'nutritionist') navigate('/nutritionist');
      else if (role === 'owner') navigate('/owner');
      else navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-bg-app)] font-[var(--font-secondary)] text-[var(--color-text-default)]">
      {/* ── Top Navigation Bar (for unauthenticated or non-patient roles) ── */}
      {!hasGlobalNav && (
        <Navbar
          links={publicNavLinks}
          align="right"
          rightContent={
            isAuthenticated ? (
              <button
                onClick={handleBack}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] text-sm font-semibold px-4 py-2 rounded-full shadow-md transition-all duration-300 hover:scale-105"
              >
                Back to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/register"
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] text-sm font-semibold px-4 py-2 rounded-full shadow-md transition-all duration-300 hover:scale-105"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] px-4 py-2 text-sm rounded-full font-semibold transition duration-300"
                >
                  Login
                </Link>
              </div>
            )
          }
        />
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-[var(--color-primary-bg-subtle)] via-transparent to-[var(--color-accent-2-bg-subtle)] opacity-40 blur-3xl pointer-events-none" />

        {/* Breadcrumb / Back button */}
        <div className="relative z-10 mb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors duration-200 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Link to="/" className="hover:text-[var(--color-primary)]">TrackIntake</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--color-text-strong)] font-semibold">Founder Profile</span>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary-bg-subtle)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            Leadership & Vision
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-text-strong)] tracking-tight font-[var(--font-primary)]"
          >
            About <span className="text-[var(--color-primary)]">Yeshwant Maheshram</span>
            <span className="block text-lg sm:text-2xl font-semibold text-[var(--color-text-muted)] mt-2">
              Founder — TrackIntake & ITFocus
            </span>
          </motion.h1>
        </div>

        {/* Main Grid: Portrait Card + Biography */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start relative z-10">
          
          {/* ── Left Column: Portrait & Guiding Quote ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 flex flex-col items-center"
          >
            <div className="w-full max-w-md">
              <div className="bg-[var(--color-bg-surface)] p-4 sm:p-5 rounded-3xl border border-[var(--color-border-default)] shadow-lg overflow-hidden">
                <div className="overflow-hidden rounded-2xl aspect-square bg-slate-50 border border-[var(--color-border-default)]">
                  <img
                    src={founderImg}
                    alt="Yeshwant Maheshram — Founder"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-xl sm:text-2xl font-bold font-[var(--font-primary)] text-[var(--color-text-strong)]">
                    Yeshwant Maheshram
                  </h3>
                  <p className="text-sm font-semibold text-[var(--color-primary)] mt-1">
                    Founder & Tech Entrepreneur
                  </p>
                </div>

                {/* Badges */}
                <div className="mt-4 pt-3.5 border-t border-[var(--color-border-default)] grid grid-cols-2 gap-2.5 text-center text-xs text-[var(--color-text-muted)]">
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)]">
                    <span className="block font-bold text-[var(--color-text-strong)] text-sm sm:text-base">4+ Decades</span>
                    <span>Technology Innovation</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)]">
                    <span className="block font-bold text-[var(--color-text-strong)] text-sm sm:text-base">Global</span>
                    <span>Enterprise Problem-Solving</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guiding Quote Card beneath Image */}
            <div className="mt-6 w-full max-w-md bg-[var(--color-bg-surface)] p-5 sm:p-6 rounded-2xl border-l-4 border-[var(--color-primary)] border border-[var(--color-border-default)] shadow-md">
              <Quote className="w-6 h-6 text-[var(--color-primary)] opacity-40 mb-2" />
              <blockquote className="italic font-medium text-[var(--color-text-strong)] text-sm sm:text-base leading-relaxed font-[var(--font-primary)]">
                “Cultivation of mind should be the ultimate aim of human existence.”
              </blockquote>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] mt-3">
                — Yeshwant Maheshram
              </span>
            </div>
          </motion.div>

          {/* ── Right Column: Story, Philosophy, Cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Story Card */}
            <div className="bg-[var(--color-bg-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--color-border-default)] shadow-md space-y-5">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                The Journey of Innovation
              </h2>

              <p className="text-base sm:text-lg leading-relaxed text-[var(--color-text-default)]">
                What began as an early passion for electronics in the backyard of <strong className="text-[var(--color-text-strong)] font-semibold">Yeshwant Maheshram’s parental home in the 1980s</strong> evolved into a lifelong journey of technology innovation and entrepreneurship.
              </p>

              <p className="text-base sm:text-lg leading-relaxed text-[var(--color-text-default)]">
                Across decades spanning consumer electronics, personal computing, academic teaching, research, and enterprise ERP systems, Yeshwant has consistently demonstrated how disciplined thinking and resilience turn ambitious ideas into practical business solutions.
              </p>

              {/* Vision Card with societal quote */}
              <div className="pt-4 border-t border-[var(--color-border-default)]">
                <p className="text-sm sm:text-base text-[var(--color-text-default)] leading-relaxed mb-4">
                  Guided by a vision of using technology to create meaningful, accessible impact for everyday people and organizations, his work is rooted in the belief that progress thrives on open communication and shared knowledge:
                </p>

                <div className="p-5 sm:p-6 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] relative">
                  <p className="italic text-sm sm:text-base text-[var(--color-text-strong)] font-medium leading-relaxed font-[var(--font-primary)]">
                    “An ideal society should be mobile, should be full of channels that convey a change to take place in its one or another part. In an ideal society, there should be many interests consciously communicated and shared for the collective.”
                  </p>
                </div>
              </div>
            </div>

            {/* Academic & Research + Global Experience Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Academic & Research Card */}
              <div className="bg-[var(--color-bg-surface)] p-6 rounded-2xl border border-[var(--color-border-default)] shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-[var(--color-primary)]">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-[var(--color-text-strong)] font-[var(--font-primary)]">
                    Academic & Research
                  </h3>
                </div>

                <ul className="space-y-3.5 text-sm text-[var(--color-text-default)] flex-grow">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                    <span>
                      <strong className="text-[var(--color-text-strong)] font-semibold">Indian Institute of Science (IISc), Bangalore:</strong> Completed advanced academic studies building a strong foundation in engineering and systems thinking.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                    <span>
                      <strong className="text-[var(--color-text-strong)] font-semibold">IIT Delhi:</strong> Conducted specialized research in machine learning and neural networks, laying early groundwork in intelligent computing.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                    <span>
                      <strong className="text-[var(--color-text-strong)] font-semibold">SGSITS Alumni Association:</strong> Serves as an active Board Member, contributing to the institution's engineering community and mentorship ecosystem.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Global Experience & Current Focus Card */}
              <div className="bg-[var(--color-bg-surface)] p-6 rounded-2xl border border-[var(--color-border-default)] shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-[var(--color-text-strong)] font-[var(--font-primary)]">
                    Global Experience & Focus
                  </h3>
                </div>

                <div className="space-y-3.5 text-sm text-[var(--color-text-default)] flex-grow">
                  <p className="leading-relaxed">
                    With hands-on international experience across the <strong className="text-[var(--color-text-strong)] font-semibold">United States</strong>, the <strong className="text-[var(--color-text-strong)] font-semibold">United Kingdom</strong>, and major technology hubs in <strong className="text-[var(--color-text-strong)] font-semibold">India</strong>, Yeshwant brings a global perspective to enterprise problem-solving.
                  </p>
                  <p className="leading-relaxed pt-2 border-t border-[var(--color-border-default)]">
                    Today, through <strong className="text-[var(--color-text-strong)] font-semibold">ITFocus</strong> and <strong className="text-[var(--color-primary)] font-semibold">TrackIntake</strong>, he leads initiatives in cloud computing, mobile technology, and ERP/SAP consulting, helping businesses modernize their operations and scale efficiently.
                  </p>
                </div>
              </div>

            </div>

            {/* Quick Connect / Ecosystem Card */}
            <div className="bg-[var(--color-bg-surface)] p-6 rounded-2xl border border-[var(--color-border-default)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-strong)]">
                  Explore TrackIntake & Innovations
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Empowering healthier lives through smart nutrition and actionable daily tracking.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/contact"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[var(--color-border-default)] hover:border-[var(--color-primary)] text-[var(--color-text-default)] hover:text-[var(--color-primary)] transition-all"
                >
                  Contact Us
                </Link>
                <Link
                  to="/career"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-all shadow-sm"
                >
                  Join Our Team
                </Link>
              </div>
            </div>

          </motion.div>
        </div>
      </main>

      {/* ── Footer for visitors and non-patient roles ── */}
      {!hasGlobalNav && <Footer />}
    </div>
  );
};

export default Founder;

