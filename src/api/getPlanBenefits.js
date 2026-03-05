// src/api/planBenefits.js

export function getPlanBenefits(plan) {
  const benefits = [];

  // 🧠 AI Diet
  if (plan.ai_diet_allowed) {
    benefits.push("AI-powered diet plans");
  }

  // 📅 Appointments
  if (plan.appointment_allowed) {
    benefits.push("Doctor appointments enabled");
  }

  // 🏥 In-house consultations
  if (plan.inhouse_consults > 0) {
    benefits.push(
      `${plan.inhouse_consults} in-house doctor consultation${
        plan.inhouse_consults > 1 ? "s" : ""
      }`
    );
  }

  // 👨‍⚕️ Expert consultations
  if (plan.expert_consults > 0) {
    benefits.push(
      `${plan.expert_consults} expert consultation${
        plan.expert_consults > 1 ? "s" : ""
      }`
    );
  }

  // ⏳ Duration (optional but useful)
  if (plan.duration_days) {
    benefits.push(`${plan.duration_days} days validity`);
  }

  return benefits;
}
