import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, MessageSquare, BellOff, Trash2, Menu, X } from 'lucide-react';
import { createPortal } from "react-dom";
import LogoutButton from "../LogoutButton";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import useWebSockets from "../../../api/useWebSockets";
import { getMessages, markMessageAsRead } from "../../../api/nutritionistApi";
import toast from "react-hot-toast";

export let clearNotificationsFromSender = (senderId) => {};

const timeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${Math.floor(seconds)}s ago`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
    const hours = minutes / 60;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    const days = hours / 24;
    return `${Math.floor(days)}d ago`;
};

const dropdownVariants = { hidden: { opacity: 0, y: -10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } }, exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } } };
const listVariants = { visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }, hidden: {} };
const itemVariants = { hidden: { y: -10, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
const mobileMenuVariants = { hidden: { x: '100%' }, visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }, exit: { x: '100%', transition: { type: 'spring', stiffness: 300, damping: 30 } } };

const NutriNavbar = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const processedNotificationIds = useRef(new Set());
    const { user } = useAuth();
    
    const hasUnread = notifications.length > 0;

    useEffect(() => {
        clearNotificationsFromSender = (senderId) => {
            if (!senderId) return;
            setNotifications(prev => prev.filter(n => String(n.sender_id) !== String(senderId)));
        };
        return () => { clearNotificationsFromSender = () => {}; };
    }, []);

    useEffect(() => {
        if (!user) return;
        const fetchInitialUnreadMessages = async () => {
            try {
                const response = await getMessages({ is_read: 'false' }); 
                const allFetchedMessages = response.data.results || [];
                const unreadMessages = allFetchedMessages.filter(msg => msg.is_read === false);
                const newNotifications = unreadMessages
                    .filter(msg => msg.sender_id !== user.id && !processedNotificationIds.current.has(msg.id));

                if (newNotifications.length > 0) {
                    newNotifications.forEach(n => processedNotificationIds.current.add(n.id));
                    setNotifications(prev => 
                        [...newNotifications, ...prev]
                        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    );
                }
            } catch (error) {
                console.error("Failed to fetch initial unread messages:", error);
            }
        };
        fetchInitialUnreadMessages();
    }, [user]);

    const handleNewNotification = useCallback((data) => {
        if (user && data.sender_id !== user.id && data.is_read === false) {
            if (!processedNotificationIds.current.has(data.id)) {
                processedNotificationIds.current.add(data.id);
                setNotifications(prev => [data, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            }
        }
    }, [user]);

    useWebSockets({ onMessage: handleNewNotification });

    const handleNotificationClick = async (clickedNotification) => {
        setIsDropdownOpen(false);
        const patientId = clickedNotification.sender_id;
        try {
            await markMessageAsRead({ sender_id: patientId });
        } catch (error) {
            console.error("Failed to mark message as read on click:", error);
        }
        clearNotificationsFromSender(patientId);
        navigate('/nutritionist/chat', { state: { openChatForUserId: patientId } });
    };
    
    useEffect(() => { setIsClient(true); }, []);
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && bellRef.current && !bellRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    useEffect(() => {
        const handleResize = () => { if (window.innerWidth >= 768) setIsMobileMenuOpen(false); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        try {
            await markMessageAsRead({ mark_all: true });
            setNotifications([]);
            processedNotificationIds.current.clear();
        } catch (error) {
            toast.error("Could not clear all notifications.");
        }
    };

    const navLinks = [
        { to: "/nutritionist", label: "Home" },
        { to: "/nutritionist/search", label: "Nutrition Search" },
        { to: "/nutritionist/chat", label: "Chat" },
        { to: "/nutritionist/availability", label: "Availability" },
        { to: "/nutritionist/subscription", label: "Subscription" },
        { to: "/nutritionist/profile", label: "Profile" }
    ];

    return (
        <>
            <header className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 ease-in-out ${isScrolled ? "bg-[var(--color-bg-surface-glass)] backdrop-blur-lg shadow-md border-b border-[var(--color-border-default)]" : "bg-[var(--color-bg-app)]"}`}>
                <NavLink to="/nutritionist" className="font-extrabold text-2xl sm:text-3xl tracking-wide font-[var(--font-primary)] flex-shrink-0">
                    <span className="text-[var(--color-primary)]">Track</span><span className="text-[var(--color-text-strong)]">Intake</span>
                </NavLink>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-4 lg:gap-7 xl:gap-8">
                    {navLinks.map(({ to, label }) => (
                        <NavLink 
                            key={to} 
                            to={to} 
                            end={to === "/nutritionist"} 
                            className={({ isActive }) => `text-sm lg:text-base font-medium transition-colors duration-200 py-1 ${isActive ? "text-[var(--color-primary)] font-bold border-b-2 border-[var(--color-primary)]" : "text-[var(--color-text-default)] hover:text-[var(--color-primary)]"}`}
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Notification Bell Dropdown */}
                    <div className="relative">
                        <motion.button 
                            ref={bellRef} 
                            onClick={() => setIsDropdownOpen(p => !p)} 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }} 
                            className="relative p-2 sm:p-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell size={20} className="sm:w-[22px] sm:h-[22px]" />
                            {hasUnread && (
                                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[var(--color-primary-hover)] ring-2 ring-white" />
                                </span>
                            )}
                        </motion.button>
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    ref={dropdownRef} 
                                    variants={dropdownVariants} 
                                    initial="hidden" 
                                    animate="visible" 
                                    exit="exit" 
                                    className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-sm bg-[var(--color-bg-surface)] rounded-3xl shadow-2xl border-2 border-[var(--color-border-default)] overflow-hidden font-[var(--font-secondary)] z-50"
                                >
                                    <div className="flex justify-between items-center p-3.5 sm:p-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-app)]">
                                        <h3 className="font-semibold text-base sm:text-lg text-[var(--color-text-strong)] font-[var(--font-primary)]">Notifications</h3>
                                        {notifications.length > 0 && (
                                            <button onClick={handleClearAll} className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] transition-colors flex items-center gap-1">
                                                <Trash2 size={13} /> Clear All
                                            </button>
                                        )}
                                    </div>
                                    <motion.div variants={listVariants} initial="hidden" animate="visible" className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif) => (
                                                <motion.div key={notif.id} variants={itemVariants} onClick={() => handleNotificationClick(notif)} whileHover={{ backgroundColor: 'var(--color-bg-interactive-subtle)', x: 2 }} className="flex items-start gap-3 p-3.5 sm:p-4 cursor-pointer border-b border-[var(--color-border-default)] last:border-b-0 transition-colors">
                                                    <div className="p-2 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] rounded-xl mt-0.5 flex-shrink-0"><MessageSquare size={17} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-xs sm:text-sm text-[var(--color-text-strong)] font-[var(--font-primary)] truncate">{notif.sender_name || 'New Message'}</p>
                                                        <p className="text-xs sm:text-sm text-[var(--color-text-default)] leading-snug line-clamp-2">{notif.text}</p>
                                                        <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{timeSince(new Date(notif.timestamp))}</p>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center p-8 sm:p-10 text-sm text-[var(--color-text-muted)]">
                                                <BellOff size={34} className="mb-2.5 text-[var(--color-text-subtle)]" />
                                                <p className="font-semibold text-sm sm:text-base text-[var(--color-text-strong)] font-[var(--font-primary)]">All caught up!</p>
                                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">New notifications will appear here.</p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Logout Button */}
                    <div className="flex items-center">
                        <LogoutButton />
                    </div>

                    {/* Mobile Menu Hamburger */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors" 
                            aria-label="Open navigation menu"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {isClient && createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                onClick={() => setIsMobileMenuOpen(false)} 
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden" 
                            />
                            <motion.div 
                                variants={mobileMenuVariants} 
                                initial="hidden" 
                                animate="visible" 
                                exit="exit" 
                                className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border-l-2 border-[var(--color-border-default)] shadow-2xl z-50 p-6 flex flex-col md:hidden overflow-y-auto font-[var(--font-secondary)]"
                            >
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border-default)]">
                                    <span className="font-extrabold text-2xl tracking-wide font-[var(--font-primary)]">
                                        <span className="text-[var(--color-primary)]">Track</span><span className="text-[var(--color-text-strong)]">Intake</span>
                                    </span>
                                    <button 
                                        onClick={() => setIsMobileMenuOpen(false)} 
                                        className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors" 
                                        aria-label="Close menu"
                                    >
                                        <X size={22} />
                                    </button>
                                </div>
                                <nav className="flex flex-col space-y-2 flex-1">
                                    {navLinks.map(({ to, label }) => (
                                        <NavLink 
                                            key={to} 
                                            to={to} 
                                            end={to === "/nutritionist"} 
                                            onClick={() => setIsMobileMenuOpen(false)} 
                                            className={({ isActive }) => `block px-4 py-3 rounded-2xl text-base font-medium transition-all duration-200 ${isActive ? "bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] font-bold border border-[var(--color-border-hover)]" : "text-[var(--color-text-default)] hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-text-strong)]"}`}
                                        >
                                            {label}
                                        </NavLink>
                                    ))}
                                </nav>
                                <div className="pt-4 border-t border-[var(--color-border-default)] mt-auto flex justify-center">
                                    <LogoutButton />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>, 
                document.body
            )}
        </>
    );
};

export default NutriNavbar;