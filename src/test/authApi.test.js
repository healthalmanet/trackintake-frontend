/**
 * =============================================================================
 * UNIT TESTS: Frontend Authentication API Layer (auth.js)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Tests that our frontend API functions (loginUser, registerUser, sendOtp,
 * verifyOtp, forgotPassword, resetPassword) send the right HTTP requests
 * to the right backend endpoints with the expected data payloads.
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  loginUser,
  registerUser,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
} from '../api/auth';

/**
 * STEP 1: MOCKING AXIOS
 * In unit testing, we NEVER make real HTTP calls across the internet.
 * We replace Axios with a mock (fake) object using `vi.mock()`.
 * This lets us inspect what URL and body the function attempted to send.
 */
vi.mock('axios', () => {
  const mockAxiosInstance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn(),
    },
  };
});

// Also mock axios-retry so it doesn't interfere with our tests
vi.mock('axios-retry', () => ({
  default: vi.fn(),
}));

describe('auth.js API Unit Tests', () => {
  // Before each test runs, clear previous call history on mocks
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // TEST 1: Login API
  // ---------------------------------------------------------------------------
  describe('loginUser()', () => {
    it('sends POST request to /login/ with email and password credentials', async () => {
      // 1. ARRANGE: Set up fake response data
      const credentials = { email: 'user@example.com', password: 'Password123!' };
      const fakeServerResponse = {
        data: {
          access: 'mock-jwt-access-token',
          refresh: 'mock-jwt-refresh-token',
          role: 'user',
          full_name: 'John Doe',
        },
      };

      // Configure our mocked Axios instance to resolve with this fake response
      const axiosInstance = axios.create();
      axiosInstance.post.mockResolvedValueOnce(fakeServerResponse);

      // 2. ACT: Call the actual frontend API function
      const response = await loginUser(credentials);

      // 3. ASSERT: Verify that axios.post was called with the exact right URL and data
      expect(axiosInstance.post).toHaveBeenCalledWith('/login/', credentials);
      expect(response).toEqual(fakeServerResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Registration API
  // ---------------------------------------------------------------------------
  describe('registerUser()', () => {
    it('sends POST request to /signup/ with user registration details', async () => {
      // 1. ARRANGE
      const registrationPayload = {
        email: 'newuser@example.com',
        full_name: 'Sarah Connor',
        password: 'SecurePass123!',
        verification_token: 'valid_token_xyz',
        role: 'user',
      };
      const fakeServerResponse = {
        data: { message: 'Registration successful. Please log in.' },
      };

      const axiosInstance = axios.create();
      axiosInstance.post.mockResolvedValueOnce(fakeServerResponse);

      // 2. ACT
      const response = await registerUser(registrationPayload);

      // 3. ASSERT
      expect(axiosInstance.post).toHaveBeenCalledWith('/signup/', registrationPayload);
      expect(response).toEqual(fakeServerResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Send OTP API
  // ---------------------------------------------------------------------------
  describe('sendOtp()', () => {
    it('sends POST request to /send-otp/ with user email', async () => {
      const email = 'verify_me@example.com';
      const fakeServerResponse = { data: { message: 'OTP sent.' } };

      const axiosInstance = axios.create();
      axiosInstance.post.mockResolvedValueOnce(fakeServerResponse);

      // ACT
      const response = await sendOtp(email);

      // ASSERT
      expect(axiosInstance.post).toHaveBeenCalledWith('/send-otp/', { email });
      expect(response).toEqual(fakeServerResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 4: Verify OTP API
  // ---------------------------------------------------------------------------
  describe('verifyOtp()', () => {
    it('sends POST request to /verify-otp/ with email and 6-digit code', async () => {
      const email = 'verify_me@example.com';
      const otp = '654321';
      const fakeServerResponse = {
        data: {
          message: 'Email verified successfully.',
          verification_token: 'token_abc_789',
        },
      };

      const axiosInstance = axios.create();
      axiosInstance.post.mockResolvedValueOnce(fakeServerResponse);

      // ACT
      const response = await verifyOtp(email, otp);

      // ASSERT
      expect(axiosInstance.post).toHaveBeenCalledWith('/verify-otp/', { email, otp });
      expect(response.data.verification_token).toBe('token_abc_789');
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 5: Forgot Password API
  // ---------------------------------------------------------------------------
  describe('forgotPassword()', () => {
    it('sends POST request to /forgot-password/ with email', async () => {
      const email = 'reset_me@example.com';
      const fakeServerResponse = {
        data: { message: 'Password reset link has been sent.' },
      };

      const axiosInstance = axios.create();
      axiosInstance.post.mockResolvedValueOnce(fakeServerResponse);

      // ACT
      const response = await forgotPassword(email);

      // ASSERT
      expect(axiosInstance.post).toHaveBeenCalledWith('/forgot-password/', { email });
      expect(response.data.message).toBe('Password reset link has been sent.');
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 6: Reset Password API
  // ---------------------------------------------------------------------------
  describe('resetPassword()', () => {
    it('sends POST request to /reset-password/ with uidb64, token, and new_password', async () => {
      const resetData = {
        uidb64: 'NA==',
        token: 'valid-reset-token-123',
        password: 'NewBrandPassword2026!',
      };
      const fakeServerResponse = {
        data: { message: 'Password has been reset successfully.' },
      };

      const axiosInstance = axios.create();
      axiosInstance.post.mockResolvedValueOnce(fakeServerResponse);

      // ACT
      const response = await resetPassword(resetData);

      // ASSERT: Notice how the function translates `password` to `new_password` for DRF
      expect(axiosInstance.post).toHaveBeenCalledWith('/reset-password/', {
        uidb64: 'NA==',
        token: 'valid-reset-token-123',
        new_password: 'NewBrandPassword2026!',
      });
      expect(response.data.message).toBe('Password has been reset successfully.');
    });
  });
});
