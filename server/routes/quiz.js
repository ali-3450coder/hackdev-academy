const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const quizController = require('../controllers/quizController');

router.post('/answer',
  authMiddleware,
  [
    body('bolum_id').isInt({ min: 1 }),
    body('question_id').notEmpty(),
    body('selected_ans').isIn(['a', 'b', 'c', 'd']),
    body('is_correct').isBoolean()
  ],
  handleValidation,
  quizController.submitAnswer
);

router.post('/submit',
  authMiddleware,
  [
    body('bolum_id').isInt({ min: 1 }),
    body('answers').isArray({ min: 1 }),
    body('score').isInt({ min: 0 }),
    body('total').isInt({ min: 1 })
  ],
  handleValidation,
  quizController.submitAll
);

router.get('/results/:bolum_id', authMiddleware, quizController.getResults);

module.exports = router;
