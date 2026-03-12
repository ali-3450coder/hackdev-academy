// HackDev Academy — Auth Sayfaları İstemci Mantığı
// Copyright © 2025 Muhammed Ali. Tüm hakları saklıdır.

(function() {
  'use strict';

  // === YARDIMCI FONKSİYONLAR ===
  function $(id) { return document.getElementById(id); }

  function showError(bannerId, msg) {
    const banner = $(bannerId);
    if (!banner) return;
    banner.classList.remove('hidden');
    const txt = banner.querySelector('[data-error-text]') || banner.querySelector('span:last-child');
    if (txt) txt.textContent = msg;
  }

  function hideError(bannerId) {
    const banner = $(bannerId);
    if (banner) banner.classList.add('hidden');
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.origText = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Yükleniyor...';
    } else {
      btn.innerHTML = btn.dataset.origText || btn.innerHTML;
    }
  }

  function setFieldError(input, msg) {
    if (!input) return;
    input.classList.add('error');
    input.classList.remove('success');
    let hint = input.parentElement?.querySelector('.form-error');
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'form-error';
      input.parentElement?.appendChild(hint);
    }
    hint.textContent = '⚠ ' + msg;
    hint.style.display = 'flex';
  }

  function clearFieldError(input) {
    if (!input) return;
    input.classList.remove('error');
    const hint = input.parentElement?.querySelector('.form-error');
    if (hint) hint.style.display = 'none';
  }

  function setFieldSuccess(input) {
    if (!input) return;
    input.classList.remove('error');
    input.classList.add('success');
    const hint = input.parentElement?.querySelector('.form-error');
    if (hint) hint.style.display = 'none';
  }

  // === AUTH GUARD ===
  async function checkAlreadyLoggedIn() {
    try {
      const refreshed = await API.checkAuth();
      if (refreshed) {
        window.location.href = '/dashboard/index.html';
      }
    } catch {}
  }

  // === PASSWORD TOGGLE ===
  function initPasswordToggles() {
    document.querySelectorAll('[data-pw-toggle]').forEach(btn => {
      btn.addEventListener('click', function() {
        const targetId = btn.dataset.pwToggle || btn.closest('.password-wrapper')?.querySelector('input')?.id;
        const input = targetId ? $(targetId) : btn.closest('.password-wrapper')?.querySelector('input');
        if (!input) return;
        const isText = input.type === 'text';
        input.type = isText ? 'password' : 'text';
        btn.innerHTML = isText ? '👁' : '🙈';
        btn.title = isText ? 'Şifreyi göster' : 'Şifreyi gizle';
      });
    });
  }

  // === LOGİN SAYFASI ===
  function initLoginPage() {
    checkAlreadyLoggedIn();
    initPasswordToggles();

    const form = $('loginForm');
    const emailInput = $('email');
    const passwordInput = $('password');
    const submitBtn = $('submitBtn');
    const pwToggle = $('passwordToggle');

    if (pwToggle && passwordInput) {
      pwToggle.addEventListener('click', function() {
        const isText = passwordInput.type === 'text';
        passwordInput.type = isText ? 'password' : 'text';
        pwToggle.innerHTML = isText ? '👁' : '🙈';
      });
    }

    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      hideError('errorBanner');

      const email = emailInput?.value.trim();
      const password = passwordInput?.value;
      const rememberMe = $('rememberMe')?.checked || false;

      let valid = true;
      if (!email) { setFieldError(emailInput, 'E-posta gerekli'); valid = false; }
      else clearFieldError(emailInput);
      if (!password) { setFieldError(passwordInput, 'Şifre gerekli'); valid = false; }
      else clearFieldError(passwordInput);
      if (!valid) return;

      setLoading(submitBtn, true);

      const result = await API.auth.login(email, password, rememberMe);

      if (result.ok) {
        submitBtn.innerHTML = '✓ Giriş başarılı!';
        setTimeout(() => { window.location.href = '/dashboard/index.html'; }, 400);
      } else {
        setLoading(submitBtn, false);
        const msg = result.error || 'Giriş başarısız';
        showError('errorBanner', msg);
        if (msg.toLowerCase().includes('şifre') || msg.toLowerCase().includes('e-posta')) {
          setFieldError(emailInput, ' ');
          setFieldError(passwordInput, ' ');
        }
        if (msg.toLowerCase().includes('dakika')) {
          submitBtn.disabled = true;
        }
      }
    });

    // Enter tuşu desteği
    if (emailInput) {
      emailInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') passwordInput?.focus();
      });
    }
  }

  // === KAYIT SAYFASI ===
  function initRegisterPage() {
    checkAlreadyLoggedIn();
    initPasswordToggles();

    const form = $('registerForm');
    if (!form) return;

    const fullNameInput = $('fullName');
    const usernameInput = $('username');
    const emailInput = $('email');
    const passwordInput = $('password');
    const password2Input = $('password2');
    const submitBtn = $('submitBtn');

    // --- Kullanıcı adı kontrolü (debounce 500ms) ---
    let usernameTimer = null;
    if (usernameInput) {
      usernameInput.addEventListener('input', function() {
        clearTimeout(usernameTimer);
        const val = usernameInput.value.trim();
        const statusEl = $('usernameStatus');
        if (!statusEl) return;

        if (val.length < 3) {
          statusEl.textContent = '';
          clearFieldError(usernameInput);
          return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
          setFieldError(usernameInput, 'Sadece harf, rakam, _ ve - kullanabilirsiniz');
          return;
        }

        statusEl.textContent = '⏳ Kontrol ediliyor...';
        statusEl.style.color = 'var(--text3)';

        usernameTimer = setTimeout(async function() {
          const result = await API.auth.checkUsername(val);
          if (result === null) {
            statusEl.textContent = '';
            return;
          }
          if (result.available) {
            statusEl.textContent = '✓ Kullanılabilir';
            statusEl.style.color = 'var(--success)';
            setFieldSuccess(usernameInput);
          } else {
            statusEl.textContent = '✗ Bu kullanıcı adı alınmış';
            statusEl.style.color = 'var(--danger)';
            setFieldError(usernameInput, 'Bu kullanıcı adı zaten kullanımda');
          }
        }, 500);
      });
    }

    // --- Şifre gücü göstergesi ---
    function checkPasswordStrength(pw) {
      const criteria = {
        length: pw.length >= 8,
        upper: /[A-Z]/.test(pw),
        number: /[0-9]/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw)
      };
      const count = Object.values(criteria).filter(Boolean).length;
      const level = count <= 1 ? 'weak' : count <= 2 ? 'medium' : count <= 3 ? 'medium' : 'strong';
      return { criteria, count, level };
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', function() {
        const pw = passwordInput.value;
        const { criteria, level } = checkPasswordStrength(pw);

        const fill = $('strengthFill');
        const pct = pw.length === 0 ? 0 : level === 'weak' ? 25 : level === 'medium' ? 60 : 100;
        if (fill) {
          fill.style.width = pct + '%';
          fill.style.background = level === 'weak' ? 'var(--danger)' :
            level === 'medium' ? 'var(--warn)' : 'var(--success)';
        }

        const ids = { length: 'crit_length', upper: 'crit_upper', number: 'crit_number', special: 'crit_special' };
        for (const [key, elId] of Object.entries(ids)) {
          const el = $(elId);
          if (el) {
            el.classList.toggle('met', criteria[key]);
            el.querySelector('span')?.classList.toggle('check', criteria[key]);
          }
        }
      });
    }

    // --- Şifre eşleşme kontrolü ---
    if (password2Input && passwordInput) {
      password2Input.addEventListener('blur', function() {
        if (password2Input.value && passwordInput.value !== password2Input.value) {
          setFieldError(password2Input, 'Şifreler eşleşmiyor');
        } else if (password2Input.value) {
          setFieldSuccess(password2Input);
        }
      });
    }

    // --- Form submit ---
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      hideError('errorBanner');

      const data = {
        full_name: fullNameInput?.value.trim(),
        username: usernameInput?.value.trim(),
        email: emailInput?.value.trim(),
        password: passwordInput?.value
      };

      let valid = true;

      if (!data.full_name || data.full_name.length < 2) {
        setFieldError(fullNameInput, 'Ad soyad en az 2 karakter olmalı'); valid = false;
      } else clearFieldError(fullNameInput);

      if (!data.username || data.username.length < 3) {
        setFieldError(usernameInput, 'Kullanıcı adı en az 3 karakter olmalı'); valid = false;
      } else clearFieldError(usernameInput);

      if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
        setFieldError(emailInput, 'Geçerli bir e-posta girin'); valid = false;
      } else clearFieldError(emailInput);

      const { criteria } = checkPasswordStrength(data.password || '');
      if (!criteria.length || !criteria.upper || !criteria.number || !criteria.special) {
        setFieldError(passwordInput, 'Şifre tüm kriterleri karşılamalı'); valid = false;
      } else clearFieldError(passwordInput);

      if (password2Input?.value !== data.password) {
        setFieldError(password2Input, 'Şifreler eşleşmiyor'); valid = false;
      } else clearFieldError(password2Input);

      if (!$('terms')?.checked) {
        showError('errorBanner', 'Kullanım şartlarını kabul etmelisiniz'); valid = false;
      }

      if (!valid) return;

      setLoading(submitBtn, true);

      const result = await API.auth.register(data);

      if (result.ok) {
        submitBtn.innerHTML = '✓ Hesap oluşturuldu!';
        setTimeout(() => { window.location.href = '/dashboard/index.html'; }, 400);
      } else {
        setLoading(submitBtn, false);
        const msg = result.error || 'Kayıt başarısız';
        showError('errorBanner', msg);
        if (result.details) {
          result.details.forEach(detail => {
            const fieldMap = {
              username: usernameInput, email: emailInput,
              password: passwordInput, full_name: fullNameInput
            };
            if (fieldMap[detail.field]) {
              setFieldError(fieldMap[detail.field], detail.message);
            }
          });
        }
      }
    });
  }

  // === LOGOUT ===
  async function logout() {
    await API.auth.logout();
    window.location.href = '/auth/login.html';
  }

  // Sayfa belirleme ve başlatma
  document.addEventListener('DOMContentLoaded', function() {
    const page = document.body.dataset.page;
    if (page === 'login') initLoginPage();
    else if (page === 'register') initRegisterPage();

    // Çıkış butonları
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', logout);
    });
  });

  window.AuthManager = { logout };
})();
