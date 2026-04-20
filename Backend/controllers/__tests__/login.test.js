const authController = require('../authController');
const User = require('../../model/user');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../model/user');
jest.mock('jsonwebtoken');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validationResult } = require('express-validator');

const mockFindOneWithSelect = (value) => ({
  select: jest.fn().mockResolvedValue(value)
});

describe('Auth Controller - Login', () => {
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

  it('should return invalid credentials when user is not found', async () => {
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

  it('should return account deactivated when user is inactive', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    mockReq.body = { emailOrUsername: 'test@example.com', password: 'password' };
    const mockUser = { isActive: false };
    User.findOne.mockReturnValue(mockFindOneWithSelect(mockUser));

    await authController.login(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Account is deactivated'
    });
  });

  it('should return invalid credentials when password does not match', async () => {
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

  it('should login successfully with valid credentials', async () => {
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