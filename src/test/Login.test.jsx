/**
 * =============================================================================
 * COMPONENT INTEGRATION TEST: Login Page (Login.jsx)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Simulates a real user visiting the Login screen:
 * 1. Verifies that the Email and Password input boxes and the Login button are visible.
 * 2. Simulates user typing credentials and clicking the Login button.
 * 3. Verifies that the login API is called with the typed data.
 * 4. Verifies success path (authentication context updated, welcome toast shown).
 * 5. Verifies error path (wrong password displays error toast).
 * =============================================================================
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import * as authApi from '../api/auth';
import { toast } from 'react-toastify';

// -----------------------------------------------------------------------------
// STEP 1: MOCKING DEPENDENCIES
// -----------------------------------------------------------------------------

// Mock the Auth API
vi.mock('../api/auth', () => ({
  loginUser: vi.fn(),
  googleAuth: vi.fn(),
}));

// Mock AuthContext so we can verify if login() was called upon success
const mockLoginContextFn = vi.fn();
vi.mock('../components/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLoginContextFn,
    isAuthenticated: false,
    user: null,
  }),
}));

// Mock react-router-dom navigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-toastify so we can check that toast alerts are shown to user
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock jwt-decode to safely parse fake tokens
vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ user_id: 42, role: 'user' }),
}));

// Mock Google & Facebook login SDKs
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div>Google Login Mock</div>,
  useGoogleLogin: () => vi.fn(),
}));

vi.mock('../api/socialAuth', () => ({
  loginWithGoogle: vi.fn(),
  loginWithFacebook: vi.fn(),
}));

describe('Login Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to render component with Router wrapper
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login onClose={vi.fn()} onSwitchToRegister={vi.fn()} />
      </BrowserRouter>
    );
  };

  // ---------------------------------------------------------------------------
  // TEST 1: Rendering Form Inputs
  // ---------------------------------------------------------------------------
  it('renders email input, password input, and submit button', () => {
    // 1. ARRANGE: Render the login page in virtual DOM
    renderLogin();

    // 2. ASSERT: Verify user sees Email input, Password input, and Login button
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Successful Form Submission
  // ---------------------------------------------------------------------------
  it('submits credentials and successfully logs in user', async () => {
    // 1. ARRANGE: Prepare mock response that backend would return
    authApi.loginUser.mockResolvedValueOnce({
      data: {
        access: 'header.payload.signature',
        refresh: 'refresh.token.value',
        role: 'user',
        email: 'patient@example.com',
        full_name: 'Alex Turner',
      },
    });

    renderLogin();

    // 2. ACT: Simulate user typing their email
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    fireEvent.change(emailInput, { target: { value: 'patient@example.com' } });
    expect(emailInput.value).toBe('patient@example.com');

    // 2. ACT: Simulate user typing their password
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    fireEvent.change(passwordInput, { target: { value: 'MySecretPassword123' } });
    expect(passwordInput.value).toBe('MySecretPassword123');

    // 2. ACT: Click the submit "Login" button
    const submitBtn = screen.getByRole('button', { name: /^Login$/i });
    fireEvent.click(submitBtn);

    // 3. ASSERT: Wait for async state updates and verify outcomes
    await waitFor(() => {
      // Checked that the login API was called with exact typed credentials
      expect(authApi.loginUser).toHaveBeenCalledWith({
        email: 'patient@example.com',
        password: 'MySecretPassword123',
      });

      // Checked that user session was saved into AuthContext
      expect(mockLoginContextFn).toHaveBeenCalledWith(
        'header.payload.signature',
        'refresh.token.value',
        expect.objectContaining({
          id: 42,
          email: 'patient@example.com',
          full_name: 'Alex Turner',
        })
      );

      // Checked that welcome toast was shown
      expect(toast.success).toHaveBeenCalledWith('Welcome, Alex Turner!');

      // Checked navigation to user dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 3: Handling Invalid Credentials
  // ---------------------------------------------------------------------------
  it('displays error toast when backend rejects login with wrong credentials', async () => {
    // Silence intentional console.error from the component
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. ARRANGE: Mock an HTTP 401 response from server
    authApi.loginUser.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'No active account found with the given credentials',
        },
      },
    });

    renderLogin();

    // 2. ACT: Fill form with wrong credentials and submit
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: 'WrongPassword!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Login$/i }));

    // 3. ASSERT: Check that error toast was displayed and user was NOT logged in
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No active account found with the given credentials'
      );
      expect(mockLoginContextFn).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
