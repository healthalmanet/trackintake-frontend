export function getPlanBenefits(plan) {
  if (!plan) return [];
  const benefits = [];

  // Nutritionist Practitioner Plan Benefits
  if (plan.plan_type === "nutritionist" || plan.nutri_ai_diet_allowed !== undefined) {
    if (plan.nutri_ai_diet_allowed) benefits.push("Smart AI Diet Formulation Assistant");
    if (plan.nutri_manual_diet_allowed) benefits.push("Custom Manual Diet Formulations");
    if (plan.nutri_bulk_upload_allowed) benefits.push("Bulk Patient CSV/Excel Import");
    if (plan.nutri_lab_reports_allowed) benefits.push("Lab Reports Tracking & Biomarkers");
    if (plan.nutri_chat_allowed) benefits.push("Direct Real-time Patient Messaging");
    if (plan.nutri_smart_assistant_allowed) benefits.push("Nutro Smart Calorie Assistant");
    if (plan.nutri_online_appointment_allowed) benefits.push("Online Video Consultations");
    if (plan.nutri_offline_appointment_allowed) benefits.push("In-Clinic Consultations");
    if (plan.nutri_export_reports_allowed) benefits.push("Diet Chart PDF & Advanced Analytics Export");
    if (plan.nutri_max_patients > 0) {
      benefits.push(`Up to ${plan.nutri_max_patients} Active Patients`);
    } else if (plan.nutri_max_patients === 0) {
      benefits.push("Unlimited Active Patients");
    }
    if (plan.duration_days) benefits.push(`${plan.duration_days} Days Validity`);
    return benefits;
  }

  // Patient / Member Plan Benefits
  if (plan.meal_log_allowed) benefits.push("Meal Logging & Macro Breakdown");
  if (plan.water_intake_allowed) benefits.push("Daily Water Intake Tracking");
  if (plan.weight_tracker_allowed) benefits.push("Weight & Body Metric Tracker");
  if (plan.custom_reminder_allowed) benefits.push("Custom Reminders & Push Alerts");
  if (plan.chat_allowed) benefits.push("Chat with Verified Nutritionists");
  if (plan.nutrition_search_allowed) benefits.push("AI Nutrition Database Search");
  if (plan.ai_diet_allowed) benefits.push("Personalized AI Diet Plans");
  if (plan.appointment_allowed) benefits.push("Practitioner Appointments");
  if (plan.BMI_Calculator_allowed) benefits.push("BMI & Body Composition Calculator");
  if (plan.Fat_Calculator_allowed) benefits.push("Body Fat & Calorie Calculator");
  if (plan.inhouse_consults > 0) {
    benefits.push(`${plan.inhouse_consults} In-house Consultations`);
  } else if (plan.appointment_allowed) {
    benefits.push("Unlimited In-house Consultations");
  }

  if (plan.expert_consults > 0) {
    benefits.push(`${plan.expert_consults} Expert Consultations`);
  } else if (plan.appointment_allowed) {
    benefits.push("Unlimited Expert Consultations");
  }
  if (plan.duration_days) benefits.push(`${plan.duration_days} Days Validity`);

  return benefits;
}