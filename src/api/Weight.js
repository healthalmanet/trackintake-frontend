// src/api/Weight.js

import axiosInstance from './axiosInstance'; // ✅ Import the configured instance

// ❌ The BASE_URL and getAuthHeaders helper function are no longer needed.

/**
 * Fetches all weight entries for the authenticated user.
 */
export const getWeight = async () => {
  // ✅ Use the instance directly. It handles the base URL and auth headers.
  const response = await axiosInstance.get('/weight/');
  return response.data;
};

/**
 * Creates a new weight entry.
 * @param {object} formData - The data for the new weight entry (e.g., { weight_kg: 75 }).
 */
export const postWeight = async (formData) => {
  // ✅ The instance handles headers, so we just pass the endpoint and data.
  const response = await axiosInstance.post('/weight/', formData);
  return response.data;
};

/**
 * Updates an existing weight entry completely.
 * @param {string|number} id - The ID of the weight entry.
 * @param {object} formData - The updated weight data (e.g. { weight_kg: 72, date: "2026-10-12" }).
 */
export const updateWeight = async (id, formData) => {
  const response = await axiosInstance.put(`/weight/${id}/`, formData);
  return response.data;
};

/**
 * Partially updates an existing weight entry.
 * @param {string|number} id - The ID of the weight entry.
 * @param {object} formData - The partial weight data to update.
 */
export const patchWeight = async (id, formData) => {
  const response = await axiosInstance.patch(`/weight/${id}/`, formData);
  return response.data;
};

/**
 * Deletes an existing weight entry.
 * @param {string|number} id - The ID of the weight entry to delete.
 */
export const deleteWeight = async (id) => {
  const response = await axiosInstance.delete(`/weight/${id}/`);
  return response.data;
};