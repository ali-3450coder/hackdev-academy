// HackDev Academy — API İstemcisi

const API = (function() {
  const BASE_URL = '/api';
  const SESSION_KEY = '_hackdev_at';

  // Sayfa yenilenmesinde access token'ı sessionStorage'dan geri yükle
  let _accessToken = (function() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      const { token, exp } = JSON.parse(stored);
      if (exp > Date.now() + 30000) return token; // 30s buffer
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    return null;
  })();

  function _saveToken(t) {
    _accessToken = t;
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split('.')[1]));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: t, exp: payload.exp * 1000 }));
      } catch {}
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  function getToken() { return _accessToken; }
  function setToken(t) { _saveToken(t); }
  function clearToken() { _saveToken(null); }

  async function request(method, endpoint, body, retry = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

    const opts = { method, headers, credentials: 'include' };
    if (body) opts.body = JSON.stringify(body);

    try {
      let res = await fetch(BASE_URL + endpoint, opts);

      // 401 — önce token yenilemeyi dene, sonra redirect
      if (res.status === 401 && retry) {
        const refreshed = await _refresh();
        if (refreshed) {
          return request(method, endpoint, body, false);
        }
        _redirectToLogin();
        return null;
      }

      return res;
    } catch (err) {
      // Ağ hatası — 1 kez retry
      if (retry) {
        await new Promise(r => setTimeout(r, 800));
        return request(method, endpoint, body, false);
      }
      throw err;
    }
  }

  let _refreshPromise = null;
  async function _refresh() {
    if (_refreshPromise) return _refreshPromise;
    _refreshPromise = (async () => {
      try {
        const res = await fetch(BASE_URL + '/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) return false;
        const data = await res.json();
        _saveToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        _refreshPromise = null;
      }
    })();
    return _refreshPromise;
  }

  function _redirectToLogin() {
    _saveToken(null);
    if (!window.location.pathname.includes('/auth/')) {
      window.location.href = '/auth/login.html';
    }
  }

  async function get(endpoint) {
    return request('GET', endpoint);
  }

  async function post(endpoint, body) {
    return request('POST', endpoint, body);
  }

  async function put(endpoint, body) {
    return request('PUT', endpoint, body);
  }

  // Kullanıcı giriş kontrolü — token hâlâ geçerliyse refresh yapmaz
  async function checkAuth() {
    if (_accessToken) {
      try {
        const payload = JSON.parse(atob(_accessToken.split('.')[1]));
        if (payload.exp * 1000 > Date.now() + 30000) return true;
      } catch {}
    }
    return await _refresh();
  }

  const auth = {
    async login(email, password, rememberMe = false) {
      // Auth endpoint'leri request() yerine direkt fetch kullanır
      // Böylece yanlış şifre 401'i "bağlantı hatası" olarak gösterilmez
      try {
        const res = await fetch(BASE_URL + '/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, rememberMe })
        });
        const data = await res.json();
        if (res.ok) {
          _saveToken(data.accessToken);
          return { ok: true, user: data.user };
        }
        return { ok: false, error: data.error, details: data.details };
      } catch {
        return { ok: false, error: 'Sunucuya bağlanılamadı' };
      }
    },

    async register(formData) {
      try {
        const res = await fetch(BASE_URL + '/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) {
          _saveToken(data.accessToken);
          return { ok: true, user: data.user };
        }
        return { ok: false, error: data.error, details: data.details };
      } catch {
        return { ok: false, error: 'Sunucuya bağlanılamadı' };
      }
    },

    async logout() {
      try {
        await post('/auth/logout');
      } catch {}
      _saveToken(null);
    },

    async me() {
      const res = await get('/auth/me');
      if (!res || !res.ok) return null;
      const data = await res.json();
      return data.user;
    },

    async checkUsername(username) {
      try {
        const res = await fetch(`${BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }
  };

  const progress = {
    async dashboard() {
      const res = await get('/progress/dashboard');
      if (!res || !res.ok) return null;
      return res.json();
    },

    async updateKonu(data) {
      const res = await post('/progress/konu', data);
      return res && res.ok;
    },

    async getBolum(bolumId) {
      const res = await get(`/progress/bolum/${bolumId}`);
      if (!res || !res.ok) return null;
      return res.json();
    },

    async updateTask(data) {
      const res = await post('/progress/task', data);
      return res && res.ok;
    }
  };

  const quiz = {
    async submitAnswer(data) {
      const res = await post('/quiz/answer', data);
      return res && res.ok;
    },

    async submitAll(data) {
      const res = await post('/quiz/submit', data);
      if (!res || !res.ok) return null;
      return res.json();
    },

    async getResults(bolumId) {
      const res = await get(`/quiz/results/${bolumId}`);
      if (!res || !res.ok) return null;
      return res.json();
    }
  };

  const user = {
    async getProfile() {
      const res = await get('/user/profile');
      if (!res || !res.ok) return null;
      return res.json();
    },

    async updateProfile(data) {
      const res = await put('/user/profile', data);
      if (!res) return { ok: false, error: 'Bağlantı hatası' };
      const json = await res.json();
      return { ok: res.ok, ...json };
    },

    async changePassword(data) {
      const res = await put('/user/password', data);
      if (!res) return { ok: false, error: 'Bağlantı hatası' };
      const json = await res.json();
      return { ok: res.ok, ...json };
    },

    async getActivity() {
      const res = await get('/user/activity');
      if (!res || !res.ok) return [];
      const data = await res.json();
      return data.logs || [];
    }
  };

  return { getToken, setToken, clearToken, checkAuth, request, auth, progress, quiz, user };
})();

window.API = API;
