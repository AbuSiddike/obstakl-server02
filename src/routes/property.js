const express = require('express');
const router = express.Router();
const {
  addProperty,
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  getMyListings,
  updateProperty,
  deleteProperty
} = require('../controllers/property');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Public routes
router.get('/', getProperties);
router.get('/featured', getFeaturedProperties);

// Private/Protected routes
router.post('/', verifyToken, checkRole('Owner'), addProperty);
router.get('/my-listings', verifyToken, checkRole('Owner'), getMyListings);
router.get('/:id', verifyToken, getPropertyById);
router.put('/:id', verifyToken, updateProperty);
router.delete('/:id', verifyToken, deleteProperty);

module.exports = router;
