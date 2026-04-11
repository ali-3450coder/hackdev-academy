const db = require('../config/database');
const { logActivity } = require('../middleware/logger');

async function submitAnswer(req, res) {
  try {
    const { bolum_id, question_id, selected_ans, is_correct } = req.body;
    const userId = req.user.id;

    const existing = await db('quiz_answers')
      .where({ user_id: userId, bolum_id, question_id })
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await db('quiz_answers')
        .where({ user_id: userId, bolum_id, question_id })
        .update({ selected_ans, is_correct: is_correct ? 1 : 0, answered_at: now });
    } else {
      await db('quiz_answers').insert({
        user_id: userId,
        bolum_id,
        question_id,
        selected_ans,
        is_correct: is_correct ? 1 : 0,
        answered_at: now
      });
    }

    res.json({ success: true });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function submitAll(req, res) {
  try {
    const { bolum_id, answers, score, total } = req.body;
    const userId = req.user.id;
    const passed = (score / total) >= 0.7 ? 1 : 0;
    const now = new Date().toISOString();

    // Tüm cevapları upsert
    for (const ans of answers) {
      const existing = await db('quiz_answers')
        .where({ user_id: userId, bolum_id, question_id: ans.question_id })
        .first();

      if (existing) {
        await db('quiz_answers')
          .where({ user_id: userId, bolum_id, question_id: ans.question_id })
          .update({
            selected_ans: ans.selected_ans,
            is_correct: ans.is_correct ? 1 : 0,
            answered_at: now
          });
      } else {
        await db('quiz_answers').insert({
          user_id: userId,
          bolum_id,
          question_id: ans.question_id,
          selected_ans: ans.selected_ans,
          is_correct: ans.is_correct ? 1 : 0,
          answered_at: now
        });
      }
    }

    // Quiz sonucunu upsert
    const existingResult = await db('bolum_quiz_results')
      .where({ user_id: userId, bolum_id })
      .first();

    if (existingResult) {
      await db('bolum_quiz_results')
        .where({ user_id: userId, bolum_id })
        .update({ 
          score, 
          total, 
          passed, 
          last_attempt_at: now,
          best_score: db.raw('CASE WHEN ? > best_score THEN ? ELSE best_score END', [score, score]),
          attempt_count: db.raw('attempt_count + 1')
        });
    } else {
      await db('bolum_quiz_results').insert({
        user_id: userId, 
        bolum_id, 
        score, 
        total, 
        passed, 
        best_score: score,
        attempt_count: 1,
        last_attempt_at: now
      });
    }

    await logActivity(userId, 'quiz_submit', { bolum_id, score, total, passed }, req);

    res.json({ passed: !!passed, score, total, percent: Math.round((score / total) * 100) });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function getResults(req, res) {
  try {
    const { bolum_id } = req.params;
    const userId = req.user.id;

    const result = await db('bolum_quiz_results')
      .where({ user_id: userId, bolum_id: parseInt(bolum_id) })
      .first();

    const answers = await db('quiz_answers')
      .where({ user_id: userId, bolum_id: parseInt(bolum_id) });

    res.json({ result: result || null, answers });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

module.exports = { submitAnswer, submitAll, getResults };
