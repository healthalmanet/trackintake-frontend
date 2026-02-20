export function getPlanBenefits(plan) {
  const benefits = [];

  // Base features (assumed for all plans)
  benefits.push("Meal logging");
  benefits.push("Water tracking");

  if (plan.ai_diet_allowed) {
    benefits.push("AI-powered diet recommendations");
  }

  if (plan.appointment_allowed) {
    benefits.push("Expert consultations");
  }

  if (plan.expert_consults > 0) {
    benefits.push(`${plan.expert_consults} expert consults`);
  }

  if (plan.inhouse_consults > 0) {
    benefits.push(`${plan.inhouse_consults} in-house consults`);
  }

  return benefits;
}
