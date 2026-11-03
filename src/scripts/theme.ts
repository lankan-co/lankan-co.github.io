/**
 * Light / dark theme toggle.
 *
 * The inline script in BaseLayout sets <html data-theme> before first paint
 * (saved choice, else the OS preference), so there is no flash. This wires up
 * the header button: it switches theme, remembers the choice, keeps the
 * browser's theme-color in step, follows OS changes until the visitor picks a
 * theme themselves, and syncs across open tabs.
 */
type Theme = 'light' | 'dark';

const KEY = 'theme';
// Matches --color-paper in each theme (src/styles/global.css).
const THEME_COLOR: Record<Theme, string> = { light: '#f8f7f2', dark: '#111312' };

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark';

function saved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

export function initTheme() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let fadeTimer = 0;

  const apply = (theme: Theme, fade = false) => {
    if (fade && !reduceMotion.matches) {
      root.classList.add('theme-fade');
      window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(() => root.classList.remove('theme-fade'), 350);
    }
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
    buttons.forEach((b) => {
      b.setAttribute('aria-pressed', String(theme === 'dark'));
      b.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    });
  };

  apply(isTheme(root.dataset.theme) ? root.dataset.theme : system.matches ? 'dark' : 'light');

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode: the choice still applies to this page */
      }
      apply(next, true);
    }),
  );

  // Follow the OS until the visitor has made a choice of their own.
  system.addEventListener('change', (e) => {
    if (!saved()) apply(e.matches ? 'dark' : 'light', true);
  });

  // Keep other open tabs in step.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && isTheme(e.newValue)) apply(e.newValue, true);
  });
}
