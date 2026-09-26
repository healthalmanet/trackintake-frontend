import React, { useState, useMemo } from "react";
import {
  Utensils,
  ClipboardList,
  Droplets,
  Activity,
  Bell,
  MessageSquare,
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  Salad,
  Sparkles,
  User,
  Compass,
  ChevronRight,
  ArrowLeft,
  Lightbulb,
  ExternalLink,
  Search,
  X,
  MessageCircle,
  Percent,
  TrendingDown,
  FileText,
  UserPlus,
  Scale,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Icon mapping helper
const ICON_MAP = {
  Utensils,
  ClipboardList,
  Droplets,
  Activity,
  Bell,
  MessageSquare,
  BookOpen,
  Users,
  ClipboardCheck,
  Calendar,
  Salad,
  Sparkles,
  User,
  MessageCircle,
  Percent,
  TrendingDown,
  FileText,
  UserPlus,
  Scale,
  HeartPulse,
};

const renderCategoryIcon = (iconName, size = 18) => {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;
  return <IconComponent size={size} />;
};

export const PATIENT_GUIDE = [
  {
    id: "log_meals",
    title: "Log Meals & Calorie Tracker",
    icon: "Utensils",
    color: "amber",
    description: "Track breakfast, lunch, dinner & snacks using standard Indian household units or exact grams.",
    topics: [
      {
        id: "how_to_log_katori",
        question: "How do I log meals using standard portions (Katori, Bowl, Plate)?",
        summary: "Log your daily meals in seconds without weighing food on a scale by using intuitive Indian measures.",
        steps: [
          "Open the **Meal Logger** from your dashboard or sidebar.",
          "Select the meal type: **Breakfast**, **Lunch**, **Dinner**, or **Snacks**.",
          "Type the food name in the search bar (e.g. 'Dal Tadka', 'Roti', 'Paneer Sabzi', 'Poha').",
          "Select the household portion unit: **1 Katori (approx 150g)**, **1 Plate (approx 350g)**, or **Number of Rotis**.",
          "Click **'Log Meal'**. The calories, carbs, protein, and fats are automatically added to your daily intake."
        ],
        tip: "Pro Tip: If you eat 2 rotis with 1 katori dal, log roti as '2 Piece' and dal as '1 Katori' for the most accurate macro tracking.",
        actionLabel: "Open Meal Logger",
        actionRoute: "/dashboard/tools/meal-log"
      },
      {
        id: "how_to_log_grams",
        question: "How do I log food by exact grams (g) or milliliters (ml)?",
        summary: "For precision tracking, enter the exact gram or ml weight of your food items.",
        steps: [
          "Navigate to **Meal Logger**.",
          "Search and pick your food item from our verified database.",
          "Switch the portion unit selector to **Grams (g)** or **Milliliters (ml)**.",
          "Enter your custom quantity (e.g. '120g' boiled rice or '250ml' cow milk).",
          "Click **'Log Meal'** to record your meal with calibrated nutritional precision."
        ],
        tip: "Raw vs Cooked: Choose 'Cooked Rice' or 'Raw Rice' specifically to ensure calorie accuracy.",
        actionLabel: "Open Meal Logger",
        actionRoute: "/dashboard/tools/meal-log"
      },
      {
        id: "how_to_edit_delete_meal",
        question: "How can I edit, modify, or delete a logged meal?",
        summary: "Fix mistakes or change portions on any meal logged today or on past dates.",
        steps: [
          "Go to your **Dashboard** or **Meal Logger**.",
          "Scroll to the meal entry list under the selected date.",
          "Click the **Edit (Pencil)** icon to change the quantity or portion unit, then save.",
          "Click the **Delete (Trash)** icon to remove an entry if logged accidentally.",
          "Your daily calorie bar and macro breakdown will instantly re-calculate."
        ],
        actionLabel: "View Logged Meals",
        actionRoute: "/dashboard/tools/meal-log"
      },
      {
        id: "how_to_view_macros",
        question: "How do I view my daily protein, carbs, fats, and calorie budget?",
        summary: "Monitor your macro balance against your target health goals.",
        steps: [
          "Visit your main **Dashboard**.",
          "Look at the top **Calorie & Macro Rings** (Calories Remaining, Protein, Carbohydrates, Healthy Fats).",
          "Hover or tap any nutrient ring to see grams consumed vs remaining daily allowance.",
          "Check the **Food Suggestions** drawer at the bottom if you have calories remaining to hit your goals."
        ],
        actionLabel: "Go to Dashboard",
        actionRoute: "/dashboard"
      }
    ]
  },
  {
    id: "diet_plans",
    title: "Diet Plans (AI & Nutritionist)",
    icon: "ClipboardList",
    color: "emerald",
    description: "Access personalized 3-day and 15-day meal plans tailored to your health goals.",
    topics: [
      {
        id: "view_diet_plan",
        question: "How do I view and follow my Diet Plan?",
        summary: "Access your clinical meal plans created by AI or assigned by your nutritionist.",
        steps: [
          "Click on **Diet Plans** in the dashboard sidebar or visit `/dashboard/meals`.",
          "Browse between **Breakfast**, **Mid-Morning**, **Lunch**, **Evening Snack**, and **Dinner** sections.",
          "Check the recommended ingredients, calorie counts, and preparation suggestions.",
          "Click **'Log this Diet Meal'** to automatically import planned items into today's log without manual typing."
        ],
        tip: "Diet plans adapt to your vegetarian, vegan, or non-veg food preferences selected during onboarding.",
        actionLabel: "Open Diet Plans",
        actionRoute: "/dashboard/meals"
      },
      {
        id: "request_nutritionist_plan",
        question: "How do I get a custom diet plan from my assigned Nutritionist?",
        summary: "Get tailored dietary adjustments for medical conditions like Diabetes, PCOS, or Hypertension.",
        steps: [
          "Ensure you have an assigned clinical nutritionist on your account.",
          "Open the **Messages** tab in Quick Tools or navigate to **Chat with Nutritionist**.",
          "Send your recent blood work, allergies, or specific target weight goals.",
          "Your nutritionist will review your meal logs and publish an updated dietary protocol directly to your Diet Plan tab."
        ],
        actionLabel: "Message Nutritionist",
        actionRoute: "/dashboard/messages"
      }
    ]
  },
  {
    id: "water_tracker",
    title: "Water Intake & Hydration",
    icon: "Droplets",
    color: "blue",
    description: "Track daily water consumption, log glasses, and stay hydrated.",
    topics: [
      {
        id: "how_to_log_water",
        question: "How do I log my daily water intake?",
        summary: "Record water throughout the day with single-tap quick buttons.",
        steps: [
          "Open the **Water Tracker** from the dashboard or tools menu (`/dashboard/tools/water-tracker`).",
          "Click **'+1 Glass (250 ml)'** or **'+1 Bottle (500 ml)'** whenever you drink water.",
          "Watch your water progress cylinder fill towards your daily target (recommended 2.5L–3.5L).",
          "Review your 7-day hydration streak to build consistent hydration habits."
        ],
        actionLabel: "Open Water Tracker",
        actionRoute: "/dashboard/tools/water-tracker"
      }
    ]
  },
  {
    id: "bmi_calculator",
    title: "BMI Calculator & Healthy Weight",
    icon: "Activity",
    color: "rose",
    description: "Calculate your Body Mass Index and find your ideal healthy weight range.",
    topics: [
      {
        id: "calculate_bmi",
        question: "How do I calculate and track my BMI?",
        summary: "Understand your Body Mass Index and healthy weight category.",
        steps: [
          "Go to **BMI Calculator** under Dashboard Tools (`/dashboard/tools/bmi`).",
          "Enter your height (in centimeters or feet/inches) and weight (kg or lbs).",
          "Click **'Calculate BMI'**.",
          "View your classification: Underweight (<18.5), Normal (18.5–24.9), Overweight (25–29.9), or Obese (30+).",
          "Review your clinical ideal weight range calculated specifically for your body frame."
        ],
        actionLabel: "Open BMI Calculator",
        actionRoute: "/dashboard/tools/bmi"
      }
    ]
  },
  {
    id: "fat_calculator",
    title: "Body Fat Calculator (US Navy)",
    icon: "Percent",
    color: "amber",
    description: "Estimate body fat percentage and lean muscle mass using circumference measurements.",
    topics: [
      {
        id: "calculate_body_fat",
        question: "How do I calculate my body fat percentage?",
        summary: "Use tape measurements (waist, neck, hip) to estimate lean body mass vs fat mass.",
        steps: [
          "Navigate to **Body Fat Calculator** (`/dashboard/tools/fat-calculator`).",
          "Select your gender and enter your height and current weight.",
          "Enter your **Neck Circumference** (just below the larynx).",
          "Enter your **Waist Circumference** (at the narrowest point or navel).",
          "If female, also enter **Hip Circumference** (at the widest point).",
          "Click **'Calculate Body Fat'** to see your fat percentage, fat mass in kg, and lean tissue mass."
        ],
        tip: "Take measurements in the morning before eating for the most consistent weekly comparisons.",
        actionLabel: "Open Fat Calculator",
        actionRoute: "/dashboard/tools/fat-calculator"
      }
    ]
  },
  {
    id: "weight_tracker",
    title: "Weight Tracker & Goal Trajectory",
    icon: "TrendingDown",
    color: "emerald",
    description: "Log your weight history, visualize progress curves, and track goal pacing.",
    topics: [
      {
        id: "track_weight_logs",
        question: "How do I log my weight and track loss or gain over time?",
        summary: "Record weigh-ins and visualize progress toward your target weight.",
        steps: [
          "Open **Weight Tracker** under Tools (`/dashboard/tools/weight-tracker`).",
          "Enter your latest weight reading and select the date.",
          "Click **'Log Weight'** to save the entry.",
          "Inspect the interactive weight trend line to see average weekly changes.",
          "Compare your current weight against your initial starting weight and final target goal."
        ],
        actionLabel: "Open Weight Tracker",
        actionRoute: "/dashboard/tools/weight-tracker"
      }
    ]
  },
  {
    id: "custom_reminders",
    title: "Custom Reminders & Notification Alarms",
    icon: "Bell",
    color: "purple",
    description: "Set personalized notification alarms for meals, water, supplements, and weigh-ins.",
    topics: [
      {
        id: "setup_custom_reminders",
        question: "How do I set up custom reminders for meals, water, and supplements?",
        summary: "Never miss breakfast, lunch, or evening supplements with automated reminders.",
        steps: [
          "Go to **Custom Reminders** under Dashboard Tools (`/dashboard/tools/custom-reminder`).",
          "Click **'Add New Reminder'**.",
          "Choose your reminder category: **Meal Timing**, **Water Intake**, **Supplements / Medications**, or **Weigh-In**.",
          "Set the time of day and repeating days (Daily, Weekdays, Weekends).",
          "Save the reminder. You will receive in-app and browser notifications right on schedule."
        ],
        actionLabel: "Open Reminders",
        actionRoute: "/dashboard/tools/custom-reminder"
      }
    ]
  },
  {
    id: "health_vitals",
    title: "Health Dashboard & Diabetes Vitals",
    icon: "HeartPulse",
    color: "rose",
    description: "Monitor blood glucose levels (Fasting & PP), blood pressure, and vital health metrics.",
    topics: [
      {
        id: "track_blood_glucose",
        question: "How do I monitor blood sugar, diabetes markers, and health vitals?",
        summary: "Keep a digital log of Fasting and Post-Prandial sugar to share with your nutritionist.",
        steps: [
          "Navigate to **Health Dashboard** in the navigation bar (`/dashboard/health-dashboard`).",
          "Log your **Fasting Blood Sugar (mg/dL)** and **Post-Prandial (2 hours after meal)** readings.",
          "Record your **Blood Pressure (Systolic / Diastolic)** and resting heart rate.",
          "Your assigned nutritionist reviews these readings to fine-tune your glycemic meal recommendations."
        ],
        actionLabel: "Open Health Dashboard",
        actionRoute: "/dashboard/health-dashboard"
      }
    ]
  },
  {
    id: "lab_reports",
    title: "Lab Reports & Diagnostic Test Uploads",
    icon: "FileText",
    color: "blue",
    description: "Upload blood tests, lipid profiles, and HbA1c reports to share with your nutritionist.",
    topics: [
      {
        id: "upload_lab_report",
        question: "How do I upload and share lab test reports?",
        summary: "Store medical reports digitally and allow your dietitian to analyze health markers.",
        steps: [
          "Go to **Lab Reports** in your dashboard navigation (`/dashboard/lab-reports`).",
          "Click **'Add Report'** (`/dashboard/add-report`).",
          "Select the test type (Complete Blood Count, Lipid Profile, Thyroid TSH, HbA1c, Vitamin D/B12).",
          "Upload your PDF or image report and enter the test date.",
          "Click **'Save Report'**. Your clinical nutritionist is notified and can review it immediately."
        ],
        actionLabel: "Upload Lab Report",
        actionRoute: "/dashboard/add-report"
      }
    ]
  },
  {
    id: "nutrition_search",
    title: "Nutrition Search & Indian Food Database",
    icon: "Salad",
    color: "emerald",
    description: "Instant nutrition lookup for 2000+ Indian foods, GI values, and micronutrients.",
    topics: [
      {
        id: "search_food_nutrients",
        question: "How do I search food items to check calories, protein, and Glycemic Index?",
        summary: "Search raw ingredients, cooked dishes, snacks, and fruits with clinical nutrient data.",
        steps: [
          "Open **Nutrition Search** in Quick Tools or via `/dashboard/tools/nutrition-search`.",
          "Type any food name (e.g. 'Soya Chunks', 'Paneer', 'Brown Rice', 'Moong Dal').",
          "Inspect the **Calories, Protein, Carbs, Fats, and Fiber** per 100g or per serving.",
          "Check the **Glycemic Index (GI)** rating to make diabetic-friendly food choices."
        ],
        actionLabel: "Open Nutrition Search",
        actionRoute: "/dashboard/tools/nutrition-search"
      }
    ]
  },
  {
    id: "appointments",
    title: "Book Nutritionist Consultations",
    icon: "Calendar",
    color: "purple",
    description: "Schedule in-person clinic visits or online video consultations with certified dietitians.",
    topics: [
      {
        id: "book_appointment_slot",
        question: "How do I book an appointment with a verified Nutritionist?",
        summary: "Browse available consultation slots and confirm your booking online or pay at clinic.",
        steps: [
          "Click on **Appointments** in the navigation bar (`/dashboard/appointments`).",
          "Select your preferred consultation format: **Online Video Consultation** or **In-Person Clinic Visit**.",
          "Pick an available date and time slot from the nutritionist's schedule.",
          "Choose your payment method: Pay online securely via Razorpay or choose **'Pay at Clinic'** with cash.",
          "Receive instant appointment confirmation and reminders."
        ],
        actionLabel: "Book Appointment",
        actionRoute: "/dashboard/appointments"
      }
    ]
  },
  {
    id: "consultation",
    title: "Chat & Messages with Nutritionist",
    icon: "MessageSquare",
    color: "teal",
    description: "Chat with your verified clinical dietitian, share food queries, and get feedback.",
    topics: [
      {
        id: "chat_with_dietitian",
        question: "How do I communicate with my assigned Nutritionist?",
        summary: "Send messages, ask about food substitutions, and review progress with your dietitian.",
        steps: [
          "Open the **Quick Tools** icon on the bottom right and click **'Chat with Nutritionist'**.",
          "Or navigate to **Messages** in your dashboard sidebar (`/dashboard/messages`).",
          "Type your question (e.g. 'Can I replace paneer with tofu today?') and hit send.",
          "Your dietitian will receive real-time alerts and reply directly."
        ],
        actionLabel: "Open Chat",
        actionRoute: "/dashboard/messages"
      }
    ]
  },
  {
    id: "blogs",
    title: "Health Blogs & Articles",
    icon: "BookOpen",
    color: "indigo",
    description: "Explore evidence-based nutrition science, recipes, and clinical advice.",
    topics: [
      {
        id: "read_blogs",
        question: "How do I read articles and dietary guides?",
        summary: "Browse curated wellness guides written by certified nutrition specialists.",
        steps: [
          "Click on **Blogs** in the navigation bar or visit `/blogs-section`.",
          "Explore topics including Type-2 Diabetes management, PCOS nutrition, gut health, and protein guides.",
          "Click any article to read the full deep-dive.",
          "Use the **'Back to Articles'** button to easily return to the article catalog."
        ],
        actionLabel: "Browse Blogs",
        actionRoute: "/blogs-section"
      }
    ]
  },
  {
    id: "progress_reports",
    title: "Progress Reports & Analytics",
    icon: "Activity",
    color: "amber",
    description: "Review weekly calorie adherence, macro trends, and long-term milestones.",
    topics: [
      {
        id: "view_progress_reports",
        question: "How do I view my weekly progress reports and analytics?",
        summary: "Inspect graphical summaries of calorie adherence, macro consistency, and weight changes.",
        steps: [
          "Click **Progress / Reports** in your dashboard navigation (`/dashboard/reports`).",
          "Review your **7-Day Calorie Average** compared to your daily target budget.",
          "Inspect your **Macro Distribution** (Protein vs Carbs vs Fats ratio).",
          "Check your logging consistency streak to stay motivated."
        ],
        actionLabel: "Open Reports",
        actionRoute: "/dashboard/reports"
      }
    ]
  },
  {
    id: "user_profile",
    title: "Profile, Goals & Dietary Preferences",
    icon: "User",
    color: "emerald",
    description: "Update your target weight, dietary lifestyle (Veg/Vegan/Non-Veg), and medical conditions.",
    topics: [
      {
        id: "update_health_profile",
        question: "How do I update my dietary preferences and target goals?",
        summary: "Ensure diet plans and calorie budgets accurately match your lifestyle and health needs.",
        steps: [
          "Click on your profile avatar in the top right and select **Profile** (`/dashboard/user-profile`).",
          "Select your **Dietary Preference**: Vegetarian, Eggetarian, Vegan, or Non-Vegetarian.",
          "Set your primary **Health Goal**: Weight Loss, Muscle Building, Maintenance, Diabetes Control, or PCOS.",
          "Save changes. All AI meal recommendations and calorie targets instantly adapt to your updated preferences."
        ],
        actionLabel: "Edit Profile",
        actionRoute: "/dashboard/user-profile"
      }
    ]
  }
];

export const NUTRITIONIST_GUIDE = [
  {
    id: "patient_management",
    title: "Patient Management, Assignment & Registration",
    icon: "Users",
    color: "blue",
    description: "Add new patients, bulk import via Excel, assign clients, and monitor daily food logs.",
    topics: [
      {
        id: "create_patient_manual",
        question: "How do I add or register a new patient to my clinical practice?",
        summary: "Directly create a patient account that is automatically assigned to your practice.",
        steps: [
          "On the **Nutritionist Dashboard** (`/nutritionist`), click the **'Add Patient'** button.",
          "Enter the patient's **Full Name**, **Email Address**, and **Phone Number**.",
          "Select their **Age**, **Gender**, and **Dietary Preference** (Vegetarian, Vegan, Non-Veg).",
          "Set their primary **Health Goal** (Weight Loss, Diabetes Management, Muscle Gain).",
          "Click **'Save & Assign Patient'**. The patient account is created instantly and assigned to your roster!"
        ],
        tip: "The patient can now log in using their email, and all their meals and health logs will automatically flow into your dashboard.",
        actionLabel: "Open Patients Dashboard",
        actionRoute: "/nutritionist"
      },
      {
        id: "bulk_upload_patients",
        question: "How do I bulk import multiple patients using Excel (.xlsx)?",
        summary: "Onboard dozens of clinic clients at once with our verified Excel import template.",
        steps: [
          "On the **Nutritionist Dashboard**, click the **'Bulk Upload'** button.",
          "Click **'Download Template (.xlsx)'** to get the spreadsheet containing pre-filled headers and 10 realistic sample patient records.",
          "Fill in your clinic's patient roster with Name, Email, Phone, Age, Gender, and Goals.",
          "Upload your completed `.xlsx` file into the upload dropzone and click **'Import Patients'**.",
          "The system automatically validates each row, creates the accounts, and assigns all patients to you."
        ],
        tip: "Note: Bulk upload requires an active practitioner subscription with the Bulk Upload feature enabled.",
        actionLabel: "Go to Dashboard",
        actionRoute: "/nutritionist"
      },
      {
        id: "assign_existing_patient",
        question: "How do I assign an existing platform patient to my practice?",
        summary: "Assign registered platform users directly to your care.",
        steps: [
          "On your **Nutritionist Dashboard**, use the patient search bar to locate the user by name or email.",
          "If the patient is unassigned, click **'Assign to Practice'**.",
          "The patient will immediately appear in your assigned patient roster, unlocking their food logs and chat."
        ],
        actionLabel: "Open Patients Dashboard",
        actionRoute: "/nutritionist"
      },
      {
        id: "check_patient_capacity",
        question: "How do patient capacity and subscription limits work?",
        summary: "Understand your practice's active assigned patient limit.",
        steps: [
          "Your practitioner subscription tier defines your maximum active patient capacity.",
          "You can view your active patient count vs total limit right on your dashboard header.",
          "If you reach your capacity limit, simply upgrade your practitioner plan in `/nutritionist/subscription` to unlock additional patient slots."
        ],
        actionLabel: "View Subscriptions",
        actionRoute: "/nutritionist/subscription"
      },
      {
        id: "view_patient_logs",
        question: "How do I monitor patient food logs and daily macros?",
        summary: "Inspect what your patient ate today, their total calories, protein, and water.",
        steps: [
          "On the **Nutritionist Dashboard**, find your patient in the assigned patients list.",
          "Click on the patient card to open their detailed **Patient Profile**.",
          "Review their daily macro breakdown (Calories, Carbs, Protein, Fats).",
          "Inspect individual meals (Breakfast, Lunch, Dinner) and exact portion sizes logged by the patient."
        ],
        actionLabel: "Open Patients Dashboard",
        actionRoute: "/nutritionist"
      },
      {
        id: "switch_patient_quicktools",
        question: "How do I switch active patients inside Quick Tools?",
        summary: "Communicate with different patients rapidly without leaving your current screen.",
        steps: [
          "Open **Quick Tools** at the bottom-right and select **'Patient Messages'**.",
          "At the top of the chat panel, click the patient selector dropdown.",
          "Search for a patient by name or email, or pick one from the list.",
          "The chat history and patient details switch instantly."
        ],
        actionLabel: "Open Quick Tools",
        actionRoute: null
      }
    ]
  },
  {
    id: "diet_plan_creation",
    title: "Diet Plan Creation & AI Recommendations",
    icon: "ClipboardCheck",
    color: "emerald",
    description: "Design custom Indian clinical diets, set macros, and review AI meal suggestions.",
    topics: [
      {
        id: "create_diet_plan",
        question: "How do I create and assign a customized diet plan to a patient?",
        summary: "Construct structured meal protocols with tailored calorie goals.",
        steps: [
          "Navigate to the patient's profile from your dashboard.",
          "Select the **Diet Plans** tab and click **'Create Diet Plan'**.",
          "Specify the target daily calorie limit (e.g., 1800 kcal) and macro split.",
          "Add meals for each time slot (Breakfast, Mid-Morning, Lunch, Evening Snack, Dinner) using our database of 2000+ Indian food items.",
          "Click **'Publish / Assign Plan'**. The patient will immediately see their new plan on their dashboard."
        ],
        actionLabel: "Go to Dashboard",
        actionRoute: "/nutritionist"
      },
      {
        id: "ai_diet_recommendations",
        question: "How do I review and approve AI Diet Plan Recommendations?",
        summary: "Save hours of planning by having AI formulate tailored meals that you can approve or tweak.",
        steps: [
          "Open the **Diet Recommendations** tab on your practitioner dashboard.",
          "Inspect the AI-generated meal plan created based on the patient's biometric data, goals, and calories.",
          "Edit any food items or portion sizes to match your clinical recommendations.",
          "Click **'Approve & Assign'** to deliver the finalized plan to the patient."
        ],
        actionLabel: "Open Diet Recommendations",
        actionRoute: "/nutritionist"
      },
      {
        id: "reuse_archive_plans",
        question: "How can I reuse, edit, or archive existing diet plans?",
        summary: "Save time by template-based diet planning for recurring patient profiles.",
        steps: [
          "Open the patient's **Diet Plan** section.",
          "Click **'Edit Plan'** to tweak items, portion quantities, or clinical remarks.",
          "To de-activate or retire an outdated plan, click the **'Archive'** button.",
          "Archived plans can be restored anytime from the archive history."
        ],
        actionLabel: "Manage Plans",
        actionRoute: "/nutritionist"
      }
    ]
  },
  {
    id: "lab_reports_management",
    title: "Patient Lab Reports & Diagnostics",
    icon: "FileText",
    color: "blue",
    description: "Review patient blood tests, lipid profiles, HbA1c, and add clinical notes.",
    topics: [
      {
        id: "manage_patient_lab_reports",
        question: "How do I view and evaluate patient lab reports?",
        summary: "Access uploaded diagnostic reports (CBC, HbA1c, lipid profile, thyroid) for any assigned patient.",
        steps: [
          "Open the patient's profile from your **Nutritionist Dashboard**.",
          "Click on the **'Lab Reports'** tab.",
          "View uploaded report files (PDF or images) and test dates.",
          "Click **'Add Clinical Note'** to write remarks on cholesterol, blood sugar, or vitamin deficiencies.",
          "Adjust the patient's daily macro targets and diet plan based on their lab findings."
        ],
        actionLabel: "Open Dashboard",
        actionRoute: "/nutritionist"
      }
    ]
  },
  {
    id: "consultation_chat",
    title: "Patient Messaging & Clinical Snippets",
    icon: "MessageCircle",
    color: "teal",
    description: "Communicate with patients, provide quick guidance, and send one-click clinical notes.",
    topics: [
      {
        id: "send_messages",
        question: "How do I message my patients and send dietary guidance?",
        summary: "Real-time bidirectional chat with assigned patients.",
        steps: [
          "Open **Quick Tools** -> **'Patient Messages'** or navigate to `/nutritionist/chat`.",
          "Select the patient you wish to message.",
          "Type your clinical feedback or click one of the **Quick Snippet** buttons (e.g., 'Please log your meals today', 'Maintain 2.5L water intake').",
          "Press **Send**. The patient receives instant push & in-app notifications."
        ],
        actionLabel: "Open Chat Center",
        actionRoute: "/nutritionist/chat"
      }
    ]
  },
  {
    id: "availability_scheduling",
    title: "Availability Hours & Consultation Slots",
    icon: "Calendar",
    color: "purple",
    description: "Configure working days, time slots, buffer times, and Pay at Clinic options.",
    topics: [
      {
        id: "set_availability",
        question: "How do I configure my available consultation hours?",
        summary: "Set weekly consultation schedule so patients can only book when you are free.",
        steps: [
          "Click **Availability** in the top navigation bar (`/nutritionist/availability`).",
          "Toggle working days (e.g., Monday to Saturday).",
          "Set daily start time (e.g., 09:00 AM) and end time (e.g., 06:00 PM).",
          "Specify slot duration (30 mins or 45 mins) and buffer intervals between sessions.",
          "Enable or disable **'Pay at Clinic'** so patients can book cash offline slots without online payment.",
          "Click **'Save Availability'**."
        ],
        actionLabel: "Set Availability",
        actionRoute: "/nutritionist/availability"
      }
    ]
  },
  {
    id: "food_database",
    title: "Food Database & Nutrition Search",
    icon: "Salad",
    color: "amber",
    description: "Look up verified macro profiles, glycemic indices, and portion conversions.",
    topics: [
      {
        id: "search_food_items",
        question: "How do I search food items and analyze nutritional values?",
        summary: "Explore 2000+ Indian foods with calories, protein, carbs, fats, and fiber.",
        steps: [
          "Open **Nutrition Search** from the navbar or inside Quick Tools.",
          "Type any Indian or international food item (e.g., 'Moong Dal Khichdi', 'Soya Chunks', 'Paneer Bhurji').",
          "View exact nutritional values per 100g, per katori, or per serving.",
          "Check fiber content and macronutrient distribution to advise patients on glycemic management."
        ],
        actionLabel: "Open Nutrition Search",
        actionRoute: "/nutritionist/search"
      }
    ]
  },
  {
    id: "subscriptions_tiers",
    title: "Subscriptions & Practitioner Tier",
    icon: "Sparkles",
    color: "rose",
    description: "Manage your practitioner subscription tier, billing, and patient limits.",
    topics: [
      {
        id: "upgrade_subscription",
        question: "How do I manage my practitioner subscription and features?",
        summary: "Access unlimited patient capacity, AI co-pilot tools, and priority analytics.",
        steps: [
          "Click **Subscription** in the top navigation bar (`/nutritionist/subscription`).",
          "View your active plan, expiration date, and included features (Higher Patient Limits, Bulk Upload, AI Plan Generator).",
          "Choose a plan upgrade to unlock higher patient capacities or renewed billing."
        ],
        actionLabel: "View Subscriptions",
        actionRoute: "/nutritionist/subscription"
      }
    ]
  },
  {
    id: "profile_settings",
    title: "Profile, Bio & Clinical Credentials",
    icon: "User",
    color: "indigo",
    description: "Update your medical qualifications, clinic details, bio, and profile photo.",
    topics: [
      {
        id: "edit_profile",
        question: "How do I update my profile, credentials, and bio?",
        summary: "Ensure patients see your verified credentials, degrees, and consultation fees.",
        steps: [
          "Navigate to **Profile** in the top navbar (`/nutritionist/profile`).",
          "Update your Full Name, Qualifications (e.g. M.Sc Clinical Nutrition, RD), and Years of Experience.",
          "Upload a professional profile picture and write your clinical philosophy in the Bio.",
          "Save changes to update your public patient-facing profile."
        ],
        actionLabel: "Edit Profile",
        actionRoute: "/nutritionist/profile"
      }
    ]
  }
];

export const InteractiveAppGuide = ({
  userRole = "user",
  onNavigate,
  onAskAI,
}) => {
  const { user } = useAuth();
  const effectiveRole = (user?.role ? user.role : userRole || "user").toLowerCase();
  const isNutritionist = effectiveRole === "nutritionist";
  const activeCategories = isNutritionist ? NUTRITIONIST_GUIDE : PATIENT_GUIDE;
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategory = useMemo(() => {
    return activeCategories.find((c) => c.id === selectedCategoryId) || null;
  }, [activeCategories, selectedCategoryId]);

  const selectedTopic = useMemo(() => {
    if (!selectedCategory) return null;
    return selectedCategory.topics.find((t) => t.id === selectedTopicId) || null;
  }, [selectedCategory, selectedTopicId]);

  // Search filtering
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return activeCategories;
    const query = searchQuery.toLowerCase();
    return activeCategories
      .map((cat) => {
        const matchesCat =
          cat.title.toLowerCase().includes(query) ||
          cat.description.toLowerCase().includes(query);
        const matchingTopics = cat.topics.filter(
          (t) =>
            t.question.toLowerCase().includes(query) ||
            t.summary.toLowerCase().includes(query)
        );
        if (matchesCat || matchingTopics.length > 0) {
          return {
            ...cat,
            topics: matchingTopics.length > 0 ? matchingTopics : cat.topics,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [activeCategories, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-app)]">
      {/* Header Bar */}
      <div className="p-2.5 sm:p-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {selectedCategory ? (
            <button
              type="button"
              onClick={() => {
                if (selectedTopicId) {
                  setSelectedTopicId(null);
                } else {
                  setSelectedCategoryId(null);
                }
              }}
              className="p-1 rounded-lg hover:bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 shrink-0">
              <Compass size={16} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-[var(--color-text-strong)] truncate">
              {selectedTopic
                ? selectedTopic.question
                : selectedCategory
                ? selectedCategory.title
                : isNutritionist
                ? "Nutritionist Feature Guide"
                : "Patient Feature Guide"}
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] truncate">
              {selectedTopic
                ? "Step-by-Step Instructions"
                : selectedCategory
                ? `${selectedCategory.topics.length} guided tutorials`
                : isNutritionist
                ? "Learn practitioner features & clinical workflows"
                : "Learn how to use all features of TrackIntake"}
            </p>
          </div>
        </div>

        {/* Current Role Badge */}
        {!selectedCategory && (
          <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-default)] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl shrink-0 hidden xs:inline-block sm:inline-block">
            {isNutritionist ? "Nutritionist Guide" : "Patient Guide"}
          </span>
        )}
      </div>

      {/* Search Input (only on root view) */}
      {!selectedCategory && (
        <div className="p-2.5 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)]">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features (e.g. log meal, diet plan, water)..."
              className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-default)] pl-8 pr-7 py-1.5 rounded-xl text-xs text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTENT BODY */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
        {/* LEVEL 1: CATEGORY SELECTION */}
        {!selectedCategory && (
          <>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <HelpCircle size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-[var(--color-text-strong)]">
                  No features found
                </p>
                <p className="text-[11px] mt-0.5">
                  Try searching for 'meal', 'water', 'diet', or 'appointment'.
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="p-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-2xl cursor-pointer transition-all duration-150 group shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0 group-hover:scale-105 transition-transform">
                      {renderCategoryIcon(category.icon, 18)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                          {category.title}
                        </h4>
                        <ChevronRight
                          size={14}
                          className="text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform flex-shrink-0"
                        />
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                        {category.description}
                      </p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] px-2 py-0.5 rounded-full">
                        {category.topics.length} Guides Available
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* LEVEL 2: TOPIC SELECTION */}
        {selectedCategory && !selectedTopic && (
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex-shrink-0">
                {renderCategoryIcon(selectedCategory.icon, 20)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text-strong)]">
                  {selectedCategory.title}
                </h4>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Select a topic below to see exact steps:
                </p>
              </div>
            </div>

            {selectedCategory.topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className="p-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-2xl cursor-pointer transition-all duration-150 group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                      {topic.question}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1 line-clamp-2">
                      {topic.summary}
                    </p>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform flex-shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEVEL 3: STEP-BY-STEP RESULT WALKTHROUGH */}
        {selectedTopic && (
          <div className="space-y-3 pb-2">
            {/* Summary Box */}
            <div className="p-3 bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-hover)] rounded-2xl flex items-start gap-2.5">
              <Lightbulb
                size={16}
                className="text-[var(--color-primary)] flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-[var(--color-text-strong)] font-medium leading-relaxed">
                {selectedTopic.summary}
              </p>
            </div>

            {/* Steps List */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
              <h4 className="text-xs font-bold text-[var(--color-text-strong)] uppercase tracking-wider mb-3">
                Step-by-Step Instructions:
              </h4>
              <div className="space-y-2.5">
                {selectedTopic.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[var(--color-text-default)] leading-relaxed">
                      {step.split("**").map((part, i) =>
                        i % 2 === 1 ? (
                          <strong
                            key={i}
                            className="font-bold text-[var(--color-text-strong)]"
                          >
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tip Box if available */}
              {selectedTopic.tip && (
                <div className="mt-3.5 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  {selectedTopic.tip}
                </div>
              )}
            </div>

            {/* Direct Action Link */}
            {selectedTopic.actionRoute && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(selectedTopic.actionRoute)}
                className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{selectedTopic.actionLabel || "Try This Feature Now"}</span>
                <ExternalLink size={13} />
              </button>
            )}

            {/* Ask AI Assistant Followup */}
            {onAskAI && (
              <button
                type="button"
                onClick={() => onAskAI(`Tell me more about: ${selectedTopic.question}`)}
                className="w-full py-2 px-3 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] text-[var(--color-text-strong)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Ask AI Bot for More Details</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveAppGuide;
