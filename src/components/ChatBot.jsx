
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import axiosInstance from "../api/axiosInstance";

// ================= MENU DATA =================
// Static menu content for dropdown
const menuData = {
    "About TrackIntake": "TrackIntake is an AI-powered nutrition and health tracking platform that helps you log your daily meals, monitor your nutrition, and receive personalized diet recommendations.",
    "Data & Security": "Your data is safe, secure, and never shared without your permission.",
    "Contact Us": "📞 7898622813"
};

// ================= USER FAQs =================
// ================= USER FAQs (ALL PATIENT FEATURES) =================
const userFAQs = {
    "How to Use": [
        { q: "How do I start using TrackIntake?" },
        { q: "What details are required in my health profile?" },
        { q: "Can I set dietary preferences like Veg, Vegan, or Non-Veg?" },
        { q: "Is TrackIntake suitable for weight loss and muscle building?" },
        { q: "How does TrackIntake help manage Diabetes, PCOS, or Hypertension?" }
    ],
    "Track Meals": [
        { q: "How do I log my meals using Indian portions (Katori, Bowl, Plate)?" },
        { q: "Can I log food by exact grams (g) or milliliters (ml)?" },
        { q: "How do I edit or delete a logged meal?" },
        { q: "How do I track my daily calories, protein, carbs, and fats?" },
        { q: "What should I do if I have remaining calories at the end of the day?" }
    ],
    "Diet Plans": [
        { q: "How do I access and follow my daily Diet Plan?" },
        { q: "Are diet plans customized by AI or my assigned Nutritionist?" },
        { q: "Can I automatically log planned diet meals into my food tracker?" },
        { q: "How do I request a custom diet plan from my nutritionist?" },
        { q: "Will the diet plan respect my allergies and food preferences?" }
    ],
    "Water Tracker": [
        { q: "How do I log my daily water intake?" },
        { q: "What is my recommended daily hydration target?" },
        { q: "Can I track my water hydration streak over the week?" },
        { q: "How do water reminders help me stay hydrated?" }
    ],
    "BMI & Body Fat": [
        { q: "How do I calculate my Body Mass Index (BMI)?" },
        { q: "What is the healthy BMI range for my height and weight?" },
        { q: "How does the US Navy Body Fat Calculator work?" },
        { q: "What measurements are needed for body fat calculation (waist, neck, hip)?" }
    ],
    "Weight Tracker": [
        { q: "How do I log my daily or weekly body weight?" },
        { q: "Can I see a progress graph of my weight loss or gain?" },
        { q: "How do I set and track my target goal weight?" },
        { q: "When is the best time of day to record my weight?" }
    ],
    "Custom Reminders": [
        { q: "How do I set up custom reminders for meals, water, and supplements?" },
        { q: "Can I set medication and vitamin alarm alerts?" },
        { q: "How do I edit or turn off scheduled reminders?" }
    ],
    "Health & Vitals": [
        { q: "How do I log and monitor my blood sugar (Fasting & Post-Prandial)?" },
        { q: "Can I track my blood pressure and resting heart rate?" },
        { q: "Does my assigned nutritionist see my blood glucose logs?" }
    ],
    "Lab Reports": [
        { q: "How do I upload diagnostic lab reports (PDF / image)?" },
        { q: "What lab test types are supported (CBC, Lipid, HbA1c, Thyroid)?" },
        { q: "Can my nutritionist review my lab reports and give advice?" }
    ],
    "Nutrition Search": [
        { q: "How do I search the database of 2000+ Indian and global foods?" },
        { q: "Where can I check the Glycemic Index (GI) of ingredients?" },
        { q: "How do I check calories, fiber, and micronutrients per 100g?" }
    ],
    "Appointments": [
        { q: "How do I book a consultation with a certified Nutritionist?" },
        { q: "Can I choose between online video calls and clinic visits?" },
        { q: "What payment options are available (Online Razorpay or Pay at Clinic)?" },
        { q: "Can I reschedule or cancel a booked appointment?" }
    ],
    "My Nutritionist & Chat": [
        { q: "How do I chat with my assigned Nutritionist?" },
        { q: "How quickly will my nutritionist reply to my food questions?" },
        { q: "Can I ask my nutritionist for food substitutions?" }
    ],
    "My Progress": [
        { q: "What insights are shown on my Progress and Reports page?" },
        { q: "How do I monitor my 7-day calorie adherence average?" },
        { q: "Can I export or share my health progress?" }
    ],
    "Help & Support": [
        { q: "How can I contact TrackIntake customer support?" },
        { q: "What should I do if I encounter a technical issue?" },
        { q: "How do I update my password or account details?" }
    ]
};

// ================= NUTRITIONIST FAQs =================
const nutritionistFAQs = {
    "How to Use": [
        { q: "How do I start using TrackIntake as a practitioner?" },
        { q: "What details should I complete on my professional profile?" },
        { q: "How does the practitioner dashboard help me monitor clients?" }
    ],
    "Add & Assign Patients": [
        { q: "How do I add or register a new patient manually?" },
        { q: "How do I bulk import multiple patients using an Excel template (.xlsx)?" },
        { q: "Where can I download the pre-filled patient Excel import template?" },
        { q: "How do I assign existing registered platform users to my practice?" },
        { q: "How does my patient capacity limit work, and how do I upgrade?" }
    ],
    "Patient Monitoring": [
        { q: "How do I view what my patients ate today and their macro intake?" },
        { q: "Can I review individual meal portion sizes (katoris, grams)?" },
        { q: "How do I switch active patients quickly inside Quick Tools?" },
        { q: "Can I track patient water intake and hydration consistency?" }
    ],
    "Diet Plans & AI": [
        { q: "How do I create and assign custom Indian diet plans?" },
        { q: "How do I review and approve AI-generated Diet Recommendations?" },
        { q: "Can I customize meal quantities, calories, and macro targets?" },
        { q: "How do I reuse and archive diet plan templates?" }
    ],
    "Lab Reports": [
        { q: "How do I view diagnostic lab reports uploaded by my patients?" },
        { q: "Can I add clinical notes to patient CBC, HbA1c, and lipid tests?" },
        { q: "How do patient lab reports integrate into diet recommendations?" }
    ],
    "Consultations & Chat": [
        { q: "How do I send direct messages to assigned patients?" },
        { q: "How do Quick Snippets help me send fast clinical guidance?" },
        { q: "Do patients receive instant notifications when I reply?" }
    ],
    "Availability & Slots": [
        { q: "How do I configure my available consultation days and hours?" },
        { q: "How do I customize appointment slot duration and buffer times?" },
        { q: "How do I enable 'Pay at Clinic' cash bookings for clients?" }
    ],
    "Food Database": [
        { q: "How do I search for foods and check glycemic values?" },
        { q: "Does the food database support regional Indian dishes and raw ingredients?" }
    ],
    "Earnings & Subscriptions": [
        { q: "How do I manage my practitioner subscription tier?" },
        { q: "What features unlock with upgraded practitioner plans?" },
        { q: "How can I increase my active patient capacity?" }
    ],
    "Help & Support": [
        { q: "What should I do if I face technical issues?" },
        { q: "How can I contact technical support or request a demo?" }
    ]
};

export default function Chatbot({ userRole }) {
    const { user } = useAuth();
    const effectiveRole = (user?.role || userRole || localStorage.getItem("userRole") || "user").toLowerCase();
    const isNutritionist = effectiveRole === "nutritionist";
    const defaultData = isNutritionist ? nutritionistFAQs : userFAQs;

    // ================= STATE MANAGEMENT =================
    const [open, setOpen] = useState(false); // chatbot open/close
    const [historyStack, setHistoryStack] = useState([]); // navigation history
    const [activeData, setActiveData] = useState(defaultData); // current FAQ dataset
    const [currentView, setCurrentView] = useState("categories"); // "categories" or category name
    const [answers, setAnswers] = useState({}); // API answers
    const [loading, setLoading] = useState({}); // loading state per question
    const [selectedQuestion, setSelectedQuestion] = useState(null); // selected question index
    const [menuOpen, setMenuOpen] = useState(false); // menu dropdown toggle
    const [activeMenu, setActiveMenu] = useState(null); // active menu item

    // Keep activeData in sync with detected role
    useEffect(() => {
        const data = isNutritionist ? nutritionistFAQs : userFAQs;
        setActiveData(data);
        setCurrentView("categories");
        setHistoryStack([]);
        setSelectedQuestion(null);
    }, [isNutritionist]);

    // ================= CHATBOT CONTROLS =================
    const closeBot = () => setOpen(false);

    const openBot = () => {
        setOpen(true);
        showHome();
    };

    const showHome = () => {
        setHistoryStack([]);
        setCurrentView("categories");
        setActiveData(isNutritionist ? nutritionistFAQs : userFAQs);
        setSelectedQuestion(null);
    };

    // ================= BACK NAVIGATION =================
    const goBack = () => {
        if (historyStack.length > 0) {
            const previousView = historyStack[historyStack.length - 1];
            setHistoryStack(historyStack.slice(0, -1));
            setCurrentView(previousView);
            setSelectedQuestion(null);
        } else {
            showHome();
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
            const res = await axiosInstance.post("/chat/", { question });
            setAnswers({ [index]: res.data?.answer || "No response received." });
        } catch (err) {
            console.warn("Primary chat endpoint error, trying fallback:", err);
            try {
                const resFallback = await fetch("/api/chat/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question })
                });
                const data = await resFallback.json();
                setAnswers({ [index]: data?.answer || "No response received." });
            } catch (fallbackErr) {
                console.error("Chatbot fallback error:", fallbackErr);
                setAnswers({ [index]: "⚠️ Unable to load answer at the moment. Please try again." });
            }
        }

        setLoading({ [index]: false });
    };

    // ================= RENDER UI BASED ON VIEW =================
    const renderContent = () => {
        // CATEGORIES VIEW (Never show role selection screen - strictly show patient or nutritionist)
        if (currentView === "categories" || currentView === "home" || currentView === "user" || currentView === "nutrition") {
            const title = isNutritionist ? "🥗 Nutritionist Knowledge Base" : "👤 Patient Guide & FAQs";
            const data = isNutritionist ? nutritionistFAQs : userFAQs;

            return (
                <div>
                    <div className="text-center p-3">
                        <h3 className="text-lg font-bold text-orange-500">{title}</h3>
                        <p className="text-xs text-gray-500 mt-1">Select a category to view answers</p>
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
                    <div className="chat-header" style={{ display: "flex", alignItems: "center" }}>
                        <span className="cursor-pointer px-2" onClick={goBack} style={{ flex: "0 0 auto" }}>
                            ←
                        </span>

                        <span className="font-semibold" style={{ flex: "1 1 auto", textAlign: "center" }}>
                            TrackIn-Take Bot
                        </span>

                        <span
                            className="chat-header-close cursor-pointer px-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                closeBot();
                            }}
                            aria-label="Close chatbot"
                            title="Close"
                            style={{ flex: "0 0 auto" }}
                        >
                            ✕
                        </span>

                        {/* MENU BUTTON */}
                        <span
                            className="cursor-pointer px-2"
                            onClick={(e) => {
                                e.stopPropagation(); // prevent closing when clicking menu
                                setMenuOpen(!menuOpen);
                            }}
                            style={{ flex: "0 0 auto" }}
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