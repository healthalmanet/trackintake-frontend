// src/components/dashboard/DietRecommendations.jsx

import React from 'react';
import { sampleMeals } from "../../api/recommendation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';

const DietRecommendations = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    // Section uses the darker 'bg-surface-alt' for a rich, contrasting background
    <section className="w-full bg-[var(--color-bg-surface-alt)] py-10 sm:py-16 px-4 sm:px-6 font-[var(--font-secondary)]">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h2 className="text-2xl sm:text-3xl font-[var(--font-primary)] font-bold text-center text-[var(--color-text-strong)] mb-2 sm:mb-3">
            Personalized Diet & Clinical Suggestions
          </h2>
          <p className="text-center text-sm sm:text-lg text-[var(--color-text-default)] mb-8 sm:mb-12">
            AI-powered meal plans & clinical suggestions tailored to your health goals
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8"
        >
          {sampleMeals.map((meal, index) => (
               <motion.div
              key={index}
              variants={itemVariants}
              className="group relative bg-[var(--color-bg-surface)] rounded-2xl border-2 border-[var(--color-border-default)] shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5 hover:border-[var(--color-primary)] overflow-hidden"
            >
              {/* --- THIS IS THE NEW LINK WRAPPER --- */}
              <Link to="/dashboard/meals" className="block cursor-pointer">
                <div className="relative">
                  <img
                    src={meal.image}
                    alt={meal.title}
                    className="rounded-t-2xl h-40 sm:h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                <div className="p-4 sm:p-5 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-[var(--font-primary)] font-semibold text-[var(--color-text-strong)] mb-1 truncate group-hover:text-[var(--color-primary)] transition-colors duration-300">
                    {meal.title}
                  </h3>
                  <p className="text-xs sm:text-base text-[var(--color-text-default)] min-h-[2.5rem]">
                    {meal.description}
                  </p>

                  <div className="flex justify-between text-xs sm:text-base font-bold mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-dashed border-[var(--color-border-default)]">
                    <span className="text-[var(--color-warning-text)]">{meal.calories} Kcal</span>
                    <span className="text-[var(--color-primary)]">{meal.protein} Protein</span>
                  </div>

                  {/* Indicator visible on mobile, hover-animated on desktop */}
                   <div className="mt-3 sm:mt-4 text-right opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-semibold text-[var(--color-primary)] inline-flex items-center gap-1">
                    View Diet Plan
                    <ArrowRight size={15} className="transform group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-center mt-10 sm:mt-16">
            <Link to= "/dashboard/meals" ><button className="bg-[var(--color-primary)] text-[var(--color-text-on-primary)] font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl shadow-md hover:bg-[var(--color-primary-hover)] transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 active:scale-100 flex items-center justify-center gap-2 mx-auto text-xs sm:text-sm cursor-pointer">
                View Full Diet Plan
                <ArrowRight size={18} />
            </button>
            </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DietRecommendations;