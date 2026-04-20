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

describe('Auth Controller', () => {
  let mockReq, mockRes;
  const mockFindOneWithSelect = (value) => ({ select: jest.fn().mockResolvedValue(value) });

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

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      process.env.JWT_SECRET = 'testSecret';
      jwt.sign.mockReturnValue('mockToken');

      const token = authController.generateToken('userId', 'employee');

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'userId', role: 'employee' },
        'testSecret',
        { expiresIn: '7d' }
      );
      expect(token).toBe('mockToken');
    });

    it('should throw error if JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;

      expect(() => authController.generateToken('userId', 'employee')).toThrow('JWT_SECRET is not set in environment');
    });
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

  describe('login', () => {
    it('should return validation errors if validation fails', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Email is required' }]
      });

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        errors: [{ msg: 'Email is required' }]
      });
    });

    it('should return error for invalid credentials - user not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = { emailOrUsername: 'test@example.com', password: 'password' };
      User.findOne.mockReturnValue(mockFindOneWithSelect(null));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should return error for deactivated account', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = { emailOrUsername: 'test@example.com', password: 'password' };
      User.findOne.mockReturnValue(mockFindOneWithSelect({ isActive: false }));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated'
      });
    });

    it('should return error for incorrect password', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = { emailOrUsername: 'test@example.com', password: 'wrongpassword' };
      const mockUser = {
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockReturnValue(mockFindOneWithSelect(mockUser));

      await authController.login(mockReq, mockRes);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials'
      });
    });

    it('should login successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      mockReq.body = { emailOrUsername: 'test@example.com', password: 'password' };
      const mockUser = {
        _id: 'userId',
        username: 'testuser',
        email: 'test@example.com',
        phone: '1234567890',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockReturnValue(mockFindOneWithSelect(mockUser));
      jwt.sign.mockReturnValue('mockToken');

      await authController.login(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        token: 'mockToken',
        user: {
          id: 'userId',
          username: 'testuser',
          email: 'test@example.com',
          phone: '1234567890',
          firstName: 'Test',
          lastName: 'User',
          role: 'employee'
        }
      });
    });
  });

  // Add more tests for other functions as needed
});