// src/api/auth.js
import axios from "axios";
import axiosRetry from "axios-retry";

// --- Constants ---

const BASE_URL = import.meta.env.VITE_API_URL;


// --- Axios Instance ---hai 
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds
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

// --- Auth APIs ---

export const loginUser = (loginData) => {
  return axiosInstance.post("/login/", loginData);
};

export const registerUser = (userData) => {
  return axiosInstance.post("/signup/", userData);
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

export const sendOtp = (email) => {
  return axiosInstance.post("/send-otp/", { email });
};

export const verifyOtp = (email, otp) => {
  return axiosInstance.post("/verify-otp/", { email, otp });
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
























// import axios from "axios";
// import axiosRetry from "axios-retry";
// import axios from "axios"; // ✅ Keep raw axios for the special refreshToken case
// import axiosInstance from "./axiosInstance"; // ✅ Import the configured instance for all other calls


// // --- Single Source of Truth for API URL ---
// const BASE_URL = "https://trackeats.onrender.com/api";

// // --- Create a single, configured Axios instance ---
// // This instance will be used for all API calls.
// // It includes the base URL, a timeout, and automatic retries.
// const axiosInstance = axios.create({
//   baseURL: BASE_URL,
//   timeout: 15000, // 15-second timeout
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Apply exponential backoff for retries on network errors
// axiosRetry(axiosInstance, {
//   retries: 3,
//   retryDelay: axiosRetry.exponentialDelay,
//   // Retry only on network errors or 5xx server errors
//   retryCondition: (error) => {
//     return (
//       axiosRetry.isNetworkError(error) ||
//       error.response?.status >= 500
//     );
//   },
// });


// // --- Standard Authentication APIs ---

// //  Login User
// export const loginUser = (loginData) => {
//   return axiosInstance.post(`/login/`, loginData);
// };

// //  Register User
// export const registerUser = (userData) => {
//   // Ensure password fields match backend expectations (e.g., 'password' and 'password2')
//   return axiosInstance.post(`/signup/`, userData);
// };

// //  Refresh Auth Token
// export const refreshToken = (refresh) => {
//   return axiosInstance.post(`/token/refresh/`, { refresh });
// };

// // --- Password Management APIs ---

// //  Forgot Password
// export const forgotPassword = (email) => {
//   return axiosInstance.post(`/forgot-password/`, { email });
// };

// //  Reset Password
// export const resetPassword = ({ uidb64, token, password }) => {
//   return axiosInstance.post(`/reset-password/`, {
//     uidb64,
//     token,
//     new_password: password,
//   });
// };

// // --- OTP (One-Time Password) APIs ---

// //  Send OTP
// export const sendOtp = (email) => {
//   return axiosInstance.post(`/send-otp/`, { email });
// };

// //  Verify OTP
// export const verifyOtp = (email, otp) => {
//   return axiosInstance.post(`/verify-otp/`, { email, otp });
// };

// // --- CORRECTED GOOGLE AUTH FUNCTION ---
// /**
//  * Sends the Google ID token to the backend for verification.
//  * @param {string} credential - The ID token from the Google Login component.
//  * @returns {Promise} Axios promise.
//  */
// export const googleAuth = (credential) => {
//   // The backend error message tells us it expects the key to be "access_token".
//   // This line creates the correct JSON payload: { "access_token": "..." }
//   return axiosInstance.post(`/google/`, { access_token: credential });
// // src/api/auth.js

// // import axiosRetry from "axios-retry";

// // ✅ Apply retry logic to the INSTANCE, not the global axios
// axiosRetry(axiosInstance, {
//   retries: 3,
//   retryDelay: axiosRetry.exponentialDelay,
// });


// // --- Authenticated User Actions (using the instance) ---
// // These functions are for logged-in users and should use the interceptors
// // to automatically attach the access token.

// export const logoutUser = (refreshToken) => {
//   // ✅ USE: axiosInstance. The interceptor adds the access token automatically.
//   // The body of the request sends the refresh token to the backend to invalidate it.
//   return axiosInstance.post("/logout/", { refresh: refreshToken });
 
// };


// // --- Public Actions (can use the instance or raw axios) ---
// // These functions don't require an access token, so using the instance is fine
// // and simpler as it handles the baseURL.

// export const loginUser = (loginData) => {
//   // ✅ USE: axiosInstance. It handles the baseURL.
//   return axiosInstance.post("/login/", loginData);
// };

// export const registerUser = (userData) => {
//   // ✅ USE: axiosInstance. It handles the baseURL.
//   return axiosInstance.post("/signup/", userData);
// };

// export const forgotPassword = (email) => {
//   // ✅ USE: axiosInstance. It handles the baseURL.
//   return axiosInstance.post("/forgot-password/", { email });
// };

// export const resetPassword = ({ uidb64, token, password }) => {
//   // ✅ USE: axiosInstance. It handles the baseURL.
//   return axiosInstance.post("/reset-password/", {
//     uidb64,
//     token,
//     new_password: password,
//   });
// };

// export const sendOtp = (email) => {
//   // ✅ USE: axiosInstance. It handles the baseURL.
//   return axiosInstance.post("/send-otp/", { email });
// };

// export const verifyOtp = (email, otp) => {
//   // ✅ USE: axiosInstance. It handles the baseURL.
//   return axiosInstance.post("/verify-otp/", { email, otp });
// };















