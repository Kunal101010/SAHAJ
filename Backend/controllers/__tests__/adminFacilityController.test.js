const adminController = require('../adminController');
const Facility = require('../../model/facility');

jest.mock('../../model/facility');

describe('Admin Controller - Facility Management', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: { id: 'facilityId' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('should return active facilities', async () => {
    const facilities = [{ _id: '1' }];
    const sort = jest.fn().mockResolvedValue(facilities);
    Facility.find.mockReturnValue({ sort });

    await adminController.getAllFacilities(mockReq, mockRes);

    expect(Facility.find).toHaveBeenCalledWith({ isActive: true });
    expect(sort).toHaveBeenCalledWith({ name: 1 });
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, count: facilities.length, data: facilities });
  });

  it('should return all facilities', async () => {
    const facilities = [{ _id: '1' }];
    const sort = jest.fn().mockResolvedValue(facilities);
    Facility.find.mockReturnValue({ sort });

    await adminController.getFacilities(mockReq, mockRes);

    expect(Facility.find).toHaveBeenCalledWith();
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, count: facilities.length, data: facilities });
  });

  it('should create a facility successfully', async () => {
    mockReq.body = { name: 'Test', capacity: 10, location: 'Room 1' };
    const facilityInstance = { save: jest.fn().mockResolvedValue() };
    Facility.mockImplementation(() => facilityInstance);

    await adminController.createFacility(mockReq, mockRes);

    expect(Facility).toHaveBeenCalledWith(mockReq.body);
    expect(facilityInstance.save).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: facilityInstance });
  });

  it('should update a facility successfully', async () => {
    const updatedFacility = { _id: 'facilityId', name: 'Test' };
    Facility.findByIdAndUpdate.mockResolvedValue(updatedFacility);
    mockReq.params.id = 'facilityId';
    mockReq.body = { name: 'Test' };

    await adminController.updateFacility(mockReq, mockRes);

    expect(Facility.findByIdAndUpdate).toHaveBeenCalledWith('facilityId', { name: 'Test' }, { new: true, runValidators: true });
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedFacility });
  });

  it('should return 404 when facility to update is not found', async () => {
    Facility.findByIdAndUpdate.mockResolvedValue(null);
    mockReq.params.id = 'facilityId';
    mockReq.body = { name: 'Test' };

    await adminController.updateFacility(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Facility not found' });
  });

  it('should delete a facility successfully', async () => {
    Facility.findByIdAndDelete.mockResolvedValue({ _id: 'facilityId' });
    mockReq.params.id = 'facilityId';

    await adminController.deleteFacility(mockReq, mockRes);

    expect(Facility.findByIdAndDelete).toHaveBeenCalledWith('facilityId');
    expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Facility deleted successfully' });
  });

  it('should return 404 when facility to delete is not found', async () => {
    Facility.findByIdAndDelete.mockResolvedValue(null);
    mockReq.params.id = 'facilityId';

    await adminController.deleteFacility(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Facility not found' });
  });
});