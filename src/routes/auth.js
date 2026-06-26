const express = require('express');
const router = express.Router();
const { register, login, socialLogin, getMe, logout } = require('../controllers/auth');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/social-login', socialLogin);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);

module.exports = router;
