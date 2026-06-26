const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const { generateEarningsPDF } = require('../utils/pdfGenerator');

const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (
  stripeKey &&
  !stripeKey.startsWith('your_') &&
  !stripeKey.startsWith('sk_test_placeholder')
) {
  try {
    stripe = require('stripe')(stripeKey);
  } catch (err) {
    console.error('Failed to initialize Stripe:', err.message);
  }
}

// Create payment intent
const createPaymentIntent = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }

    if (property.status !== 'Approved') {
      return sendError(res, 400, 'Cannot book a non-approved property');
    }

    const rentAmount = property.rent; // in USD
    const amountInCents = Math.round(rentAmount * 100);

    if (!stripe) {
      return sendError(
        res,
        500,
        'Stripe is not configured or failed to initialize'
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          propertyId: propertyId,
          tenantId: req.user.id,
        },
      });

      return sendSuccess(res, 200, 'Payment intent created successfully', {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: rentAmount,
      });
    } catch (stripeErr) {
      console.error('Stripe API error:', stripeErr.message);
      return sendError(res, 500, `Stripe API error: ${stripeErr.message}`);
    }
  } catch (error) {
    next(error);
  }
};

// Confirm booking after successful payment
const confirmBooking = async (req, res, next) => {
  try {
    const {
      propertyId,
      moveInDate,
      contactNumber,
      additionalNotes,
      transactionId,
      amountPaid,
    } = req.body;

    if (
      !propertyId ||
      !ObjectId.isValid(propertyId) ||
      !moveInDate ||
      !contactNumber ||
      !transactionId ||
      !amountPaid
    ) {
      return sendError(
        res,
        400,
        'Missing required fields for booking confirmation'
      );
    }

    const db = getDB();
    const propertiesCollection = db.collection('properties');
    const bookingsCollection = db.collection('bookings');
    const transactionsCollection = db.collection('transactions');
    const usersCollection = db.collection('user');

    // Check if transaction was already registered
    const existingBooking = await bookingsCollection.findOne({ transactionId });
    if (existingBooking) {
      return sendError(
        res,
        400,
        'This transaction has already been registered'
      );
    }

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }

    const tenantUser = await usersCollection.findOne({
      _id: new ObjectId(req.user.id),
    });
    if (!tenantUser) {
      return sendError(res, 404, 'Tenant user not found');
    }

    // Insert booking
    const newBooking = {
      propertyId: new ObjectId(propertyId),
      propertyName: property.title,
      tenant: {
        id: tenantUser._id.toString(),
        name: tenantUser.name,
        email: tenantUser.email,
        photo: tenantUser.photo,
      },
      owner: {
        id: property.owner.id,
        name: property.owner.name,
        email: property.owner.email,
      },
      moveInDate: new Date(moveInDate),
      contactNumber,
      additionalNotes: additionalNotes || '',
      bookingStatus: 'Pending', // initial status
      paymentStatus: 'Paid',
      amountPaid: Number(amountPaid),
      transactionId,
      createdAt: new Date(),
    };

    const bookingResult = await bookingsCollection.insertOne(newBooking);
    newBooking._id = bookingResult.insertedId.toString();

    // Insert transaction
    const newTransaction = {
      transactionId,
      propertyId: new ObjectId(propertyId),
      propertyName: property.title,
      tenantName: tenantUser.name,
      ownerName: property.owner.name,
      amount: Number(amountPaid),
      date: new Date(),
      createdAt: new Date(),
    };

    await transactionsCollection.insertOne(newTransaction);

    return sendSuccess(
      res,
      201,
      'Booking and transaction created successfully',
      newBooking
    );
  } catch (error) {
    next(error);
  }
};

// Get bookings of logged in tenant
const getMyBookings = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    const bookings = await bookingsCollection
      .find({ 'tenant.id': req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(res, 200, 'My bookings fetched successfully', bookings);
  } catch (error) {
    next(error);
  }
};

// Get bookings requested from owners properties
const getBookingRequests = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    const requests = await bookingsCollection
      .find({ 'owner.id': req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(
      res,
      200,
      'Booking requests fetched successfully',
      requests
    );
  } catch (error) {
    next(error);
  }
};

// Approve or reject booking request
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved or Rejected

    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid booking ID');
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Status must be Approved or Rejected');
    }

    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return sendError(res, 404, 'Booking not found');
    }

    // Verify ownership or Admin role
    if (booking.owner.id !== req.user.id && req.user.role !== 'Admin') {
      return sendError(
        res,
        403,
        'Forbidden: You do not have permission to manage this booking'
      );
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { bookingStatus: status } }
    );

    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(id),
    });
    return sendSuccess(
      res,
      200,
      `Booking request ${status.toLowerCase()} successfully`,
      updatedBooking
    );
  } catch (error) {
    next(error);
  }
};

// Get all bookings (Admin only)
const getAllBookings = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection('bookings');

    const bookings = await bookingsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(res, 200, 'All bookings fetched successfully', bookings);
  } catch (error) {
    next(error);
  }
};

// Get all transactions (Admin only)
const getAllTransactions = async (req, res, next) => {
  try {
    const db = getDB();
    const transactionsCollection = db.collection('transactions');

    const transactions = await transactionsCollection
      .find()
      .sort({ date: -1 })
      .toArray();

    return sendSuccess(
      res,
      200,
      'All transactions fetched successfully',
      transactions
    );
  } catch (error) {
    next(error);
  }
};

// Owner analytics
const getOwnerAnalytics = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection('bookings');
    const propertiesCollection = db.collection('properties');

    // Count owner properties
    const totalProperties = await propertiesCollection.countDocuments({
      'owner.id': req.user.id,
    });

    // Find all bookings for owner properties
    const ownerBookings = await bookingsCollection
      .find({ 'owner.id': req.user.id })
      .toArray();

    // Total earnings (sum of payments)
    const totalEarnings = ownerBookings.reduce(
      (sum, b) => sum + (b.amountPaid || 0),
      0
    );

    // Total confirmed/approved bookings
    const totalBookings = ownerBookings.filter(
      (b) => b.bookingStatus === 'Approved'
    ).length;

    // Monthly earnings for the last 12 months
    const last12Months = [];
    const now = new Date();

    // Initialize last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      last12Months.push({
        label: `${monthLabel} ${year}`,
        monthNum: d.getMonth(),
        yearNum: year,
        earnings: 0,
      });
    }

    // Populate earnings per month from bookings
    ownerBookings.forEach((booking) => {
      const bDate = new Date(booking.createdAt);
      const bMonth = bDate.getMonth();
      const bYear = bDate.getFullYear();

      const monthObj = last12Months.find(
        (m) => m.monthNum === bMonth && m.yearNum === bYear
      );
      if (monthObj) {
        monthObj.earnings += booking.amountPaid;
      }
    });

    const monthlyEarningsChart = last12Months.map((m) => ({
      name: m.label,
      earnings: m.earnings,
    }));

    return sendSuccess(res, 200, 'Owner analytics fetched successfully', {
      totalEarnings,
      totalProperties,
      totalBookings,
      monthlyEarningsChart,
    });
  } catch (error) {
    next(error);
  }
};

// Owner download PDF report
const downloadOwnerReport = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingsCollection = db.collection('bookings');
    const propertiesCollection = db.collection('properties');

    const ownerName = req.user.name || 'Owner';
    const ownerEmail = req.user.email;

    const totalProperties = await propertiesCollection.countDocuments({
      'owner.id': req.user.id,
    });

    // Get all approved bookings for this owner
    const bookings = await bookingsCollection
      .find({
        'owner.id': req.user.id,
        bookingStatus: 'Approved',
      })
      .sort({ createdAt: -1 })
      .toArray();

    const totalEarnings = bookings.reduce(
      (sum, b) => sum + (b.amountPaid || 0),
      0
    );
    const totalBookings = bookings.length;

    const reportData = {
      ownerName,
      ownerEmail,
      totalProperties,
      totalBookings,
      totalEarnings,
      bookings,
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="earnings-report-${Date.now()}.pdf"`
    );

    generateEarningsPDF(res, reportData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmBooking,
  getMyBookings,
  getBookingRequests,
  updateBookingStatus,
  getAllBookings,
  getAllTransactions,
  getOwnerAnalytics,
  downloadOwnerReport,
};
