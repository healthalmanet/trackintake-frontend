// src/utils/logoutHelper.js
import { removeToken } from "../services/tokenService";

export const forceLogout = () => {
  try {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    removeToken();
    window.location.href = "/login";
  } catch (err) {
    console.error("Force logout error:", err);
  }
};
