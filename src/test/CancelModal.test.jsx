import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CancelModal from '../components/components/appointments/CancelModal';
import * as appointmentApi from '../api/appointmentApi';
import toast from 'react-hot-toast';

vi.mock('../api/appointmentApi', () => ({
  cancelAppointment: vi.fn(),
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

describe('CancelModal Integration Tests', () => {
  const mockAppointmentFuture = {
    id: 101,
    slot_date: '2026-12-25',
    slot_start_time: '14:00:00',
    slot_end_time: '14:30:00',
    appointment_type: 'VIRTUAL',
    fee_amount: 500,
    nutritionist: { id: 10, full_name: 'Dr. Jane Smith' },
  };

  const onCloseMock = vi.fn();
  const onCancelledMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <CancelModal
        isOpen={false}
        onClose={onCloseMock}
        appointment={mockAppointmentFuture}
        onCancelled={onCancelledMock}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with consultation details and cancellation policies when open', () => {
    render(
      <CancelModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointmentFuture}
        onCancelled={onCancelledMock}
      />
    );

    expect(screen.getByText('Cancel Consultation')).toBeInTheDocument();
    expect(screen.getByText(/Confirm cancellation and review refund terms/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Please tell us why you need to cancel this appointment\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Keep Appointment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Cancellation/i })).toBeInTheDocument();
  });

  it('allows user to enter cancellation reason and successfully cancels appointment', async () => {
    const mockUpdatedAppointment = { ...mockAppointmentFuture, status: 'CANCELLED' };
    appointmentApi.cancelAppointment.mockResolvedValueOnce({
      data: {
        detail: 'Appointment cancelled successfully.',
        policy_notice: 'Refund pending approval',
        appointment: mockUpdatedAppointment,
      },
    });

    render(
      <CancelModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointmentFuture}
        onCancelled={onCancelledMock}
      />
    );

    const textarea = screen.getByPlaceholderText(/Please tell us why you need to cancel this appointment\.\.\./i);
    fireEvent.change(textarea, { target: { value: 'Unexpected business trip' } });
    expect(textarea.value).toBe('Unexpected business trip');

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(appointmentApi.cancelAppointment).toHaveBeenCalledWith(101, 'Unexpected business trip');
      expect(toast.success).toHaveBeenCalledWith('Appointment cancelled successfully.');
      expect(onCancelledMock).toHaveBeenCalledWith(mockUpdatedAppointment);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('shows error toast when cancel API fails', async () => {
    appointmentApi.cancelAppointment.mockRejectedValueOnce({
      response: {
        data: { detail: 'Cannot cancel an appointment that has already started.' },
      },
    });

    render(
      <CancelModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointmentFuture}
        onCancelled={onCancelledMock}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(appointmentApi.cancelAppointment).toHaveBeenCalledWith(101, '');
      expect(toast.error).toHaveBeenCalledWith('Cannot cancel an appointment that has already started.');
      expect(onCancelledMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when "Keep Appointment" is clicked', () => {
    render(
      <CancelModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointmentFuture}
        onCancelled={onCancelledMock}
      />
    );

    const keepBtn = screen.getByRole('button', { name: /Keep Appointment/i });
    fireEvent.click(keepBtn);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(appointmentApi.cancelAppointment).not.toHaveBeenCalled();
  });
});
