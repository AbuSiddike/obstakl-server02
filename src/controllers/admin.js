const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

// Get all users (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('user');

    const users = await usersCollection.find()
      .project({ password: 0 }) // Exclude password hash for security
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(res, 200, 'All users fetched successfully', users);
  } catch (error) {
    next(error);
  }
};

// Change user role (Admin only)
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid user ID');
    }

    const validRoles = ['Tenant', 'Owner', 'Admin'];
    if (!role || !validRoles.includes(role)) {
      return sendError(res, 400, 'Invalid role. Must be Tenant, Owner, or Admin');
    }

    const db = getDB();
    const usersCollection = db.collection('user');

    // Prevent Admin from changing their own role
    if (id === req.user.id) {
      return sendError(res, 400, 'You cannot change your own role');
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return sendError(res, 404, 'User not found');
    }

    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
    return sendSuccess(res, 200, `User role changed to ${role} successfully`, updatedUser);
  } catch (error) {
    next(error);
  }
};

// Get all properties for moderation (Admin only)
const getAllPropertiesAdmin = async (req, res, next) => {
  try {
    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const properties = await propertiesCollection.find()
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(res, 200, 'All properties fetched for moderation', properties);
  } catch (error) {
    next(error);
  }
};

// Update property status (Approve or Reject with feedback) (Admin only)
const updatePropertyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionFeedback } = req.body;

    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Status must be Approved or Rejected');
    }

    if (status === 'Rejected' && (!rejectionFeedback || rejectionFeedback.trim() === '')) {
      return sendError(res, 400, 'Rejection feedback is required when rejecting a property');
    }

    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const updateDoc = {
      status,
      rejectionFeedback: status === 'Rejected' ? rejectionFeedback : ''
    };

    const result = await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return sendError(res, 404, 'Property not found');
    }

    const updatedProperty = await propertiesCollection.findOne({ _id: new ObjectId(id) });
    return sendSuccess(res, 200, `Property status updated to ${status} successfully`, updatedProperty);
  } catch (error) {
    next(error);
  }
};

// Admin general statistics
const getAdminStats = async (req, res, next) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('user');
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');
    const transactionsCollection = db.collection('transactions');

    const totalUsers = await usersCollection.countDocuments();
    const totalProperties = await propertiesCollection.countDocuments();
    const pendingProperties = await propertiesCollection.countDocuments({ status: 'Pending' });
    const approvedProperties = await propertiesCollection.countDocuments({ status: 'Approved' });
    const rejectedProperties = await propertiesCollection.countDocuments({ status: 'Rejected' });
    
    const totalBookings = await bookingsCollection.countDocuments();
    const approvedBookings = await bookingsCollection.countDocuments({ bookingStatus: 'Approved' });

    const transactions = await transactionsCollection.find().toArray();
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return sendSuccess(res, 200, 'Admin stats fetched successfully', {
      users: { total: totalUsers },
      properties: {
        total: totalProperties,
        pending: pendingProperties,
        approved: approvedProperties,
        rejected: rejectedProperties
      },
      bookings: {
        total: totalBookings,
        approved: approvedBookings
      },
      revenue: {
        total: totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  changeUserRole,
  getAllPropertiesAdmin,
  updatePropertyStatus,
  getAdminStats
};
