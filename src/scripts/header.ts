/**
 * Header behaviour:
 *  - adds a hairline + blurred backdrop once the page is scrolled
 *  - accessible mobile menu (aria-expanded, Esc to close, focus return)
 *  - highlights the nav link for the section currently in view
 *  - fills the page-progress line and shows the mobile floating CTA
 */
export function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  // Scrolled state, page progress and the floating CTA (hidden over the hero and the contact section)
  const progress = header.querySelector<HTMLElement>('[data-page-progress]');
  const cta = document.querySelector<HTMLElement>('[data-float-cta]');
  const contact = document.getElementById('contact');
  let contactVisible = false;
  if (contact && cta) {
    new IntersectionObserver(([e]) => {
      contactVisible = e.isIntersecting;
      onScroll();
    }).observe(contact);
  }
  const onScroll = () => {
    const y = window.scrollY;
    header.toggleAttribute('data-scrolled', y > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
    if (cta) {
      const show = y > window.innerHeight * 0.8 && !contactVisible;
      cta.toggleAttribute('data-show', show);
      cta.setAttribute('aria-hidden', String(!show));
      cta.tabIndex = show ? 0 : -1;
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.toggleAttribute('data-open', open);
      menu.inert = !open;
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };
    setOpen(false);
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 768px)').addEventListener('change', (m) => m.matches && setOpen(false));
  }

  // Active section indicator
  const links = Array.from(header.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const sections = links
    .map((l) => document.querySelector<HTMLElement>(l.getAttribute('href')!))
    .filter((s): s is HTMLElement => !!s);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) =>
          l.getAttribute('href') === `#${entry.target.id}`
            ? l.setAttribute('aria-current', 'true')
            : l.removeAttribute('aria-current'),
        );
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}
