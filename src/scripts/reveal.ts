/**
 * Scroll-triggered reveals — Framer Motion's lightweight DOM API.
 *
 * Usage in markup:
 *   <div data-reveal>…</div>                 fade-up + un-blur
 *   <ul data-reveal-group> <li data-reveal>   children stagger in
 *   data-reveal-delay="0.2"                   optional extra delay (s)
 *
 * No React needed for static content, so sections ship zero JS framework
 * cost. Respects prefers-reduced-motion (elements are simply shown).
 */
import { animate, inView, scroll } from 'framer-motion/dom';

const EASE = [0.16, 1, 0.3, 1] as const;

export function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !els.length) return;

  els.forEach((el) => {
    // Stagger siblings that live inside a [data-reveal-group]
    const group = el.closest<HTMLElement>('[data-reveal-group]');
    const index = group ? Array.from(group.querySelectorAll('[data-reveal]')).indexOf(el) : 0;
    const delay = Number(el.dataset.revealDelay ?? 0) + index * 0.08;

    inView(
      el,
      () => {
        animate(
          el,
          { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'], filter: ['blur(8px)', 'blur(0px)'] },
          { duration: 0.9, delay, ease: EASE },
        );
      },
      { margin: '0px 0px -12% 0px', amount: 0.15 },
    );
  });
}

/**
 * Scroll-linked effects (Framer Motion scroll()):
 *  [data-progress]      sets --progress 0→1 while the element crosses the viewport
 *  [data-parallax="n"]  drifts the element by n × 100px over its scroll range
 */
export function initScrollEffects() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  document.querySelectorAll<HTMLElement>('[data-progress]').forEach((el) => {
    el.style.setProperty('--progress', '0');
    scroll((p: number) => el.style.setProperty('--progress', p.toFixed(4)), {
      target: el,
      offset: ['start 75%', 'end 60%'],
    });
  });

  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax || 0.2) * 100;
    scroll((p: number) => (el.style.transform = `translate3d(0, ${(p * amount).toFixed(1)}px, 0)`), {
      target: el.parentElement ?? el,
      offset: ['start start', 'end start'],
    });
  });
}
