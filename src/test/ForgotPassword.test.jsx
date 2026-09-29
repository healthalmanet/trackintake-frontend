/**
 * =============================================================================
 * COMPONENT INTEGRATION TEST: Forgot Password (ForgotPassword.jsx)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Tests the password reset request screen:
 * 1. User sees the "Forgot Password" heading and email input.
 * 2. User types their email address and clicks "Send Reset Link".
 * 3. Component calls the forgotPassword() API function.
 * 4. On success, the form disappears and a success message appears.
 * 5. On error, a toast notification displays the error message.
 * =============================================================================
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../components/components/ForgotPassword';
import * as authApi from '../api/auth';
import { toast } from 'react-hot-toast';

// -----------------------------------------------------------------------------
// STEP 1: MOCKING DEPENDENCIES
// -----------------------------------------------------------------------------
vi.mock('../api/auth', () => ({
  forgotPassword: vi.fn(),
}));

vi.mock('react-hot-toast', () => {
  const toastMock = vi.fn();
  toastMock.success = vi.fn();
  toastMock.error = vi.fn();
  return {
    default: toastMock,
    toast: toastMock,
  };
});

describe('ForgotPassword Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForgotPassword = () => {
    return render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
  };

  // ---------------------------------------------------------------------------
  // TEST 1: Initial Render
  // ---------------------------------------------------------------------------
  it('renders title, email input, and submit button initially', () => {
    renderForgotPassword();

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText(/Enter your email to receive a reset link/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your registered email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Successful Submission Transitions to Success View
  // ---------------------------------------------------------------------------
  it('submits email and shows success confirmation screen', async () => {
    // 1. ARRANGE: Set up resolved API call
    authApi.forgotPassword.mockResolvedValueOnce({
      data: { message: 'Password reset link has been sent.' },
    });

    renderForgotPassword();

    // 2. ACT: Type email into input
    const emailInput = screen.getByPlaceholderText(/Enter your registered email/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    expect(emailInput.value).toBe('user@example.com');

    // 2. ACT: Click submit
    const submitBtn = screen.getByRole('button', { name: /Send Reset Link/i });
    fireEvent.click(submitBtn);

    // 3. ASSERT: Wait for API call and verify success message appears
    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('user@example.com');
      expect(
        screen.getByText(/If an account with that email exists, you will receive a password reset link shortly/i)
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // TEST 3: API Error Shows Error Toast
  // ---------------------------------------------------------------------------
  it('displays error toast when API fails', async () => {
    // Silence intentional console.error from the component
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    authApi.forgotPassword.mockRejectedValueOnce({
      response: {
        data: { error: 'Service temporarily unavailable. Please try again.' },
      },
    });

    renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText(/Enter your registered email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(authApi.forgotPassword).toHaveBeenCalledWith('user@example.com');
      expect(toast.error).toHaveBeenCalledWith('Service temporarily unavailable. Please try again.');
    });

    consoleSpy.mockRestore();
  });
});
