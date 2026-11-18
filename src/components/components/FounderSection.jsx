import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Globe, Quote, Award, Cpu, Network } from 'lucide-react';
import founderImg from '../../assets/founder_yeshwant_maheshram.jpg';

const itemFadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 100, damping: 14 } 
  },
};

const FounderSection = () => {
  return (
    <section id="founder" className="relative py-20 lg:py-28 px-6 lg:px-8 bg-[var(--color-bg-app)] overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-r from-[var(--color-primary-bg-subtle)] via-transparent to-[var(--color-accent-2-bg-subtle)] opacity-40 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--color-text-strong)] tracking-tight font-[var(--font-primary)]"
          >
            About <span className="text-[var(--color-primary)]">Yeshwant Maheshram</span>
            <span className="block text-xl sm:text-2xl font-semibold text-[var(--color-text-muted)] mt-2">
              Founder — TrackIntake & ITFocus
            </span>
          </motion.h2>
        </div>

        {/* Main Content Grid: Image + Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Founder Portrait Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
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

                {/* Sub-card quick stats / badges */}
                <div className="mt-4 pt-3.5 border-t border-[var(--color-border-default)] grid grid-cols-2 gap-2 text-center text-xs text-[var(--color-text-muted)]">
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)]">
                    <span className="block font-bold text-[var(--color-text-strong)] text-sm">4+ Decades</span>
                    <span>Tech Innovation</span>
                  </div>
                  <div className="p-2 rounded-xl bg-[var(--color-bg-surface-alt)]">
                    <span className="block font-bold text-[var(--color-text-strong)] text-sm">Global</span>
                    <span>Enterprise Impact</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guiding Quote Card beneath Image */}
            <div className="mt-6 w-full max-w-md bg-[var(--color-bg-surface)] p-5 rounded-2xl border-l-4 border-[var(--color-primary)] border border-[var(--color-border-default)] shadow-md">
              <Quote className="w-6 h-6 text-[var(--color-primary)] opacity-40 mb-2" />
              <blockquote className="italic font-medium text-[var(--color-text-strong)] text-sm sm:text-base leading-relaxed font-[var(--font-primary)]">
                “Cultivation of mind should be the ultimate aim of human existence.”
              </blockquote>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] mt-3">
                — Yeshwant Maheshram
              </span>
            </div>
          </motion.div>

          {/* Right Column: Bio Narrative & Philosophy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-[var(--color-text-default)]"
          >
            {/* Lead Narrative */}
            <div className="bg-[var(--color-bg-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--color-border-default)] shadow-md space-y-5">
              <p className="text-base sm:text-lg leading-relaxed">
                What began as an early passion for electronics in the backyard of Yeshwant Maheshram’s parental home in the early college days evolved into a lifelong journey of technology innovation and entrepreneurship.
              </p>
              <p className="text-base sm:text-lg leading-relaxed">
                Across decades spanning consumer electronics, personal computing, academic teaching, research, and enterprise ERP systems, Yeshwant has consistently demonstrated how disciplined thinking and resilience turn ambitious ideas into practical business solutions.
              </p>

              {/* Vision Highlight Card */}
              <div className="pt-4 border-t border-[var(--color-border-default)]">
                <p className="text-sm sm:text-base text-[var(--color-text-default)] leading-relaxed mb-4">
                  Guided by a vision of using technology to create meaningful, accessible impact for everyday people and organizations, his work is rooted in the belief that progress thrives on open communication and shared knowledge:
                </p>
                <div className="p-5 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] relative">
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

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;

