const Theme = (function() {
  const STORAGE_KEY = 'khata_theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function getCurrentTheme() {
    return getStoredTheme() || getSystemPreference();
  }

  function applyTheme(theme) {
    document.body.classList.remove(DARK, LIGHT);
    document.body.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggle() {
    const current = getCurrentTheme();
    const next = current === DARK ? LIGHT : DARK;
    applyTheme(next);
    updateToggleIcon();
  }

  function updateToggleIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    
    const theme = getCurrentTheme();
    const isDark = theme === DARK;
    
    btn.innerHTML = isDark 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    
    btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function init() {
    applyTheme(getCurrentTheme());
    updateToggleIcon();
  }

  return {
    init,
    toggle,
    getCurrentTheme
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
});