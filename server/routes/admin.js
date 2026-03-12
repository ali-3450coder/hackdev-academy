const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const adminController = require('../controllers/adminController');

router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getUsers);
router.get('/logs', adminController.getLogs);
router.put('/users/:id/status',
  [body('is_active').isBoolean()],
  handleValidation,
  adminController.setUserStatus
);

module.exports = router;
