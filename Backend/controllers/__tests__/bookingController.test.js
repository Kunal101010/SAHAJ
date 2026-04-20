const bookingController = require('../bookingController');
const Booking = require('../../model/booking');
const Facility = require('../../model/facility');
const notificationService = require('../../services/notificationService');

jest.mock('../../model/booking');
jest.mock('../../model/facility');
jest.mock('../../services/notificationService');

const createTriplePopulateSortLean = (result) => {
  const lean = jest.fn().mockResolvedValue(result);
  const sort = jest.fn().mockReturnValue({ lean });
  const populate2 = jest.fn().mockReturnValue({ sort });
  const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
  return { populate: populate1, populate2, sort, lean };
};

const createPopulateSortChain = (result) => {
  const sort = jest.fn().mockResolvedValue(result);
  const populate = jest.fn().mockReturnValue({ sort });
  return { populate, sort };
};

describe('Booking Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: { facilityId: 'facilityId', id: 'bookingId' },
      query: {},
      user: { _id: 'userId', role: 'employee', username: 'testuser' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should return 400 when required fields are missing', async () => {
      mockReq.body = {};

      await bookingController.createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'facilityId, start and end are required'
      });
    });

    it('should return 404 when facility does not exist', async () => {
      mockReq.body = { facilityId: 'facilityId', start: '2026-05-01T10:00:00Z', end: '2026-05-01T12:00:00Z' };
      Facility.findById.mockResolvedValue(null);

      await bookingController.createBooking(mockReq, mockRes);

      expect(Facility.findById).toHaveBeenCalledWith('facilityId');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Facility not found'
      });
    });

    it('should return 400 when end is before or equal to start', async () => {
      mockReq.body = { facilityId: 'facilityId', start: '2026-05-01T12:00:00Z', end: '2026-05-01T10:00:00Z' };
      Facility.findById.mockResolvedValue({ _id: 'facilityId', name: 'Main Hall' });

      await bookingController.createBooking(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'End must be after start'
      });
    });

    it('should return 409 when booking overlaps', async () => {
      mockReq.body = { facilityId: 'facilityId', start: '2026-05-01T10:00:00Z', end: '2026-05-01T12:00:00Z' };
      Facility.findById.mockResolvedValue({ _id: 'facilityId', name: 'Main Hall' });
      Booking.findOne.mockResolvedValue({ _id: 'overlap' });

      await bookingController.createBooking(mockReq, mockRes);

      expect(Booking.findOne).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Facility already booked for selected time'
      });
    });

    it('should create a booking and notify admins/managers', async () => {
      mockReq.body = {
        facilityId: 'facilityId',
        start: '2026-05-01T10:00:00Z',
        end: '2026-05-01T12:00:00Z',
        purpose: 'Team meeting'
      };
      Facility.findById.mockResolvedValue({ _id: 'facilityId', name: 'Main Hall' });
      Booking.findOne.mockResolvedValue(null);
      const mockBooking = {
        _id: 'bookingId',
        save: jest.fn().mockResolvedValue(),
        facility: 'facilityId',
        user: 'userId',
        start: new Date('2026-05-01T10:00:00Z'),
        end: new Date('2026-05-01T12:00:00Z'),
        purpose: 'Team meeting',
        date: '2026-05-01'
      };
      Booking.mockImplementation(() => mockBooking);
      notificationService.getUsersByRole.mockResolvedValue(['admin1']);
      notificationService.bookingCreatedNotification.mockReturnValue({});
      notificationService.notifyMultiple.mockResolvedValue();

      await bookingController.createBooking(mockReq, mockRes);

      expect(mockBooking.save).toHaveBeenCalled();
      expect(notificationService.getUsersByRole).toHaveBeenCalledWith(['admin', 'manager']);
      expect(notificationService.bookingCreatedNotification).toHaveBeenCalledWith(
        'bookingId',
        'Main Hall',
        expect.any(String)
      );
      expect(notificationService.notifyMultiple).toHaveBeenCalledWith(['admin1'], {});
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, booking: mockBooking });
    });

    it('should create a booking without notifying if no admins/managers exist', async () => {
      mockReq.body = {
        facilityId: 'facilityId',
        start: '2026-05-01T10:00:00Z',
        end: '2026-05-01T12:00:00Z',
      };
      Facility.findById.mockResolvedValue({ _id: 'facilityId', name: 'Main Hall' });
      Booking.findOne.mockResolvedValue(null);
      const mockBooking = {
        _id: 'bookingId',
        save: jest.fn().mockResolvedValue(),
        facility: 'facilityId',
        user: 'userId',
        start: new Date('2026-05-01T10:00:00Z'),
        end: new Date('2026-05-01T12:00:00Z'),
        purpose: '',
        date: '2026-05-01'
      };
      Booking.mockImplementation(() => mockBooking);
      notificationService.getUsersByRole.mockResolvedValue([]);

      await bookingController.createBooking(mockReq, mockRes);

      expect(notificationService.notifyMultiple).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, booking: mockBooking });
    });
  });

  describe('getMyBookings', () => {
    it('should return bookings for the current user', async () => {
      const mockBookings = [{ _id: 'b1' }, { _id: 'b2' }];
      const chain = createTriplePopulateSortLean(mockBookings);
      Booking.find.mockReturnValue(chain);

      await bookingController.getMyBookings(mockReq, mockRes);

      expect(Booking.find).toHaveBeenCalledWith({ user: 'userId' });
      expect(chain.populate).toHaveBeenCalledWith('facility', 'name capacity location');
      expect(chain.populate2).toHaveBeenCalledWith('user', 'username firstName lastName');
      expect(chain.sort).toHaveBeenCalledWith({ start: -1 });
      expect(chain.lean).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockBookings });
    });

    it('should return server error if Booking.find throws', async () => {
      const error = new Error('DB fail');
      const chain = createTriplePopulateSortLean([]);
      chain.sort.mockReturnValue({ lean: jest.fn().mockRejectedValue(error) });
      Booking.find.mockReturnValue(chain);

      await bookingController.getMyBookings(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
    });
  });
});