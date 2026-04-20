const maintenanceController = require('../maintenanceController');
const MaintenanceRequest = require('../../model/maintenanceRequest');
const User = require('../../model/user');
const notificationService = require('../../services/notificationService');

jest.mock('../../model/maintenanceRequest');
jest.mock('../../model/user');
jest.mock('../../services/notificationService');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');

describe('Maintenance Controller', () => {
  let mockReq;
  let mockRes;

  const createQueryChain = (result) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue(result)
  });

  const createFindByIdChain = (result) => {
    const secondPopulate = { populate: jest.fn().mockResolvedValue(result) };
    return {
      populate: jest.fn().mockReturnValue(secondPopulate)
    };
  };

  beforeEach(() => {
    mockReq = {
      body: {},
      params: { id: 'requestId' },
      user: { id: 'userId', role: 'employee' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should return validation errors if validation fails', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Title is required' }]
      });

      await maintenanceController.createRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        errors: [{ msg: 'Title is required' }]
      });
    });

    it('should create a maintenance request successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = {
        title: 'Leaky faucet',
        type: 'Plumbing',
        priority: 'Medium',
        location: 'Office 101',
        description: 'Sink is leaking underneath'
      };
      const mockRequest = {
        _id: 'newRequestId',
        ...mockReq.body,
        submittedBy: 'userId',
        save: jest.fn().mockResolvedValue()
      };
      MaintenanceRequest.mockImplementation(() => mockRequest);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ firstName: 'Test', lastName: 'User', username: 'testuser' })
      });
      notificationService.getUsersByRole.mockResolvedValue([]);
      notificationService.requestCreatedNotification.mockReturnValue({});
      notificationService.notifyMultiple.mockResolvedValue();

      await maintenanceController.createRequest(mockReq, mockRes);

      expect(MaintenanceRequest).toHaveBeenCalledWith({
        ...mockReq.body,
        submittedBy: 'userId'
      });
      expect(mockRequest.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockRequest });
    });

    it('should handle server errors during create', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = {
        title: 'Broken light',
        type: 'Electrical',
        priority: 'High',
        location: 'Lobby',
        description: 'Light fixture is broken'
      };
      const mockRequest = { save: jest.fn().mockRejectedValue(new Error('DB error')) };
      MaintenanceRequest.mockImplementation(() => mockRequest);

      await maintenanceController.createRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
    });
  });

  describe('getRequestById', () => {
    it('should return 404 when request is not found', async () => {
      MaintenanceRequest.findById.mockReturnValue(createFindByIdChain(null));

      await maintenanceController.getRequestById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request not found'
      });
    });

    it('should return 403 if employee requests another user request', async () => {
      const mockRequest = {
        _id: 'requestId',
        submittedBy: { _id: 'otherUserId' }
      };
      MaintenanceRequest.findById.mockReturnValue(createFindByIdChain(mockRequest));

      await maintenanceController.getRequestById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized - can only view your own requests'
      });
    });

    it('should return the request for the request owner', async () => {
      const mockRequest = {
        _id: 'requestId',
        submittedBy: { _id: 'userId' }
      };
      MaintenanceRequest.findById.mockReturnValue(createFindByIdChain(mockRequest));

      await maintenanceController.getRequestById(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockRequest });
    });
  });
});