const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { loginLimiter, refreshLimiter, registerLimiter } = require('../middleware/rateLimit');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register',
  registerLimiter,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 }).withMessage('Kullanıcı adı 3-30 karakter olmalı')
      .matches(/^[a-z0-9_-]+$/i).withMessage('Kullanıcı adı sadece harf, rakam, _ ve - içerebilir'),
    body('email')
      .isEmail().withMessage('Geçerli bir e-posta adresi girin')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalı')
      .matches(/[A-Z]/).withMessage('Şifre en az bir büyük harf içermeli')
      .matches(/[0-9]/).withMessage('Şifre en az bir rakam içermeli')
      .matches(/[^A-Za-z0-9]/).withMessage('Şifre en az bir özel karakter içermeli'),
    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Ad soyad 2-100 karakter olmalı')
  ],
  handleValidation,
  authController.register
);

// POST /api/auth/login
router.post('/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Geçerli bir e-posta girin'),
    body('password').notEmpty().withMessage('Şifre gerekli')
  ],
  handleValidation,
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

// POST /api/auth/refresh
router.post('/refresh', refreshLimiter, authController.refresh);

// GET /api/auth/me
router.get('/me', authMiddleware, authController.me);

// GET /api/auth/check-username
router.get('/check-username', authController.checkUsername);

module.exports = router;
