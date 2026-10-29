// src/components/dashboard/HealthTools.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Weight, Ruler, Gauge } from "lucide-react";
import { motion } from "framer-motion";

const HealthTools = () => {
  // Tools array is updated to use your theme's semantic variable names
  const tools = [
    {
      name: "Weight Tracker",
      description: "Monitor your weight progress over time",
      icon: Weight,
      bg: "bg-[var(--color-info-bg-subtle)]",
      text: "text-[var(--color-info-text)]",
      link: "/dashboard/tools/weight-tracker",
    },
    {
      name: "BMI Calculator",
      description: "Calculate your Body Mass Index quickly",
      icon: Ruler,
      bg: "bg-[var(--color-warning-bg-subtle)]",
      text: "text-[var(--color-warning-text)]",
      link: "/dashboard/tools/bmi",
    },
    {
      name: "Body Fat Calculator",
      description: "Estimate your body fat percentage",
      icon: Gauge,
      bg: "bg-[var(--color-danger-bg-subtle)]",
      text: "text-[var(--color-danger-text)]",
      link: "/dashboard/tools/fat-calculator",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    // Section now uses the lighter 'bg-app' for a clean, open feel
    <section className="w-full bg-[var(--color-bg-app)] py-10 sm:py-16 px-4 sm:px-6 text-center font-[var(--font-secondary)]">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl sm:text-3xl font-[var(--font-primary)] font-bold mb-2 sm:mb-3 text-[var(--color-text-strong)]">
            Health Tools
          </h2>
          <p className="text-sm sm:text-lg text-[var(--color-text-default)] mb-8 sm:mb-12">
            Calculate and track your key health metrics
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8"
        >
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                variants={itemVariants}
                className="group relative bg-[var(--color-bg-surface)] p-5 sm:p-8 rounded-2xl border-2 border-[var(--color-border-default)] shadow-md hover:shadow-2xl transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-[var(--color-primary)] flex flex-col justify-between"
              >
                <div>
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-5 mx-auto ${tool.bg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`${tool.text} w-7 h-7 sm:w-8 sm:h-8`} />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-[var(--font-primary)] font-semibold text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors duration-300">{tool.name}</h3>
                  <p className="text-xs sm:text-base text-[var(--color-text-default)] mt-1.5 sm:mt-2">{tool.description}</p>
                </div>
                
                <div className="mt-5 sm:mt-6">
                  <Link to={tool.link} className="inline-block w-full sm:w-auto">
                    <button
                      className="w-full sm:w-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] font-bold hover:bg-[var(--color-primary-hover)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 text-xs sm:text-sm cursor-pointer"
                    >
                      Try it out
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HealthTools;