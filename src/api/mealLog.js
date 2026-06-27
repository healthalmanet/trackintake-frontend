// src/api/mealLog.js

import axiosInstance from './axiosInstance';
import { pushMealNotifications } from '../components/components/NotificationDropdown';


export const getMeals = async (url) => {
  try {
    // THE FIX IS HERE:
    // We enforce HTTPS on the URL provided by the backend to prevent mixed-content errors.
    const secureUrl = url.replace(/^http:\/\//, 'https://');

    // Axios will now use the secure, absolute URL, and its interceptors will work.
    const response = await axiosInstance.get(secureUrl);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching paginated meals:', error.response?.data || error.message);
    throw error;
  }
};

// getMealsByDate remains the same. It correctly calls the relative path for the first page.
export const getMealsByDate = async (date) => {
  try {
    const url = `/logmeals/?date=${date}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching meals by date:', error.response?.data || error.message);
    throw error;
  }
};

// --- All other functions (create, patch, delete) remain the same ---

export const createMeal = async (mealData) => {
  try {
    const response = await axiosInstance.post('/logmeals/', mealData);
    if (response.data && response.data.notifications && response.data.notifications.length > 0) {
      pushMealNotifications(response.data.notifications);
    }
    return response.data;
  } catch (error) {
    console.error('❌ Error creating meal:', error.response?.data);
    throw error;
  }
};

export const patchMeal = async (mealId, partialMealData) => {
  try {
    const response = await axiosInstance.patch(`/logmeals/${mealId}/`, partialMealData);
    return response.data;
  } catch (error) {
    console.error(`❌ Error patching meal ${mealId}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteMeal = async (mealId) => {
  try {
    const response = await axiosInstance.delete(`/logmeals/${mealId}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error deleting meal ${mealId}:`, error.response?.data || error.message);
    throw error;
  }
};

// NEW: Fetch food details with attributes
// IMPORTANT: Supports fetching by numeric ID or by food name (via dedicated endpoint)
export const getFoodWithAttributes = async (foodNameOrId) => {
  try {
    const trimmed = String(foodNameOrId).trim();

    // If it looks like a number, treat as numeric ID
    if (!isNaN(trimmed)) {
      console.log(`[API] Fetching food by ID: ${trimmed}`);
      const idResponse = await axiosInstance.get(`/userFood/foods/${trimmed}/`);
      if (idResponse.data) {
        console.log(`[API] ✅ Found food by ID:`, idResponse.data.name);
        return idResponse.data;
      }
    }

    // Otherwise, treat as food name and use the dedicated by-name endpoint
    console.log(`[API] Fetching food by name: "${trimmed}"`);
    const nameResponse = await axiosInstance.get(
      `/foods/by-name/${encodeURIComponent(trimmed)}/`
    );
    if (nameResponse.data) {
      console.log(`[API] ✅ Found food by name:`, nameResponse.data.name);
      return nameResponse.data;
    }

    throw new Error(`Food "${trimmed}" not found. Make sure it's set up in the backend.`);
  } catch (error) {
    console.error(`[API] ❌ Error fetching food "${foodNameOrId}":`, error.message);
    throw error;
  }
};


// NEW: Log meal with attributes in one request
// === Changes made by Ananya (Start) ===
export const searchFoods = async (query, limit = 10) => {
  try {
    const q = String(query ?? "").trim();
    if (!q) return { results: [] };

    const params = new URLSearchParams({
      q,
      limit: String(limit ?? 10),
    });

    const response = await axiosInstance.get(`/foods/search/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error searching foods:', error.response?.data || error.message);
    throw error;
  }
};
// === Changes made by Ananya (End) ===

export const createMealWithAttributes = async (mealData) => {
  try {
    const response = await axiosInstance.post('/logmeals_with_attributes/', mealData);
    if (response.data && response.data.notifications && response.data.notifications.length > 0) {
      pushMealNotifications(response.data.notifications);
    }
    return response.data;
  } catch (error) {
    console.error('❌ Error creating meal with attributes:', error.response?.data || error.message);
    throw error;
  }
};
