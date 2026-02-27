import React, { useEffect, useState } from "react";
import { registerUser, sendOtp, verifyOtp, googleAuth } from "../api/auth";
import { User, Mail, Lock, CircleCheck, CircleX, ShieldCheck, User2 } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser } from "../api/auth";
import { useGoogleLogin } from "@react-oauth/google";
import { loginWithGoogle, loginWithFacebook } from "../api/socialAuth";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../components/context/AuthContext";
// -------------------------------------------------------------------------------------//
// -------------------------------------------------------------------------------------//
const Register = ({ onSwitchToLogin }) => {
  const [role, setRole] = useState(""); // Role state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

   const { login } = useAuth(); 
  const navigate = useNavigate();

  // --- NO LOGIC CHANGES ---

  const isLengthValid = password.length >= 8;
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = confirmPassword !== "" && password === confirmPassword;
  const isFormValid = isLengthValid && hasSymbol && isMatch;

  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, otpTimer]);

  const handleSendOtp = async () => {
    if (!email) {
      toast.warn("Please enter your email address.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();  // ✅
    setEmail(normalizedEmail); // update state so everything downstream uses lowercase
    setOtpLoading(true);
    setOtpLoading(true);
    try {
      const response = await sendOtp(email);
      toast.success(`OTP sent to ${email}`);
      setOtpSent(true);
      setOtpTimer(60);
    } catch (error) {
      toast.error(error?.response?.data?.email?.[0] || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.warn("Please enter the OTP.");
      return;
    }
    try {
      const response = await verifyOtp(email, otp);
      const token = response?.verification_token || response?.data?.verification_token;
      if (token) {
        setVerificationToken(token);
        setIsOtpVerified(true);
        toast.success("Email verified successfully!");
      } else {
        toast.error("Verification failed. No token received.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.otp?.[0] || "Invalid OTP. Please try again.");
    }
  };

  // data from bc pass imrankhan
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.warn("Please ensure your password meets all requirements.");
      return;
    }

    if (!role) {
      toast.error("Please select a role before registering.");
      return;
    }

    setLoading(true);
    try {
      // 'payload hai yha per '
      const payload = {
        full_name: fullName,
        email,
        password,
        password2: confirmPassword,
        verification_token: verificationToken,
        role, //assign the role 
      };

 
      await registerUser(payload);

     toast.success("Registration successful! Please log in.");
      navigate('/login');

    } catch (error) {
      toast.error(error?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

// old resister button 

  // const handleGoogleSuccess = async (tokenResponse) => {
  //   try {
  //     // The hook gives us the access_token directly
  //     const googleToken = tokenResponse.access_token;
  //     const res = await loginWithGoogle(googleToken);

  //     const { access, refresh, role, email: userEmail, full_name } = res.data;
  //     const id = jwtDecode(access).user_id;
  //     const userInfo = { id, role, email: userEmail, full_name };

  //     login(access, refresh, userInfo);
  //     localStorage.setItem("userRole", role.toLowerCase());
  //     toast.success(`Welcome, ${full_name || "User"}!`);

  //     const redirectPath = {
  //       nutritionist: "/nutritionist",
  //       operator: "/operator",
  //       owner: "/owner",
  //     }[role.toLowerCase()] || "/dashboard";

  //     navigate(redirectPath);
  //     onClose?.();
  //   } catch (error) {
  //     console.error("Google Login Failed:", error);
  //     toast.error("Google login failed. Please try again.");
  //   }
  // };


  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };


  const checklistItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };


  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      // The hook gives us the access_token directly
      const googleToken = tokenResponse.access_token;
      const res = await loginWithGoogle(googleToken);

      const { access, refresh, role, email: userEmail, full_name } = res.data;
      const id = jwtDecode(access).user_id;
      const userInfo = { id, role, email: userEmail, full_name };

      login(access, refresh, userInfo);
      localStorage.setItem("userRole", role.toLowerCase());
      toast.success(`Welcome, ${full_name || "User"}!`);

      const redirectPath = {
        nutritionist: "/nutritionist",
        operator: "/operator",
        owner: "/owner",
      }[role.toLowerCase()] || "/dashboard";

      navigate(redirectPath);
      onClose?.();
    } catch (error) {
      console.error("Google Login Failed:", error);
      toast.error("Google login failed. Please try again.");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google login failed."),
  });

  // const googleLogin = useGoogleLogin({
  //   onSuccess: handleGoogleSuccess,
  //   onError: () => toast.error("Google login failed."),
  // });

  

// const handleGoogleSuccess = async (tokenResponse) => {
//   try {
//     const googleToken = tokenResponse.access_token;

//     // 🔁 Backend API Call
//     const res = await googleAuth(googleToken);

//     const { access, refresh, role, email: userEmail, full_name } = res.data;
//     const id = jwtDecode(access).user_id;
//     const userInfo = { id, role, email: userEmail, full_name };

//     login(access, refresh, userInfo); // Context-based login
//     localStorage.setItem("userRole", role.toLowerCase());

//     toast.success(`Welcome, ${full_name || "User"}!`);

//     const redirectPath = {
//       nutritionist: "/nutritionist",
//       operator: "/operator",
//       owner: "/owner",
//     }[role.toLowerCase()] || "/dashboard";

//     navigate(redirectPath);
//     onClose?.();
//   } catch (error) {
//     console.error("Google Login Failed:", error);
//     toast.error("Google login failed. Please try again.");
//   }
// };

// 🔁 Trigger Google Login
// const googleLogin = useGoogleLogin({
//   onSuccess: handleGoogleSuccess,
//   onError: () => toast.error("Google login failed."),
// });

// ----------------------------Jsx code ----------------------------------------------
// -----------------------------------------------------------------------------------

  return (
    <div className="text-left w-full max-w-sm mx-auto p-4 font-[var(--font-secondary)]">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-[var(--font-primary)] text-center mb-6 text-[var(--color-text-strong)]"
      >
        Create Account
      </motion.h2>
      
      <motion.form
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        onSubmit={handleRegister}
        className="space-y-5"
      >
        {!isOtpVerified && (
          <>
            <motion.div variants={itemVariants}>
              <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                To continue, click <span className="font-semibold text-[var(--color-primary)]">Send OTP</span> and verify your email.
              </p>
              {!otpSent ? (
                <button type="button" onClick={handleSendOtp} disabled={otpLoading} className="text-sm p-2 text-[var(--color-primary)] mt-1 disabled:opacity-50">
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <button type="button" disabled={otpTimer > 0} onClick={handleSendOtp} className="text-sm text-[var(--color-primary)] mt-1 disabled:opacity-50">
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                </button>
              )}
            </motion.div>

            {otpSent && (
              <motion.div variants={checklistItemVariants}>
                <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Enter OTP</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg"
                    placeholder="Enter OTP here"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <button type="button" onClick={handleVerifyOtp} disabled={loading} className="text-sm p-2 text-[var(--color-primary)] mt-1 disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </motion.div>
            )}
          </>
        )}

        {isOtpVerified && (
          <>
          
            {/* options button hai   */}
      <motion.div variants={itemVariants}>
        <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">
          Role
        </label>
        <div className="relative">
          <select
            className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg appearance-none"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select Role</option>
            <option value="nutritionist" className="hover:bg-orange-500">Nutritionist</option>
            <option value="user" className="hover:bg-orange-500">User</option>
          </select>
          <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </motion.div>
      {/* =-------------------------------imran khan---------------------------------------- */}

            <motion.div variants={itemVariants}>
              <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg"
                  placeholder="Min 8 chars + 1 symbol"
                  value={password}
                  onFocus={() => setShowChecklist(true)}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
              </div>
            </motion.div>
          </>
        )}

        {(isOtpVerified && (showChecklist || password || confirmPassword)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-[var(--color-text-strong)] bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] p-3 rounded-md space-y-1"
          >
            <ChecklistItem isValid={isLengthValid} text="At least 8 characters" />
            <ChecklistItem isValid={hasSymbol} text="At least 1 special symbol" />
            <ChecklistItem isValid={isMatch} text="Passwords match" />
          </motion.div>
        )}

        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={!isFormValid || loading || !isOtpVerified}
          className="w-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] px-5 py-3 rounded-lg font-semibold shadow-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? "Registering..." : "Create Account"}
        </motion.button>
      </motion.form>

            {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-[var(--color-border-default)]"></div>
        <span className="mx-4 flex-shrink text-sm text-[var(--color-text-muted)]">OR</span>
        <div className="flex-grow border-t border-[var(--color-border-default)]"></div>
      </div>

      {/* Google Sign-in Button */}
      <motion.button
        type="button" // Important: Prevents form submission
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => googleLogin()}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-60"
        disabled={loading}
      >
        <svg className="h-5 w-5" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
        </svg>
        Sign in with Google
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }}
        className="mt-6 text-center text-sm"
      >
        <span className="text-[var(--color-text-default)] font-medium">Already have an account? </span>
        <button
          onClick={onSwitchToLogin}
          className="text-[var(--color-primary)] font-semibold underline hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Login here
        </button>
      </motion.div>
    </div>
  );
};

const ChecklistItem = ({ isValid, text }) => (
  <div className={`flex items-center gap-2 ${isValid ? "text-[var(--color-success-text)]" : "text-[var(--color-danger-text)]"}`}>
    {isValid ? <CircleCheck className="w-4 h-4" /> : <CircleX className="w-4 h-4" />}
    <span>{text}</span>
  </div>
);

export default Register;


// import React, { useState } from "react";
// import { registerUser } from "../api/auth";
// import {
//   User,
//   Mail,
//   Lock,
//   CircleCheck,
//   CircleX,
//   User2,
// } from "lucide-react";
// import { toast } from "react-toastify";
// import { motion } from "framer-motion";
// import { useGoogleLogin } from "@react-oauth/google";
// import { loginWithGoogle } from "../api/socialAuth";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import { useAuth } from "../components/context/AuthContext";

// const Register = ({ onSwitchToLogin }) => {
//   const [role, setRole] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showChecklist, setShowChecklist] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const { login } = useAuth();
//   const navigate = useNavigate();

//   // Password rules
//   const isLengthValid = password.length >= 8;
//   const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
//   const isMatch = confirmPassword && password === confirmPassword;
//   const isFormValid = isLengthValid && hasSymbol && isMatch;

//   const handleRegister = async (e) => {
//     e.preventDefault();

//     if (!role) {
//       toast.error("Please select a role");
//       return;
//     }

//     setLoading(true);
//     try {
//       const payload = {
//         full_name: fullName,
//         email,
//         password,
//         password2: confirmPassword,
//         role,
//       };

//       await registerUser(payload);
//       toast.success("Account created successfully. Please login.");
//       navigate("/login");
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.email?.[0] ||
//         error?.response?.data?.password?.[0] ||
//         "Registration failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Google login
//   const handleGoogleSuccess = async (tokenResponse) => {
//     try {
//       const googleToken = tokenResponse.access_token;
//       const res = await loginWithGoogle(googleToken);

//       const { access, refresh, role, email, full_name } = res.data;
//       const id = jwtDecode(access).user_id;

//       login(access, refresh, { id, role, email, full_name });
//       localStorage.setItem("userRole", role.toLowerCase());

//       navigate(
//         {
//           nutritionist: "/nutritionist",
//           operator: "/operator",
//           owner: "/owner",
//         }[role.toLowerCase()] || "/dashboard"
//       );
//     } catch {
//       toast.error("Google login failed");
//     }
//   };

//   const googleLogin = useGoogleLogin({
//     onSuccess: handleGoogleSuccess,
//     onError: () => toast.error("Google login failed"),
//   });

//   return (
//     <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-xl shadow-sm">
//       <h2 className="text-3xl font-semibold text-center mb-8 text-gray-800">
//         Create Account
//       </h2>

//       <form onSubmit={handleRegister} className="space-y-5">

//         {/* Email */}
//         <FormRow label="Email">
//           <InputWithIcon
//             icon={Mail}
//             type="email"
//             value={email}
//             onChange={setEmail}
//             placeholder="email@domain.com"
//           />
//         </FormRow>

//         {/* Role */}
//         <FormRow label="Role">
//           <div className="relative w-full">
//             <User2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <select
//               className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
//               value={role}
//               onChange={(e) => setRole(e.target.value)}
//               required
//             >
//               <option value="">Select Role</option>
//               <option value="nutritionist">Nutritionist</option>
//               <option value="user">User</option>
//             </select>
//           </div>
//         </FormRow>

//         {/* Full Name */}
//         <FormRow label="Full Name">
//           <InputWithIcon
//             icon={User}
//             type="text"
//             value={fullName}
//             onChange={setFullName}
//             placeholder="Your full name"
//           />
//         </FormRow>

//         {/* Password */}
//         <FormRow label="Password">
//           <InputWithIcon
//             icon={Lock}
//             type="password"
//             value={password}
//             onFocus={() => setShowChecklist(true)}
//             onChange={setPassword}
//             placeholder="Min 8 chars + symbol"
//           />
//         </FormRow>

//         {/* Confirm Password */}
//         <FormRow label="Confirm Password">
//           <InputWithIcon
//             icon={Lock}
//             type="password"
//             value={confirmPassword}
//             onChange={setConfirmPassword}
//             placeholder="Re-enter password"
//           />
//         </FormRow>

//         {(showChecklist || password) && (
//           <div className="ml-32 border rounded-lg p-3 text-sm bg-gray-50">
//             <ChecklistItem isValid={isLengthValid} text="At least 8 characters" />
//             <ChecklistItem isValid={hasSymbol} text="At least 1 special symbol" />
//             <ChecklistItem isValid={isMatch} text="Passwords match" />
//           </div>
//         )}

//         <button
//           type="submit"
//           disabled={!isFormValid || loading}
//           className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
//         >
//           {loading ? "Creating..." : "Create Account"}
//         </button>
//       </form>

//       <div className="my-6 text-center text-gray-400">OR</div>

//       <button
//         onClick={() => googleLogin()}
//         className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
//       >
//         Sign in with Google
//       </button>

//       <p className="text-center mt-6 text-sm">
//         Already have an account?{" "}
//         <button onClick={onSwitchToLogin} className="text-orange-500 font-semibold">
//           Login
//         </button>
//       </p>
//     </div>
//   );
// };

// /* ---------- Reusable Components ---------- */

// const FormRow = ({ label, children }) => (
//   <div className="flex items-center gap-6">
//     <label className="w-28 text-sm font-medium text-gray-700">
//       {label}
//     </label>
//     <div className="flex-1">{children}</div>
//   </div>
// );

// const InputWithIcon = ({ icon: Icon, value, onChange, ...props }) => (
//   <div className="relative w-full">
//     <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//     <input
//       {...props}
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
//       required
//     />
//   </div>
// );

// const ChecklistItem = ({ isValid, text }) => (
//   <div className={`flex items-center gap-2 ${isValid ? "text-green-600" : "text-red-500"}`}>
//     {isValid ? <CircleCheck size={16} /> : <CircleX size={16} />}
//     <span>{text}</span>
//   </div>
// );

// export default Register;
