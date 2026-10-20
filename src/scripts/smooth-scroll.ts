/**
 * Lenis smooth scrolling + in-page anchor handling.
 * Skipped entirely for reduced-motion users and on touch devices,
 * where native scrolling already feels right.
 */
import Lenis from 'lenis';

export function initSmoothScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (reduce || coarse) return;

  const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: false });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Smoothly scroll to in-page anchors, then move focus for keyboard/AT users.
  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')!;
    const target = id === '#' || id === '#top' ? document.body : document.querySelector<HTMLElement>(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target === document.body ? 0 : target, {
      offset: -72,
      onComplete: () => {
        if (target !== document.body) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      },
    });
    history.pushState(null, '', id);
  });
}
