const express = require('express');
const router  = express.Router();
const { body, param, query } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const c = require('../controllers/adminController');

// Tüm admin route'ları auth + admin yetkisi gerektirir
router.use(authMiddleware, adminMiddleware);

// ── İstatistikler ──────────────────────────────────────────────────────────
router.get('/stats',    c.getStats);
router.get('/db-stats', c.getDbStats);

// ── Kullanıcı Yönetimi ─────────────────────────────────────────────────────
router.get('/users',
  c.getUsers
);
router.get('/users/:id',
  param('id').isInt(), handleValidation,
  c.getUserDetail
);
router.put('/users/:id/status',
  [param('id').isInt(), body('is_active').isBoolean()], handleValidation,
  c.setUserStatus
);
router.put('/users/:id/role',
  [param('id').isInt(), body('role').isIn(['student', 'admin'])], handleValidation,
  c.setUserRole
);
router.put('/users/:id/profile',
  [param('id').isInt(),
   body('full_name').optional().isLength({ min: 1, max: 100 }),
   body('email').optional().isEmail(),
   body('phone').optional().isLength({ max: 20 }),
   body('bio').optional().isLength({ max: 500 })],
  handleValidation,
  c.updateUserProfile
);
router.post('/users/:id/reset-password',
  param('id').isInt(), handleValidation,
  c.resetUserPassword
);
router.delete('/users/:id/progress',
  param('id').isInt(), handleValidation,
  c.resetUserProgress
);
router.delete('/users/:id/quiz',
  param('id').isInt(), handleValidation,
  c.resetUserQuiz
);
router.post('/users/:id/certificates',
  [param('id').isInt(), body('bolum_id').isInt({ min: 1, max: 3 })], handleValidation,
  c.issueCertificate
);
router.delete('/users/:id',
  param('id').isInt(), handleValidation,
  c.deleteUser
);

// ── Sertifikalar ───────────────────────────────────────────────────────────
router.get('/certificates',     c.getCertificates);
router.delete('/certificates/:id',
  param('id').isInt(), handleValidation,
  c.revokeCertificate
);

// ── Loglar ────────────────────────────────────────────────────────────────
router.get('/logs',    c.getLogs);
router.delete('/logs', c.clearLogs);

// ── Dışa Aktarma ──────────────────────────────────────────────────────────
router.get('/export/users.csv', c.exportUsersCSV);

module.exports = router;
