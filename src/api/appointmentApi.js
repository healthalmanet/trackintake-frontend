import axiosInstance from "./axiosInstance";

/**
 * Get available slots for a nutritionist on a given date (and optional appointment_type)
 */
export const getAvailableSlots = (nutritionistId, date, appointmentType = null) => {
  return axiosInstance.get(
    `/appointments/nutritionist/${nutritionistId}/slots/`,
    {
      params: {
        date,
        ...(appointmentType ? { appointment_type: appointmentType } : {}),
      },
    }
  );
};

/**
 * Book an appointment
 */
export const bookAppointment = (payload) => {
  return axiosInstance.post("/appointments/book/", payload);
};

/**
 * Get logged-in user's appointments
 */
export const getMyAppointments = () => {
  return axiosInstance.get("/appointments/my/");
};

/**
 * Nutritionist adds availability
 */
export const addAvailability = (data) => {
  return axiosInstance.post(
    "/appointments/nutritionist/add-availability/",
    data
  );
};
export const getMyInHouseNutritionist = () =>
  axiosInstance.get("/appointments/me/in-house-nutritionist/");
export const getExpertNutritionists = () => {
  return axiosInstance.get("/appointments/expert-nutritionists/");
};

/**
 * Get full details of a single appointment (patient or nutritionist)
 */
export const getAppointmentDetails = (appointmentId) => {
  return axiosInstance.get(`/appointments/${appointmentId}/`);
};

/**
 * Nutritionist updates clinical notes and dietary instructions on an appointment
 */
export const updateAppointmentNotes = (appointmentId, data) => {
  return axiosInstance.patch(`/appointments/${appointmentId}/notes/`, data);
};

/**
 * Fetch all appointments scheduled by a specific patient
 */
export const getPatientAppointmentHistory = (patientId) => {
  return axiosInstance.get(`/appointments/patient-history/${patientId}/`);
};

