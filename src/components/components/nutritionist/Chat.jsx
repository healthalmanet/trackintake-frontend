import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Send, Smile, ArrowLeft, MessagesSquare, Inbox, AlertCircle } from 'lucide-react';
import { getMessages, sendMessage, getAssignedPatients, markMessageAsRead } from '../../../api/nutritionistApi';
import NutriNavbar from './NutriNavbar';
import BackButton from './BackButton';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import useWebSockets from '../../../api/useWebSockets';
import { clearNotificationsFromSender } from './NutriNavbar';

// --- HELPER COMPONENTS (UNCHANGED) ---
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};
const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) { return; }
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
};
const listContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const listItemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };
const PulsingDotsLoader = ({ text }) => (
    <div className="flex flex-col items-center justify-center gap-6 h-full">
        <div className="flex items-center justify-center gap-3">
            <motion.div className="w-4 h-4 bg-[var(--color-primary)] rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="w-4 h-4 bg-[var(--color-accent-2-text)] rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
            <motion.div className="w-4 h-4 bg-[var(--color-accent-3-text)] rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
        </div>
        <p className="text-lg text-[var(--color-text-default)] font-[var(--font-secondary)] tracking-wide">{text}</p>
    </div>
);
const getInitials = (name = '') => (name.trim().split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?');
const getColorForName = (name = '') => {
    const COLORS = ['#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#F4511E', '#6D4C41', '#757575', '#546E7A'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return COLORS[Math.abs(hash % COLORS.length)];
};
const InitialsAvatar = ({ name, size = 'md' }) => {
    const sizeStyles = { md: 'w-12 h-12 text-lg', sm: 'w-10 h-10 text-md' };
    return <div className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white shadow-inner ${sizeStyles[size]}`} style={{ backgroundColor: getColorForName(name) }} aria-label={name}>{getInitials(name)}</div>;
};
const UserListItem = ({ user, isActive, onClick }) => (
    <motion.li variants={listItemVariants} onClick={onClick} layout className={`group flex items-center p-3 cursor-pointer transition-all duration-300 ease-in-out border-l-4 ${isActive ? 'bg-[var(--color-bg-surface-alt)] border-[var(--color-primary)]' : 'border-transparent hover:bg-[var(--color-bg-interactive-subtle)] hover:border-[var(--color-primary)]/50'}`}>
        <motion.div whileHover={{ scale: 1.1 }} className="relative mr-4 flex-shrink-0"><InitialsAvatar name={user.name} size="md" /></motion.div>
        <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-center"><h3 className="font-bold font-primary text-md text-[var(--color-text-strong)] truncate">{user.name}</h3>{user.timestamp && <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0 ml-2">{user.timestamp}</span>}</div>
            <div className="flex justify-between items-start mt-1">
                <p className={`text-sm truncate font-secondary ${!user.timestamp ? 'italic text-[var(--color-text-subtle)]' : 'text-[var(--color-text-muted)]'}`}>{user.lastMessage}</p>
                {user.unreadCount > 0 && <AnimatePresence><motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="ml-2 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-[var(--color-primary)] rounded-full h-5 w-5 shadow-md">{user.unreadCount}</motion.span></AnimatePresence>}
            </div>
        </div>
    </motion.li>
);
const ChatMessage = ({ message, isNutritionist, onRetry }) => (
    <motion.div initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} layout className={`flex my-2 items-end gap-2 ${isNutritionist ? 'justify-end' : 'justify-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-lg lg:max-w-xl shadow-sm font-[var(--font-secondary)] transition-opacity duration-300 ${isNutritionist ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] rounded-br-none font-medium' : 'bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] rounded-bl-none border-2 border-[var(--color-border-default)]'} ${message.status === 'sending' ? 'opacity-60' : 'opacity-100'}`}>
            <p className="break-words text-xs sm:text-sm whitespace-pre-wrap">{message.text}</p>
            <div className="flex items-center justify-end gap-2 mt-1">
                {isNutritionist && message.status === 'sending' && (
                    <span className="text-[10px] text-white/70 italic">Sending...</span>
                )}
                {isNutritionist && message.status === 'failed' && (
                    <div className="flex items-center gap-1 text-[11px] text-red-200">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>Failed</span>
                        {onRetry && (
                            <button
                                type="button"
                                onClick={() => onRetry(message)}
                                className="underline font-bold text-white hover:text-red-100 ml-1 cursor-pointer"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                )}
                <span className={`block text-[10px] ${isNutritionist ? 'text-white/80' : 'text-[var(--color-text-muted)]'}`}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    </motion.div>
);

// --- CHAT WINDOW SUB-COMPONENT ---
const ChatWindow = ({ user, nutritionistId, onNewMessageSent, onChatClose }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const [isListening, setIsListening] = useState(false);

    // 🎤 Voice input
    const recognitionRef = useRef(null);

    const startVoiceInput = () => {
        if (!("webkitSpeechRecognition" in window)) {
            toast.error("Voice input not supported in this browser");
            return;
        }

        // Toggle OFF if already listening
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = "en-IN"; // or hi-IN
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setNewMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = () => {
            toast.error("Voice input failed");
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };


    useClickOutside(emojiPickerRef, () => setShowEmojiPicker(false));

    const handleNewMessage = useCallback((message) => {
        const msgSenderId = String(message.sender_id || message.sender?.id || '');
        const msgReceiverId = String(message.receiver_id || message.receiver?.id || '');
        const chatPartnerId = String(user?.id || user?.patient_id || user?.user_id || '');
        const currentNutriId = String(nutritionistId || '');

        const isForThisChat = 
            (msgSenderId === chatPartnerId && msgReceiverId === currentNutriId) ||
            (msgReceiverId === chatPartnerId && msgSenderId === currentNutriId) ||
            msgSenderId === chatPartnerId;

        if (isForThisChat) {
            setMessages(prev => {
                if (prev.some(m => m.id && message.id && String(m.id) === String(message.id))) return prev;
                const withoutTemp = prev.filter(
                    m => !(String(m.id).startsWith('temp_') && m.text === (message.text || message.message))
                );
                return [...withoutTemp, message].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            });
            if (msgSenderId === chatPartnerId) {
                markMessageAsRead({ sender_id: user.id });
                clearNotificationsFromSender(user.id);
            }
        }
    }, [user?.id, nutritionistId]);

    useWebSockets({ onMessage: handleNewMessage });

    useEffect(() => {
        const handleSync = (e) => {
            if (e?.detail) handleNewMessage(e.detail);
        };
        window.addEventListener('trackintake:chat_message', handleSync);
        return () => window.removeEventListener('trackintake:chat_message', handleSync);
    }, [handleNewMessage]);

    useEffect(() => {
        const fetchAndFilterMessages = async () => {
            setIsLoading(true);
            try {
                // Fetch messages specifically for this active conversation
                const response = await getMessages({ partner_id: user.id });
                const conversationMessages = (response.data?.results || response.data || [])
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                setMessages(conversationMessages);

                const hasUnread = conversationMessages.some(msg => !msg.is_read && String(msg.sender_id) === String(user.id));
                if (hasUnread) {
                    await markMessageAsRead({ sender_id: user.id });
                    clearNotificationsFromSender(user.id);
                }
            } catch (error) {
                toast.error(`Could not load conversation for ${user.name}.`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndFilterMessages();
    }, [user.id, nutritionistId]); // Depend on both user and nutritionist IDs

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Fallback sync polling to ensure 100% reliable real-time delivery for active chat
    useEffect(() => {
        if (!user?.id) return;
        const pollInterval = setInterval(async () => {
            try {
                const response = await getMessages({ partner_id: user.id });
                const serverMessages = response.data?.results || response.data || [];
                if (serverMessages.length > 0) {
                    setMessages(prev => {
                        const map = new Map();
                        prev.forEach(m => map.set(m.id, m));
                        let hasNew = false;
                        serverMessages.forEach(m => {
                            if (!map.has(m.id)) {
                                map.set(m.id, m);
                                hasNew = true;
                            }
                        });
                        if (!hasNew) return prev;
                        return Array.from(map.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    });
                }
            } catch (e) {
                // Silent poll error
            }
        }, 2000);
        return () => clearInterval(pollInterval);
    }, [user?.id]);

    const handleRetry = async (failedMsg) => {
        if (!failedMsg || !user?.id) return;
        setMessages(prev => prev.map(msg => msg.id === failedMsg.id ? { ...msg, status: 'sending' } : msg));
        try {
            const response = await sendMessage(user.id, failedMsg.text);
            setMessages(prev => prev.map(msg => msg.id === failedMsg.id ? { ...response.data, status: 'sent' } : msg));
            window.dispatchEvent(new CustomEvent('trackintake:chat_message', { detail: response.data }));
            toast.success("Message sent successfully!");
        } catch (err) {
            const errText = err.response?.data?.text?.[0] || err.response?.data?.detail || "Failed to deliver message. Please retry.";
            toast.error(errText);
            setMessages(prev => prev.map(msg => msg.id === failedMsg.id ? { ...failedMsg, status: 'failed' } : msg));
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (newMessage.length > 2000) {
            toast.error("Message exceeds the maximum limit of 2,000 characters. Please shorten it.");
            return;
        }
        const tempId = `temp_${Date.now()}`;
        const text = newMessage;
        const optimisticMessage = { id: tempId, sender_id: nutritionistId, receiver_id: user.id, text, timestamp: new Date().toISOString(), status: 'sending' };
        setMessages(prev => [...prev, optimisticMessage]);
        onNewMessageSent(text);
        setNewMessage('');
        try {
            const response = await sendMessage(user.id, text);
            setMessages(prev => prev.map(msg => msg.id === tempId ? { ...response.data, status: 'sent' } : msg));
            window.dispatchEvent(new CustomEvent('trackintake:chat_message', { detail: response.data }));
        } catch (err) {
            console.error("Failed to send message:", err);
            const errText = err.response?.data?.text?.[0] || err.response?.data?.detail || "Message delivery failed. Please shorten your message or retry.";
            toast.error(errText);
            setMessages(prev => prev.map(msg => msg.id === tempId ? { ...optimisticMessage, status: 'failed' } : msg));
        }
    };

    return (
        <>
            <header className="flex items-center p-3 px-4 md:px-6 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] shadow-sm flex-shrink-0">
                <button onClick={onChatClose} className="mr-3 p-2 rounded-full hover:bg-[var(--color-bg-interactive-subtle)] transition-colors md:hidden"><ArrowLeft size={20} /></button>
                <div className="flex items-center cursor-pointer group rounded-lg p-1 -ml-1 transition-colors hover:bg-[var(--color-bg-interactive-subtle)]" onClick={() => navigate(`/nutritionist/patient/${user.id}`)} title={`View profile for ${user.name}`}>
                    <InitialsAvatar name={user.name} size="sm" />
                    <div className="ml-3">
                        <h3 className="text-lg font-bold font-primary text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">{user.name}</h3>
                        <p className="text-sm text-[var(--color-text-muted)] font-secondary">Patient</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                {isLoading ? <PulsingDotsLoader text="Loading Messages..." /> : messages.length > 0 ? messages.map(msg => <ChatMessage key={msg.id} message={msg} isNutritionist={String(msg.sender_id) === String(nutritionistId)} onRetry={handleRetry} />) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)]">
                        <MessagesSquare size={56} className="mb-4 opacity-30" />
                        <h4 className="text-lg font-semibold font-primary text-[var(--color-text-strong)]">Start the Conversation</h4>
                        <p className="font-secondary">Send the first message to get things started with {user.name}.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)] flex-shrink-0">
                <div className="relative">
                    <AnimatePresence>{showEmojiPicker && <motion.div ref={emojiPickerRef} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute bottom-full mb-2"><EmojiPicker onEmojiClick={(emoji) => setNewMessage(p => p + emoji.emoji)} height={400} width={350} lazyLoadEmojis /></motion.div>}</AnimatePresence>
                    <form onSubmit={handleSendMessage} className="flex items-center bg-[var(--color-bg-interactive-subtle)] rounded-xl px-2 py-1.5 shadow-inner">
                        <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="p-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors rounded-full hover:bg-white"><Smile size={22} /></button>
                        <motion.button
                            type="button"
                            onClick={startVoiceInput}
                            title={isListening ? "Listening..." : "Voice input"}
                            className={`relative p-3 rounded-full transition-colors ${isListening
                                    ? "text-red-500"
                                    : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                                }`}
                            animate={isListening ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                            transition={
                                isListening
                                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                                    : { duration: 0.2 }
                            }
                        >
                            🎤

                            {/* Pulsing ring */}
                            {isListening && (
                                <motion.span
                                    className="absolute inset-0 rounded-full border-2 border-red-400"
                                    initial={{ opacity: 0.6, scale: 1 }}
                                    animate={{ opacity: 0, scale: 1.8 }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                                />
                            )}
                        </motion.button>


                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Type a message... (max 2,000 characters)"
                                maxLength={2000}
                                className="w-full px-4 py-2 pr-16 bg-transparent focus:outline-none text-[var(--color-text-default)] font-secondary"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            {newMessage.length > 1500 && (
                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono ${newMessage.length >= 2000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    {newMessage.length}/2000
                                </span>
                            )}
                        </div>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} type="submit" className="p-3 text-white bg-[var(--color-primary)] rounded-lg shadow-md hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-opacity-50" disabled={!newMessage.trim()}><Send size={20} /></motion.button>
                    </form>
                </div>
            </footer>
        </>
    );
};
// --- MAIN CHAT PAGE COMPONENT ---
const Chat = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [patients, setPatients] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const NUTRITIONIST_ID = user?.id;

    const handleListUpdate = useCallback((message) => {
        if (!NUTRITIONIST_ID) return;
        const msgSenderId = String(message.sender_id || message.sender?.id || '');
        const msgReceiverId = String(message.receiver_id || message.receiver?.id || '');
        const participantId = msgSenderId === String(NUTRITIONIST_ID) ? msgReceiverId : msgSenderId;

        setPatients(prev => prev.map(p => {
            if (String(p.id) === String(participantId)) {
                const isNewUnread = msgSenderId !== String(NUTRITIONIST_ID) && String(activeUser?.id) !== String(participantId);
                const msgText = message.text || message.message || '';
                return {
                    ...p,
                    lastMessage: msgText,
                    timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    rawTimestamp: new Date(message.timestamp),
                    unreadCount: (isNewUnread && !message.is_read) ? (p.unreadCount || 0) + 1 : p.unreadCount
                };
            }
            return p;
        }).sort((a, b) => new Date(b.rawTimestamp) - new Date(a.rawTimestamp)));
    }, [NUTRITIONIST_ID, activeUser]);

    useWebSockets({ onMessage: handleListUpdate });

    useEffect(() => {
        const handleSync = (e) => {
            if (e?.detail) handleListUpdate(e.detail);
        };
        window.addEventListener('trackintake:chat_message', handleSync);
        return () => window.removeEventListener('trackintake:chat_message', handleSync);
    }, [handleListUpdate]);

    useEffect(() => {
        if (!NUTRITIONIST_ID) return;
        const fetchPatientList = async (isBackground = false) => {
            if (!isBackground) setIsPageLoading(true);
            try {
                const [patientsRes, messagesRes] = await Promise.all([
                    getAssignedPatients(debouncedSearchTerm ? `?search=${encodeURIComponent(debouncedSearchTerm)}` : ''),
                    getMessages()
                ]);
                const patientList = patientsRes.data.results || patientsRes.data || [];
                const allMessages = messagesRes.data.results || messagesRes.data || [];
                const unreadMap = new Map();
                const lastMessageMap = new Map();
                allMessages.forEach(msg => {
                    const senderId = String(msg.sender_id || msg.sender?.id || '');
                    const receiverId = String(msg.receiver_id || msg.receiver?.id || '');
                    const participantId = senderId === String(NUTRITIONIST_ID) ? receiverId : senderId;
                    if (!lastMessageMap.has(participantId) || new Date(msg.timestamp) > new Date(lastMessageMap.get(participantId).timestamp)) {
                        lastMessageMap.set(participantId, msg);
                    }
                    if (senderId === participantId && !msg.is_read) {
                        unreadMap.set(participantId, (unreadMap.get(participantId) || 0) + 1);
                    }
                });
                const enrichedPatients = patientList.map(p => {
                    const lastMsg = lastMessageMap.get(String(p.id));
                    return {
                        ...p,
                        name: p.full_name,
                        lastMessage: lastMsg?.text || lastMsg?.message || "Click to start a conversation.",
                        timestamp: lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        unreadCount: unreadMap.get(String(p.id)) || 0,
                        rawTimestamp: lastMsg ? new Date(lastMsg.timestamp) : new Date(0)
                    };
                });
                setPatients(enrichedPatients.sort((a, b) => new Date(b.rawTimestamp) - new Date(a.rawTimestamp)));
            } catch (err) {
                if (!isBackground) setError("Could not load conversations.");
            } finally {
                if (!isBackground) setIsPageLoading(false);
            }
        };

        fetchPatientList();
        const listInterval = setInterval(() => fetchPatientList(true), 3000);
        return () => clearInterval(listInterval);
    }, [debouncedSearchTerm, NUTRITIONIST_ID]);

    // This is a clean and simple state update.
    const handleUserSelect = (selectedUser) => {
        setIsChatVisible(true);
        setActiveUser(selectedUser);
        setPatients(prev => prev.map(p => p.id === selectedUser.id ? { ...p, unreadCount: 0 } : p));
    };

    useEffect(() => {
        const targetUserId = location.state?.openChatForUserId;
        if (targetUserId && patients.length > 0) {
            if (String(activeUser?.id) !== String(targetUserId)) {
                const userToSelect = patients.find(p => String(p.id) === String(targetUserId));
                if (userToSelect) {
                    handleUserSelect(userToSelect);
                }
            }
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, patients, activeUser, navigate]);

    if (loading || isPageLoading) return <div className="flex items-center justify-center h-screen"><PulsingDotsLoader text="Loading Conversations..." /></div>;
    if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] bg-[var(--color-bg-app)] font-[var(--font-primary)]">
            <div className="flex flex-1 overflow-hidden">
                <aside className={`w-full flex-shrink-0 flex flex-col bg-[var(--color-bg-surface)] border-r border-[var(--color-border-default)] transition-transform duration-300 ease-in-out md:w-1/3 md:relative md:translate-x-0 lg:w-1/4 ${isChatVisible ? '-translate-x-full' : 'translate-x-0'}`}>
                    <header className="p-4 border-b border-[var(--color-border-default)] flex-shrink-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[var(--color-text-strong)]">Chats</h2>
                            <BackButton label="Dashboard" to="/nutritionist" />
                        </div>
                        <div className="relative mt-3">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] z-10" />
                            <input type="text" placeholder="Search by name..." className="w-full py-2.5 pl-12 pr-10 border-2 bg-[var(--color-bg-app)] border-[var(--color-border-default)] rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <AnimatePresence mode="wait">{patients.length > 0 ? <motion.ul key="patient-list" variants={listContainerVariants} initial="hidden" animate="visible">{patients.map(p => <UserListItem key={p.id} user={p} isActive={activeUser?.id === p.id} onClick={() => handleUserSelect(p)} />)}</motion.ul> : <div className="flex flex-col items-center justify-center h-full text-center p-4"><Inbox size={44} className="mb-3 text-[var(--color-text-subtle)]" /><h4 className="font-bold text-[var(--color-text-strong)]">No Patients Found</h4><p className="text-xs text-[var(--color-text-muted)] mt-1">{searchTerm ? "Try a different search term." : "Assigned patients will appear here."}</p></div>}</AnimatePresence>
                    </div>
                </aside>
                <main className={`w-full flex-shrink-0 flex flex-col bg-[var(--color-bg-app)] transition-transform duration-300 ease-in-out md:w-2/3 md:relative md:translate-x-0 lg:w-3/4 ${isChatVisible ? 'translate-x-0' : 'translate-x-full absolute'}`}>
                    {activeUser ? <ChatWindow key={activeUser.id} user={activeUser} nutritionistId={NUTRITIONIST_ID} onNewMessageSent={(text) => handleListUpdate({ sender_id: NUTRITIONIST_ID, receiver_id: activeUser.id, text, timestamp: new Date().toISOString(), is_read: true })} onChatClose={() => setIsChatVisible(false)} /> : <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-[var(--color-text-muted)] bg-[var(--color-bg-surface)]"><Inbox size={56} className="mb-3 opacity-30 text-[var(--color-primary)]" /><h3 className="text-xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">Welcome to your Inbox</h3><p className="text-sm mt-1">{patients.length > 0 ? "Select a conversation to begin." : "You have no assigned patients yet."}</p></div>}
                </main>
            </div>
        </div>
    );
};

export default Chat;