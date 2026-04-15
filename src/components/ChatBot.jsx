
import { useState } from "react";

// ================= MENU DATA =================
// Static menu content for dropdown
const menuData = {
    "About TrackIntake": "TrackIntake is an AI-powered nutrition and health tracking platform that helps you log your daily meals, monitor your nutrition, and receive personalized diet recommendations.",
    "Data & Security": "Your data is safe, secure, and never shared without your permission.",
    "Contact Us": "📞 7898622813"
};

// ================= USER FAQs =================
// Questions for normal users
const userFAQs = {
    "How to Use": [
        { q: "How do I start using TrackIntake?" },
        { q: "What details are required first?" },
        { q: "Is it easy for beginners?" },
        { q: "Do I need to use it daily?" },
        { q: "Can I skip profile setup?" }
    ],
    "Track Meals": [
        { q: "How do I log my meals?" },
        { q: "Can I edit my meals later?" },
        { q: "How are meals organized?" },
        { q: "Does it support Indian food?" },
        { q: "Is there a food search option?" }
    ],
    "Diet Plans": [
        { q: "How do I get diet plans?" },
        { q: "Are diet plans personalized?" },
        { q: "Can I follow plans without a nutritionist?" },
        { q: "Will veg preference be followed?" },
        { q: "Are diet plans accurate?" }
    ],
    "Health Tracking": [
        { q: "What health tools are available?" },
        { q: "Can I track my BMI?" },
        { q: "Can I track water intake?" },
        { q: "Can I track my weight?" },
        { q: "Is this platform suitable for diabetes or heart patients?" }
    ],
    "My Progress": [
        { q: "Can I see my progress?" },
        { q: "What does the dashboard show?" },
        { q: "Can I track long-term progress?" },
        { q: "Does it help with motivation?" },
        { q: "Is progress tracking automatic?" }
    ],
    "Help & Support": [
        { q: "Can I contact support?" },
        { q: "Can I consult a nutritionist?" },
        { q: "What should I do if I face issues?" },
        { q: "Is help available anytime?" },
        { q: "Can I give feedback?" }
    ]
};

// ================= NUTRITIONIST FAQs =================
// Questions for nutritionists
const nutritionistFAQs = {
    "How to Use": [
        { q: "How do I start using TrackIntake as a nutritionist?" },
        { q: "What details are required during setup?" },
        { q: "Is the platform easy to use?" },
        { q: "Do I need training before using it?" },
        { q: "Can I start working immediately?" }
    ],
    "Patients": [
        { q: "Can I manage multiple patients?" },
        { q: "Can I monitor patients daily?" },
        { q: "Can I get new patients through the platform?" },
        { q: "How can I track patient progress?" },
        { q: "Is patient data easy to access?" }
    ],
    "Diet Plans": [
        { q: "How do I create diet plans?" },
        { q: "Can I customize diet plans?" },
        { q: "Does the system support Indian diets?" },
        { q: "Can I reuse diet plans?" },
        { q: "Does AI help in diet planning?" }
    ],
    "Consultations": [
        { q: "Can I conduct online consultations?" },
        { q: "Can I communicate with patients easily?" },
        { q: "Can I schedule consultations?" },
        { q: "Is follow-up support available?" },
        { q: "Is it convenient for both sides?" }
    ],
    "Earnings": [
        { q: "How can I earn through TrackIntake?" },
        { q: "Are there multiple earning options?" },
        { q: "Can I set my own pricing?" },
        { q: "Can this help grow my practice?" },
        { q: "Can I track my earnings?" }
    ],
    "Reports": [
        { q: "Can I generate patient reports?" },
        { q: "What insights are available?" },
        { q: "Can I track long-term progress?" },
        { q: "Are reports easy to understand?" },
        { q: "Can I use data for research?" }
    ],
    "Help & Support": [
        { q: "What should I do if I face issues?" },
        { q: "Is technical support available?" },
        { q: "Can I request a demo?" },
        { q: "How can I contact support?" },
        { q: "Can I give feedback?" }
    ]
};

export default function Chatbot() {

    // ================= STATE MANAGEMENT =================
    const [open, setOpen] = useState(false); // chatbot open/close
    const [historyStack, setHistoryStack] = useState([]); // navigation history
    const [activeData, setActiveData] = useState(null); // current FAQ dataset
    const [currentView, setCurrentView] = useState("home"); // current screen
    const [answers, setAnswers] = useState({}); // API answers
    const [loading, setLoading] = useState({}); // loading state per question
    const [selectedQuestion, setSelectedQuestion] = useState(null); // selected question index
    const [menuOpen, setMenuOpen] = useState(false); // menu dropdown toggle
    const [activeMenu, setActiveMenu] = useState(null); // active menu item

    // ================= CHATBOT CONTROLS =================
    const closeBot = () => setOpen(false);

    const openBot = () => {
        setOpen(true);
        showHome();
    };

    const showHome = () => {
        setHistoryStack([]);
        setCurrentView("home");
    };

    // ================= BACK NAVIGATION =================
    const goBack = () => {
        if (historyStack.length > 0) {
            const previousView = historyStack[historyStack.length - 1];
            setHistoryStack(historyStack.slice(0, -1));
            setCurrentView(previousView);
        }
    };

    // ================= SHOW QUESTIONS =================
    const showQ = (cat) => {
        setHistoryStack([...historyStack, currentView]);
        setCurrentView(cat);
        setSelectedQuestion(null);
    };

    // ================= FETCH ANSWER FROM API =================
    const getAnswer = async (question, index) => {

        // Toggle close if same question clicked
        if (selectedQuestion === index) {
            setSelectedQuestion(null);
            return;
        }

        setSelectedQuestion(index);
        setLoading({ [index]: true });
        setAnswers({});

        try {
            const res = await fetch("http://127.0.0.1:8000/api/chat/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question })
            });

            const data = await res.json();
            setAnswers({ [index]: data.answer });

        } catch (err) {
            console.error(err);
            setAnswers({ [index]: "⚠️ Server error" });
        }

        setLoading({ [index]: false });
    };

    // ================= OPEN USER / NUTRITION SECTION =================
    const openSection = (type) => {
        setHistoryStack([...historyStack, currentView]);
        setActiveData(type === "user" ? userFAQs : nutritionistFAQs);
        setCurrentView(type);
    };

    // ================= RENDER UI BASED ON VIEW =================
    const renderContent = () => {

        // HOME SCREEN
        if (currentView === "home") {
            return (
                <div className="text-center p-5">
                    <h3 className="text-2xl font-semibold mb-2">
                        Welcome To TrackIn-Take 👋
                    </h3>
                    <h5 className="text-lg mb-5">Please choose a category</h5>

                    <div className="flex justify-center gap-3">
                        <button className="btn-orange" onClick={() => openSection("user")}>
                            User
                        </button>
                        <button className="btn-green" onClick={() => openSection("nutrition")}>
                            Nutritionist
                        </button>
                    </div>
                </div>
            );
        }

        // CATEGORY PAGE
        if (currentView === "user" || currentView === "nutrition") {
            const title = currentView === "user" ? "👤 User Page" : "🥗 Nutritionist Page";
            const data = currentView === "user" ? userFAQs : nutritionistFAQs;

            return (
                <div>
                    <div className="text-center p-3">
                        <h3 className="text-xl font-semibold text-orange-500">{title}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3">
                        {Object.keys(data).map(cat => (
                            <button
                                key={cat}
                                className="btn-category"
                                onClick={() => showQ(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        // QUESTIONS PAGE
        const faqs = activeData[currentView];

        return (
            <div className="p-3">
                <h3 className="text-center text-xl font-semibold mb-5">{currentView}</h3>

                {faqs.map((item, i) => (
                    <div key={i} className="mb-3">

                        {/* Question */}
                        <div
                            className="question-box"
                            onClick={() => getAnswer(item.q, i)}
                        >
                            {item.q}
                        </div>

                        {/* Answer */}
                        {selectedQuestion === i && (
                            <div className="answer-box">
                                {loading[i] ? (
                                    <div className="flex items-center gap-2">
                                        <div className="loader"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    answers[i]
                                )}
                            </div>
                        )}

                    </div>
                ))}
            </div>
        );
    };

    return (
        <div onClick={() => setMenuOpen(false)}>

            {/* CHAT ICON */}
            <div className="chat-icon" onClick={() => (open ? closeBot() : openBot())}>
                <img src="/icon.png" alt="Chat Icon" className="w-full h-full object-cover rounded-full" />
            </div>

            {/* CHAT BOX */}
            {open && (
                <div className="chat-box">

                    {/* HEADER */}
                    <div className="chat-header">
                        <span className="cursor-pointer px-2" onClick={goBack}>←</span>

                        <span className="font-semibold">TrackIn-Take Bot</span>

                        {/* MENU BUTTON */}
                        <span
                            className="cursor-pointer px-2"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent closing when clicking menu
                                setMenuOpen(!menuOpen);
                            }}
                        >
                            ☰
                        </span>

                        {/* DROPDOWN MENU */}
                        {menuOpen && (
                            <div
                                className="menu-dropdown"
                                onClick={(e) => e.stopPropagation()} // prevent closing
                            >
                                {Object.keys(menuData).map((item, i) => (
                                    <div key={i} className="border-b last:border-none">

                                        <div
                                            className="menu-item"
                                            onClick={() =>
                                                setActiveMenu(activeMenu === item ? null : item)
                                            }
                                        >
                                            {item}
                                            <span>{activeMenu === item ? "▼" : ">"}</span>
                                        </div>

                                        {activeMenu === item && (
                                            <div className="p-3 text-sm bg-gray-50">
                                                {menuData[item]}
                                            </div>
                                        )}

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CONTENT */}
                    <div className="chat-content">
                        {renderContent()}
                    </div>

                </div>
            )}
        </div>
    );
}