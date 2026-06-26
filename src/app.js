const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/property');
const bookingRoutes = require('./routes/booking');
const reviewRoutes = require('./routes/review');
const favoriteRoutes = require('./routes/favorite');
const adminRoutes = require('./routes/admin');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Base route for server status
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Obstakl server is running',
    availableRoutes: ['/health', '/api/auth', '/api/properties', '/api/bookings', '/api/reviews', '/api/favorites', '/api/admin']
  });
});

// Base route for API health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Route mappings
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
