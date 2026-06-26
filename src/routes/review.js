const express = require('express');
const router = express.Router();
const { addReview, getPropertyReviews, deleteReview, getMyReviews, getAllReviews } = require('../controllers/review');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.get('/', getAllReviews);
router.get('/my-reviews', verifyToken, checkRole('Tenant'), getMyReviews);
router.get('/property/:propertyId', getPropertyReviews);
router.post('/', verifyToken, checkRole('Tenant'), addReview);
router.delete('/:id', verifyToken, deleteReview);

module.exports = router;
