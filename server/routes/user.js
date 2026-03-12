const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const userController = require('../controllers/userController');

router.get('/profile', authMiddleware, userController.getProfile);

router.put('/profile',
  authMiddleware,
  [
    body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('username').optional().trim().isLength({ min: 3, max: 30 })
      .matches(/^[a-z0-9_-]+$/i)
  ],
  handleValidation,
  userController.updateProfile
);

router.put('/password',
  authMiddleware,
  [
    body('current_password').notEmpty().withMessage('Mevcut şifre gerekli'),
    body('new_password')
      .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalı')
      .matches(/[A-Z]/).withMessage('En az bir büyük harf')
      .matches(/[0-9]/).withMessage('En az bir rakam')
      .matches(/[^A-Za-z0-9]/).withMessage('En az bir özel karakter')
  ],
  handleValidation,
  userController.changePassword
);

router.get('/activity', authMiddleware, userController.getActivity);

module.exports = router;
