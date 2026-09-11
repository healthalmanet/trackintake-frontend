import axiosInstance from "./axiosInstance";

export const getMySlots = (params = {}) => {
  return axiosInstance.get(
    "/appointments/nutritionist/my-slots/",
    { params }
  );
};

export const addAvailability = (data) => {
  return axiosInstance.post(
    "/appointments/nutritionist/add-availability/",
    data
  );
};

export const deleteAvailability = (id) => {
  return axiosInstance.delete(
    `/appointments/nutritionist/slots/${id}/delete/`
  );
};

