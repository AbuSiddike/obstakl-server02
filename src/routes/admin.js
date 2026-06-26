const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  changeUserRole,
  getAllPropertiesAdmin,
  updatePropertyStatus,
  getAdminStats
} = require('../controllers/admin');
const { verifyToken, checkRole } = require('../middlewares/auth');

// Protect all admin endpoints with Admin role check
router.use(verifyToken, checkRole('Admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', changeUserRole);
router.get('/properties', getAllPropertiesAdmin);
router.patch('/properties/:id/status', updatePropertyStatus);
router.get('/stats', getAdminStats);

module.exports = router;
