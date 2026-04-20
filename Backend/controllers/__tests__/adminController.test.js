const adminController = require('../adminController');
const User = require('../../model/user');

jest.mock('../../model/user');

describe('Admin Controller - User Management', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: { id: 'userId' },
      user: { id: 'currentUserId' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return all users without passwords', async () => {
      const users = [{ _id: '1' }, { _id: '2' }];
      User.find.mockReturnValue({ select: jest.fn().mockResolvedValue(users) });

      await adminController.getUsers(mockReq, mockRes);

      expect(User.find).toHaveBeenCalledWith();
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, count: users.length, data: users });
    });

    it('should return server error when User.find fails', async () => {
      const error = new Error('DB failure');
      User.find.mockReturnValue({ select: jest.fn().mockRejectedValue(error) });

      await adminController.getUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
    });
  });

  describe('createUser', () => {
    it('should return 400 if user already exists', async () => {
      mockReq.body = { username: 'testuser', email: 'test@example.com', phone: '12345', password: 'pass', firstName: 'Test', lastName: 'User' };
      User.findOne.mockResolvedValue({ _id: 'existing' });

      await adminController.createUser(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ email: 'test@example.com' }, { username: 'testuser' }] });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'User with this email or username already exists' });
    });

    it('should create a new user successfully', async () => {
      mockReq.body = { username: 'newuser', email: 'new@example.com', phone: '12345', password: 'pass', firstName: 'New', lastName: 'User', role: 'manager' };
      User.findOne.mockResolvedValue(null);
      const savedUser = { _id: 'newUserId', username: 'newuser' };
      const userInstance = { save: jest.fn().mockResolvedValue(), _id: 'newUserId' };
      User.mockImplementation(() => userInstance);
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(savedUser) });

      await adminController.createUser(mockReq, mockRes);

      expect(User).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        phone: '12345',
        password: 'pass',
        firstName: 'New',
        lastName: 'User',
        role: 'manager'
      });
      expect(userInstance.save).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('newUserId');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'User created successfully', data: savedUser });
    });

    it('should return server error when user creation fails', async () => {
      mockReq.body = { username: 'newuser', email: 'new@example.com', phone: '12345', password: 'pass' };
      User.findOne.mockRejectedValue(new Error('DB error'));

      await adminController.createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
    });
  });

  describe('updateUser', () => {
    it('should return 404 when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await adminController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    });

    it('should return 400 when admin tries to deactivate self', async () => {
      const user = { _id: { toString: () => 'currentUserId' }, isActive: true, save: jest.fn() };
      User.findById.mockResolvedValue(user);
      mockReq.body = { isActive: false };

      await adminController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Cannot deactivate your own account' });
    });

    it('should update user role and isActive', async () => {
      const user = { _id: { toString: () => 'otherUserId' }, isActive: true, save: jest.fn().mockResolvedValue() };
      User.findById.mockResolvedValue(user);
      mockReq.body = { role: 'manager', isActive: false };
      const updatedUser = { _id: 'otherUserId', role: 'manager', isActive: false };
      User.findById.mockReturnValueOnce(Promise.resolve(user)).mockReturnValueOnce({ select: jest.fn().mockResolvedValue(updatedUser) });

      await adminController.updateUser(mockReq, mockRes);

      expect(user.save).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledTimes(2);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'User updated successfully', data: updatedUser });
    });

    it('should return server error when update fails', async () => {
      User.findById.mockRejectedValue(new Error('DB error'));

      await adminController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
    });
  });
});