// src/api/targetApi.js (or whatever the filename is)

import axiosInstance from './axiosInstance'; // ✅ Import the configured instance

// ❌ The BASE_URL, axiosRetry setup, and getAuthHeaders helper are all removed.

/**
 * GET /recommend-calories/
 * Fetches user's calorie and macronutrient recommendations.
 * @param {string} currentDate - The user's current local date in 'YYYY-MM-DD' format.
 */
export const targetApi = async (currentDate) => {
  // ✅ The input validation is preserved.
  if (!currentDate) throw new Error("currentDate is required for targetApi.");
  
  // ✅ Use the instance with the 'params' object for clean query string handling.
  const response = await axiosInstance.get('/recommend-calories/', {
    params: { current_date: currentDate }
  });
  return response.data;
};

/**
 * GET /daily-calorie-summary/
 * Fetches the calorie and macronutrient summary for a specific day or date range.
 * @param {string} date - The target date in 'YYYY-MM-DD' format (or start date if endDate is provided).
 * @param {string} [endDate] - Optional end date in 'YYYY-MM-DD' format for range query.
 */
export const targetProgressApi = async (date, endDate = null) => {
  if (!date) throw new Error("date is required for targetProgressApi.");

  const params = endDate ? { start_date: date, end_date: endDate } : { date };
  const response = await axiosInstance.get('/daily-calorie-summary/', {
    params
  });
  return response.data;
};

/**
 * GET /nutrition7day/
 * Fetches nutritional data for a date range (or 7-day period ending on endDate).
 * @param {string} endDate - The end date in 'YYYY-MM-DD' format.
 * @param {string} [startDate] - Optional start date in 'YYYY-MM-DD' format.
 */
export const weeklyTrack = async (endDate, startDate = null) => {
  if (!endDate) throw new Error("endDate is required for weeklyTrack.");
  
  const params = startDate ? { start_date: startDate, end_date: endDate } : { end_date: endDate };
  const response = await axiosInstance.get('/nutrition7day/', {
    params
  });
  return response.data;
};