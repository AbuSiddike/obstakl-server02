const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmBooking,
  getMyBookings,
  getBookingRequests,
  updateBookingStatus,
  getAllBookings,
  getAllTransactions,
  getOwnerAnalytics,
  downloadOwnerReport
} = require('../controllers/booking');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Tenant routes
router.post('/create-payment-intent', verifyToken, checkRole('Tenant'), createPaymentIntent);
router.post('/confirm', verifyToken, checkRole('Tenant'), confirmBooking);
router.get('/my-bookings', verifyToken, checkRole('Tenant'), getMyBookings);

// Owner routes
router.get('/requests', verifyToken, checkRole('Owner'), getBookingRequests);
router.patch('/:id/status', verifyToken, checkRole('Owner', 'Admin'), updateBookingStatus);
router.get('/owner-analytics', verifyToken, checkRole('Owner'), getOwnerAnalytics);
router.get('/owner-report', verifyToken, checkRole('Owner'), downloadOwnerReport);

// Admin routes
router.get('/all', verifyToken, checkRole('Admin'), getAllBookings);
router.get('/transactions', verifyToken, checkRole('Admin'), getAllTransactions);

module.exports = router;
