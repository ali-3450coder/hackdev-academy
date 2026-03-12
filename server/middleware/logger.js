const db = require('../config/database');

async function logActivity(userId, eventType, eventData, req) {
  try {
    await db('activity_logs').insert({
      user_id: userId || null,
      event_type: eventType,
      event_data: eventData ? JSON.stringify(eventData) : null,
      ip_address: req ? (req.ip || req.connection?.remoteAddress) : null,
      user_agent: req ? req.headers['user-agent'] : null
    });
  } catch (err) {
    // Log hatası uygulamayı durdurmasın
    if (process.env.NODE_ENV !== 'production') {
      console.error('Activity log error:', err.message);
    }
  }
}

function requestLogger(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
}

module.exports = { logActivity, requestLogger };
