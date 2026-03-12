const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const progressController = require('../controllers/progressController');

router.get('/dashboard', authMiddleware, progressController.getDashboard);

router.post('/konu',
  authMiddleware,
  [
    body('bolum_id').isInt({ min: 1, max: 3 }).withMessage('Geçersiz bölüm ID'),
    body('konu_id').notEmpty().withMessage('Konu ID gerekli'),
    body('status').isIn(['not_started', 'in_progress', 'completed']).withMessage('Geçersiz durum')
  ],
  handleValidation,
  progressController.updateKonu
);

router.get('/bolum/:bolum_id', authMiddleware, progressController.getBolum);

router.post('/task',
  authMiddleware,
  [
    body('bolum_id').isInt({ min: 1 }),
    body('task_id').notEmpty(),
    body('completed').isBoolean()
  ],
  handleValidation,
  progressController.updateTask
);

module.exports = router;
