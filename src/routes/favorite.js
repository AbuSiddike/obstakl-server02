const express = require('express');
const router = express.Router();
const { addFavorite, removeFavorite, getFavorites } = require('../controllers/favorite');
const { verifyToken, checkRole } = require('../middlewares/auth');

router.get('/', verifyToken, checkRole('Tenant'), getFavorites);
router.post('/', verifyToken, checkRole('Tenant'), addFavorite);
router.delete('/:propertyId', verifyToken, checkRole('Tenant'), removeFavorite);

module.exports = router;
