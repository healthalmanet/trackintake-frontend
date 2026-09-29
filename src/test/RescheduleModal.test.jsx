import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RescheduleModal from '../components/components/appointments/RescheduleModal';
import * as appointmentApi from '../api/appointmentApi';
import toast from 'react-hot-toast';

vi.mock('../api/appointmentApi', () => ({
  getAvailableSlots: vi.fn(),
  rescheduleAppointment: vi.fn(),
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

describe('RescheduleModal Integration Tests', () => {
  const futureDate = '2026-11-20';
  const mockAppointment = {
    id: 202,
    slot_date: futureDate,
    slot_start_time: '10:00:00',
    slot_end_time: '10:30:00',
    appointment_type: 'VIRTUAL',
    reschedule_count: 0,
    slot: { id: 1, date: futureDate, start_time: '10:00:00', end_time: '10:30:00', nutritionist: 5 },
    nutritionist: { id: 5, full_name: 'Dr. Jane Smith' },
  };

  const availableSlotsMock = [
    {
      id: 2,
      date: futureDate,
      start_time: '11:00:00',
      end_time: '11:30:00',
      slot_type: 'VIRTUAL',
      is_booked: false,
    },
    {
      id: 3,
      date: futureDate,
      start_time: '14:00:00',
      end_time: '14:30:00',
      slot_type: 'VIRTUAL',
      is_booked: false,
    },
  ];

  const onCloseMock = vi.fn();
  const onRescheduledMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    appointmentApi.getAvailableSlots.mockResolvedValue({
      data: availableSlotsMock,
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <RescheduleModal
        isOpen={false}
        onClose={onCloseMock}
        appointment={mockAppointment}
        onRescheduled={onRescheduledMock}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with current schedule banner and loads slots', async () => {
    render(
      <RescheduleModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointment}
        onRescheduled={onRescheduledMock}
      />
    );

    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();
    expect(screen.getByText(/Current Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient Rescheduling Policy/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(appointmentApi.getAvailableSlots).toHaveBeenCalledWith(5, futureDate, 'VIRTUAL');
      expect(screen.getByText('11:00:00')).toBeInTheDocument();
      expect(screen.getByText('14:00:00')).toBeInTheDocument();
    });
  });

  it('allows user to select an available slot and confirm reschedule successfully', async () => {
    const updatedAppt = { ...mockAppointment, slot_start_time: '11:00:00', reschedule_count: 1 };
    appointmentApi.rescheduleAppointment.mockResolvedValueOnce({
      data: {
        detail: 'Appointment rescheduled successfully! 🗓️',
        reschedules_used: 1,
        appointment: updatedAppt,
      },
    });

    render(
      <RescheduleModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointment}
        onRescheduled={onRescheduledMock}
      />
    );

    // Wait for slots to load
    await waitFor(() => {
      expect(screen.getByText('11:00:00')).toBeInTheDocument();
    });

    // Select the first slot
    const slotCard = screen.getByText('11:00:00').closest('button');
    fireEvent.click(slotCard);

    // Click confirm reschedule
    const confirmBtn = screen.getByRole('button', { name: /Confirm Reschedule/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(appointmentApi.rescheduleAppointment).toHaveBeenCalledWith(202, 2);
      expect(toast.success).toHaveBeenCalledWith('Appointment rescheduled successfully! 🗓️');
      expect(onRescheduledMock).toHaveBeenCalledWith(updatedAppt);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('disables confirm button when no slot has been selected', async () => {
    render(
      <RescheduleModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={mockAppointment}
        onRescheduled={onRescheduledMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('11:00:00')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Reschedule/i });
    expect(confirmBtn).toBeDisabled();
    expect(appointmentApi.rescheduleAppointment).not.toHaveBeenCalled();
  });

  it('blocks patient from rescheduling if 2 reschedules have already been used', async () => {
    const maxedOutAppointment = {
      ...mockAppointment,
      reschedule_count: 2,
    };

    render(
      <RescheduleModal
        isOpen={true}
        onClose={onCloseMock}
        appointment={maxedOutAppointment}
        onRescheduled={onRescheduledMock}
        userRole="patient"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Rescheduling Unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/maximum limit of 2 reschedules/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Reschedule/i });
    expect(confirmBtn).toBeDisabled();
    expect(appointmentApi.rescheduleAppointment).not.toHaveBeenCalled();
  });
});
