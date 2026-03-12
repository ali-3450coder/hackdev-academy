// HackDev Academy — Tema Yönetimi
(function() {
  const THEME_KEY = 'hackdev_theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    // Toggle butonlarını güncelle
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('title', theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç');
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    });
  }

  function toggleTheme() {
    const current = getTheme();
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Sayfa yüklenince uygula (flash önlemek için)
  applyTheme(getTheme());

  // DOM hazır olunca event listener ekle
  document.addEventListener('DOMContentLoaded', function() {
    applyTheme(getTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  });

  // Global erişim
  window.ThemeManager = { toggle: toggleTheme, get: getTheme, apply: applyTheme };
})();
