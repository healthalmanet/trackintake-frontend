// src/components/layout/Navbar.jsx

import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ links = [], rightContent, align = "right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { pathname } = useLocation();

  const isHomepage = pathname === '/';

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      if (isHomepage) {
        let currentSectionId = '';
        links.forEach(link => {
          if (!link.to.startsWith('#')) return;
          const element = document.getElementById(link.to.substring(1));
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
              currentSectionId = link.to;
            }
          }
        });
        setActiveSection(currentSectionId);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, links, isHomepage]);

   useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) { // MODIFIED: Changed from 768 to 1024 to match the new 'lg' breakpoint
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAnchorLinkClick = (e, to) => {
    e.preventDefault();
    const targetId = to.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsOpen(false);
  };

  const navLinkStyle =
    "relative font-medium text-[var(--color-text-default)] transition-colors duration-300 focus:outline-none focus:text-[var(--color-primary)]";
  const activeLinkStyle = "text-[var(--color-primary)]";

  const renderNavLink = ({ to, label }) => {
    const isAnchorLink = to.startsWith("#");
    if (isAnchorLink) {
      const isActive = isHomepage && activeSection === to;
      return (
        <a
          key={to}
          href={to}
          onClick={(e) => handleAnchorLinkClick(e, to)}
          className={`${navLinkStyle} ${isActive ? activeLinkStyle : "hover:text-[var(--color-primary)]"}`}
        >
          {label}
        </a>
      );
    }
    return (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        onClick={() => setIsOpen(false)}
        className={({ isActive }) =>
          `${navLinkStyle} ${isActive ? activeLinkStyle : "hover:text-[var(--color-primary)]"}`
        }
      >
        {label}
      </NavLink>
    );
  };

  const alignmentClasses = {
    center: "absolute left-1/2 transform -translate-x-1/2",
    right: "ml-auto",
  };

  return (
    <nav
      className={`sticky top-0 z-50 h-16 px-4 sm:px-6 flex items-center justify-between font-[var(--font-secondary)] text-sm md:text-base transition-all duration-300 ${ // MODIFIED: Padding is now responsive
        isScrolled
          ? "bg-[var(--color-bg-surface)]/80 backdrop-blur-lg shadow-lg border-b border-[var(--color-border-default)]"
          : "bg-transparent"
      }`}
    >
      <NavLink to="/" className="flex items-center">
        {/* MODIFIED: Logo text is now responsive */}
        <span className="text-2xl lg:text-3xl tracking-wide font-[var(--font-primary)]">
          <span className="font-extrabold tracking-wide font-[var(--font-primary)]"><span className="text-[var(--color-primary)]">Track</span><span className="text-[var(--color-text-strong)]">Intake</span></span>
        </span>
      </NavLink>

      {/* MODIFIED: Links now appear only on large screens ('lg') to prevent overlap */}
      <div className={`hidden lg:flex items-center gap-8 ${alignmentClasses[align] || ""}`}>
        {links.map((link) => renderNavLink({ ...link }))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 text-sm font-medium">
          {rightContent}
        </div>
        {/* MODIFIED: Hamburger menu is now hidden on large screens ('lg') */}
        <div className="lg:hidden text-[var(--color-primary)]">
          <button onClick={toggleMenu} aria-label="Toggle menu" className="p-1">
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-full left-0 w-full bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)] flex flex-col items-center py-4 z-40 gap-4 shadow-xl"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="flex flex-col items-center gap-4"
            >
              {links.map((link) => (
                <motion.div key={link.to} variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }}>
                  {renderNavLink({ ...link })}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;