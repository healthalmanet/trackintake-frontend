import React from "react";
import NutritionSearch from "../../../pages/dashboard/Tools/NutritionSearch";
import BackButton from "./BackButton";

const NutritionSearchLayout = () => {
  return (
    <div className="bg-[var(--color-bg-app)] py-6 px-4 max-w-7xl mx-auto space-y-4">
      <BackButton label="Back to Dashboard" to="/nutritionist" />
      <NutritionSearch />
    </div>
  );
};

export default NutritionSearchLayout;
