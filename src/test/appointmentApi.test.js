import { describe, it, expect, vi, beforeEach } from 'vitest';
import axiosInstance from '../api/axiosInstance';
import {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  cancelAppointment,
  rescheduleAppointment,
} from '../api/appointmentApi';

vi.mock('../api/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('appointmentApi Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('should request available slots with date and type query params', async () => {
      const mockResponse = { data: [{ id: 10, start_time: '10:00:00' }] };
      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await getAvailableSlots(5, '2026-10-15', 'VIRTUAL');

      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/appointments/nutritionist/5/slots/',
        {
          params: {
            date: '2026-10-15',
            appointment_type: 'VIRTUAL',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('bookAppointment', () => {
    it('should send POST request with booking payload to /appointments/book/', async () => {
      const payload = {
        slot_id: 12,
        appointment_category: 'IN_HOUSE',
        appointment_type: 'VIRTUAL',
      };
      const mockResponse = { data: { id: 101, status: 'CONFIRMED' } };
      axiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await bookAppointment(payload);

      expect(axiosInstance.post).toHaveBeenCalledWith('/appointments/book/', payload);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyAppointments', () => {
    it('should fetch appointments list from /appointments/my/', async () => {
      const mockResponse = { data: [{ id: 101, status: 'CONFIRMED' }] };
      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await getMyAppointments();

      expect(axiosInstance.get).toHaveBeenCalledWith('/appointments/my/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAppointmentDetails', () => {
    it('should fetch single appointment details by ID', async () => {
      const mockResponse = { data: { id: 101, fee_amount: 500 } };
      axiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await getAppointmentDetails(101);

      expect(axiosInstance.get).toHaveBeenCalledWith('/appointments/101/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rescheduleAppointment', () => {
    it('should send POST request with new_slot_id to reschedule endpoint', async () => {
      const mockResponse = { data: { detail: 'Rescheduled successfully', reschedules_used: 1 } };
      axiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await rescheduleAppointment(101, 45);

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/appointments/appointments/101/reschedule/',
        { new_slot_id: 45 }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cancelAppointment', () => {
    it('should send POST request with reason to cancel endpoint', async () => {
      const mockResponse = { data: { detail: 'Cancelled successfully' } };
      axiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await cancelAppointment(101, 'Emergency travel');

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/appointments/appointments/101/cancel/',
        { reason: 'Emergency travel' }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should allow cancellation with default empty reason', async () => {
      const mockResponse = { data: { detail: 'Cancelled' } };
      axiosInstance.post.mockResolvedValueOnce(mockResponse);

      await cancelAppointment(101);

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/appointments/appointments/101/cancel/',
        { reason: '' }
      );
    });
  });
});
