import React from 'react';
import { Facebook, Twitter, Instagram, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const userQuickLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Tools", path: "/dashboard/tools" },
  { label: "Profile", path: "/dashboard/user-profile" },
  { label: "Health", path: "/dashboard/health-section" },
];

const nutritionistQuickLinks = [
  { label: "Home", path: "/nutritionist" },
  { label: "Nutrition Search", path: "/nutritionist/search" },
  { label: "Patient Chat", path: "/nutritionist/chat" },
  { label: "Manage Availability", path: "/nutritionist/availability" },
  { label: "Subscription", path: "/nutritionist/subscription" },
];

const legalLinks = [
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms & Conditions", path: "/terms-conditions" },
  { label: "Refund & Return Policy", path: "/refund-policy" },
  { label: "Contact", path: "/contact" },
];

const Footer = () => {
  const { user } = useAuth();
  const isNutritionist = user?.role === "nutritionist";
  const linksToDisplay = isNutritionist ? nutritionistQuickLinks : userQuickLinks;

  return (
    <footer className="bg-[var(--color-bg-surface)] text-[var(--color-text-default)] font-[var(--font-secondary)] border-t-2 border-[var(--color-border-default)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-10">
          
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <span className="font-bold text-xl tracking-wide font-[var(--font-primary)]">
                <span className="text-[var(--color-primary)]">Track</span>
                <span className="text-[var(--color-text-strong)]">Intake</span>
              </span>
            </div>

            <p className="text-[var(--color-text-default)] leading-relaxed mb-6 max-w-md">
              Your smart companion for everyday healthy eating — log meals, track water, and reach health goals every day with joy.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-text-on-primary)] transition-all duration-300"
                  aria-label="Social Icon"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-[var(--color-text-strong)] font-[var(--font-primary)] mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {linksToDisplay.map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.path}
                    className="text-[var(--color-text-default)] hover:text-[var(--color-primary)] transition-colors duration-200 block py-1 font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold text-[var(--color-text-strong)] font-[var(--font-primary)] mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.path}
                    className="text-[var(--color-text-default)] hover:text-[var(--color-primary)] transition-colors duration-200 block py-1 font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-[var(--color-text-muted)] mt-16 pt-8 border-t-2 border-dashed border-[var(--color-border-default)]">
          <p className="flex items-center justify-center gap-1.5 flex-wrap">
            <span>
              © {new Date().getFullYear()}{" "}
              <span className="font-medium">
                <span className="text-[var(--color-primary)]">Track</span>
                <span className="text-[var(--color-text-strong)]">Intake</span>
              </span>
              . All rights reserved.
            </span>
            <span className="flex items-center gap-1">
              Made with{" "}
              <Heart
                className="inline-block text-[var(--color-danger-text)] h-4 w-4"
                fill="currentColor"
              />
              .
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;





























