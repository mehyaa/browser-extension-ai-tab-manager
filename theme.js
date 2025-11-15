(function () {
  async function getStoredTheme() {
    try {
      const { theme } = await chrome.storage.local.get(['theme']);
      return theme || 'system';
    } catch (_) {
      return 'system';
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');

    let mode = theme;
    if (theme === 'system') {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = isDark ? 'dark' : 'light';
    }

    root.classList.add(`theme-${mode}`);
    // Help built-in form controls adapt
    root.style.colorScheme = mode;
  }

  function watchSystem(theme) {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  async function initTheme() {
    const theme = await getStoredTheme();
    applyTheme(theme);
    watchSystem(theme);
  }

  window.Theme = { applyTheme, initTheme };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
