const authController = require('../authController');
const User = require('../../model/user');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../services/sendEmail');

// Mock dependencies
jest.mock('../../model/user');
jest.mock('jsonwebtoken');
jest.mock('../../services/sendEmail');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');

describe('Auth Controller - Signup', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    process.env.JWT_SECRET = 'testSecret';

    mockReq = {
      body: {},
      user: { id: 'userId' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should return validation errors if validation fails', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid email' }]
      });

      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        errors: [{ msg: 'Invalid email' }]
      });
    });

    it('should return error if user already exists', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };
      User.findOne.mockResolvedValue({ _id: 'existingId' });

      await authController.signup(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'test@example.com' }, { username: 'testuser' }]
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email or username already exists'
      });
    });

    it('should create a new user successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee'
      };
      User.findOne.mockResolvedValue(null);
      const mockUser = {
        _id: 'newUserId',
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee',
        save: jest.fn().mockResolvedValue()
      };
      User.mockImplementation(() => mockUser);
      jwt.sign.mockReturnValue('mockToken');

      await authController.signup(mockReq, mockRes);

      expect(User).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee'
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        token: 'mockToken',
        user: {
          id: 'newUserId',
          username: 'testuser',
          email: 'test@example.com',
          phone: '1234567890',
          firstName: 'Test',
          lastName: 'User',
          role: 'employee'
        }
      });
    });

    it('should handle server errors', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = {
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123'
      };
      User.findOne.mockRejectedValue(new Error('DB error'));

      await authController.signup(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });
  });
});