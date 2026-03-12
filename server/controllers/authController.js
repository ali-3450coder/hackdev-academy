const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const jwtConfig = require('../config/jwt');
const { logActivity } = require('../middleware/logger');

function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId, role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.accessExpires }
  );

  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  return { accessToken, refreshToken, tokenHash };
}

function setRefreshCookie(res, refreshToken, rememberMe = false) {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'Strict',
    maxAge,
    path: '/api/auth'
  });
}

async function register(req, res) {
  try {
    const { username, email, password, full_name } = req.body;

    // Benzersizlik kontrolü
    const existing = await db('users')
      .where('email', email.toLowerCase())
      .orWhere('username', username.toLowerCase())
      .first();

    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'email' : 'username';
      return res.status(409).json({ error: `Bu ${field === 'email' ? 'e-posta' : 'kullanıcı adı'} zaten kullanımda` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [userId] = await db('users').insert({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name,
      role: 'student',
      avatar_seed: username.toLowerCase()
    });

    const { accessToken, refreshToken, tokenHash } = generateTokens(userId, 'student');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('refresh_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    await logActivity(userId, 'register', { username, email: email.toLowerCase() }, req);

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: { id: userId, username: username.toLowerCase(), email: email.toLowerCase(), full_name, role: 'student' },
      accessToken
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await db('users').where('email', email.toLowerCase()).first();

    if (!user) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmıştır' });
    }

    // last_login_at güncelle
    await db('users').where('id', user.id).update({ last_login_at: new Date().toISOString() });

    // Eski tokenları temizle (bu IP/agent için)
    await db('refresh_tokens')
      .where('user_id', user.id)
      .where('ip_address', req.ip)
      .delete();

    const { accessToken, refreshToken, tokenHash } = generateTokens(user.id, user.role);

    const refreshExpires = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + refreshExpires * 24 * 60 * 60 * 1000);

    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    await logActivity(user.id, 'login', { rememberMe: !!rememberMe }, req);

    setRefreshCookie(res, refreshToken, !!rememberMe);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      accessToken
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db('refresh_tokens').where('token_hash', tokenHash).update({
        revoked_at: new Date().toISOString()
      });
    }

    await logActivity(req.user?.id, 'logout', null, req);

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Çıkış yapıldı' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token bulunamadı' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const stored = await db('refresh_tokens')
      .where('token_hash', tokenHash)
      .first();

    if (!stored || new Date(stored.expires_at) < new Date()) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    }

    // Revoke edilmiş token — ama son 60 saniye içinde döndürülen successor token varsa kabul et
    if (stored.revoked_at) {
      const revokedAt = new Date(stored.revoked_at);
      const gracePeriodMs = 60 * 1000; // 60 saniye grace period
      if (Date.now() - revokedAt.getTime() > gracePeriodMs) {
        res.clearCookie('refreshToken', { path: '/api/auth' });
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
      }
      // Grace period içinde: successor token'ı bul ve döndür
      const successor = await db('refresh_tokens')
        .where('user_id', stored.user_id)
        .where('ip_address', req.ip)
        .whereNull('revoked_at')
        .where('expires_at', '>', new Date().toISOString())
        .orderBy('created_at', 'desc')
        .first();
      if (successor) {
        const user = await db('users').where('id', stored.user_id).first();
        if (!user || !user.is_active) {
          return res.status(401).json({ error: 'Kullanıcı bulunamadı veya devre dışı' });
        }
        const accessToken = jwt.sign(
          { userId: user.id, role: user.role },
          jwtConfig.secret,
          { expiresIn: jwtConfig.accessExpires }
        );
        return res.json({ accessToken });
      }
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    }

    const user = await db('users').where('id', stored.user_id).first();
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı veya devre dışı' });
    }

    // Token rotation
    await db('refresh_tokens').where('token_hash', tokenHash).update({
      revoked_at: new Date().toISOString()
    });

    const { accessToken, refreshToken: newRefreshToken, tokenHash: newHash } = generateTokens(user.id, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('refresh_tokens').insert({
      user_id: user.id,
      token_hash: newHash,
      expires_at: expiresAt.toISOString(),
      user_agent: req.headers['user-agent'],
      ip_address: req.ip
    });

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function me(req, res) {
  try {
    const user = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'avatar_seed', 'created_at', 'last_login_at')
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ user });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function checkUsername(req, res) {
  try {
    const { username } = req.query;
    if (!username || username.length < 3) {
      return res.json({ available: false });
    }

    const existing = await db('users').where('username', username.toLowerCase()).first();
    res.json({ available: !existing });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

module.exports = { register, login, logout, refresh, me, checkUsername };
