// src/api/auth.js
import axios from "axios";
import axiosRetry from "axios-retry";

// --- Constants ---

const BASE_URL = import.meta.env.VITE_API_URL;


// --- Axios Instance ---
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds (prevents 15000ms timeouts on slow networks & cold starts)
  headers: {
    "Content-Type": "application/json",
  },
});



// --- Axios Retry Logic ---
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || error.response?.status >= 500,
});

// REQUEST INTERCEPTOR: Allow FormData multipart boundary
axiosInstance.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});

// --- Auth APIs ---

export const loginUser = (loginData) => {
  return axiosInstance.post("/login/", loginData);
};

export const registerUser = (userData) => {
  return axiosInstance.post("/signup/", userData, {
    timeout: 180000, // 3 minutes for multi-file verification uploads (certificates, photos)
    "axios-retry": { retries: 0 }, // Never auto-retry non-idempotent signup/OTP submissions
  });
};

export const refreshToken = (refreshTokenValue) => {
  // Use raw axios (not instance) to avoid auth interceptors
  return axios.post(
    `${BASE_URL}/token/refresh/`,
    { refresh: refreshTokenValue },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const logoutUser = (refreshToken) => {
  return axiosInstance.post("/logout/", { refresh: refreshToken });
};

// --- Password Management ---

export const forgotPassword = (email) => {
  return axiosInstance.post("/forgot-password/", { email });
};

export const resetPassword = ({ uidb64, token, password }) => {
  return axiosInstance.post("/reset-password/", {
    uidb64,
    token,
    new_password: password,
  });
};

// --- OTP Verification ---

export const sendOtp = (email, phoneNumber = "") => {
  const payload = { email };
  if (phoneNumber) {
    payload.phone_number = phoneNumber;
  }
  return axiosInstance.post("/send-otp/", payload, {
    timeout: 45000, // 45 seconds for external email delivery (Resend)
  });
};

export const verifyOtp = (email, otp) => {
  return axiosInstance.post("/verify-otp/", { email, otp }, {
    timeout: 30000,
  });
};



export const facebookLogin = (userData) => {
  return axiosInstance.post("/facebook-auth", userData);
};


// google login user 
// src/api/auth.js


// ✅ Axios instance
// const axiosInstance = axios.create({
//   baseURL: "https://your-backend-domain.com/api", // Replace with your real backend URL
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });


// ✅ Google Auth Function – call this from the frontend
export const googleAuth = (accessToken) => {
  return axiosInstance.post("/google/", {
    access_token: accessToken,
  });
};

// --- Social Logins ---

// export const googleAuth = (credential) => {
//   return axiosInstance.post("/google/", { access_token: credential });
// };




























