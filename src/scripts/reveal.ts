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
 *  [data-drift="n"]     for mid-page elements: drifts ±n × 50px while crossing the viewport
 */
export function initScrollEffects() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  document.querySelectorAll<HTMLElement>('[data-progress]').forEach((el) => {
    // Steps inside light up once the line has reached them
    const steps = Array.from(el.querySelectorAll<HTMLElement>('[data-step]'));
    el.style.setProperty('--progress', '0');
    scroll(
      (p: number) => {
        el.style.setProperty('--progress', p.toFixed(4));
        steps.forEach((s, i) => s.toggleAttribute('data-active', p >= i / Math.max(steps.length - 1, 1) - 0.02));
      },
      { target: el, offset: ['start 75%', 'end 60%'] },
    );
  });

  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax || 0.2) * 100;
    scroll((p: number) => (el.style.transform = `translate3d(0, ${(p * amount).toFixed(1)}px, 0)`), {
      target: el.parentElement ?? el,
      offset: ['start start', 'end start'],
    });
  });

  document.querySelectorAll<HTMLElement>('[data-drift]').forEach((el) => {
    const amount = Number(el.dataset.drift || 0.3) * 100;
    scroll((p: number) => (el.style.transform = `translate3d(0, ${((p - 0.5) * amount).toFixed(1)}px, 0)`), {
      target: el.parentElement ?? el,
      offset: ['start end', 'end start'],
    });
  });
}

/**
 * [data-scrub]: the statement lights up word by word as it scrolls through
 * the viewport. Words are wrapped at runtime, so the HTML stays plain text.
 */
export function initWordScrub() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  document.querySelectorAll<HTMLElement>('[data-scrub]').forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const span = document.createElement('span');
        span.className = 'scrub-word';
        span.textContent = part;
        frag.append(span);
      });
      node.replaceWith(frag);
    });

    const words = Array.from(el.querySelectorAll<HTMLElement>('.scrub-word'));
    scroll(
      (p: number) => {
        const lit = p * words.length;
        words.forEach((w, i) => w.style.setProperty('--o', String(Math.min(1, Math.max(0.18, lit - i + 0.18)))));
      },
      { target: el, offset: ['start 85%', 'end 45%'] },
    );
  });
}

/** [data-spotlight]: children's --sx/--sy follow the pointer (used for the card glow). */
export function initSpotlight() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((list) => {
    list.addEventListener(
      'pointermove',
      (e) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>('li');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--sx', `${e.clientX - r.left}px`);
        card.style.setProperty('--sy', `${e.clientY - r.top}px`);
      },
      { passive: true },
    );
  });
}

/** [data-board]: the hero brand board leans toward the pointer (--mx/--my in -1…1). */
export function initBoard() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const board = document.querySelector<HTMLElement>('[data-board]');
  if (reduce || !board || !window.matchMedia('(pointer: fine)').matches) return;
  let frame = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        board.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        board.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    },
    { passive: true },
  );
}

/**
 * [data-hscroll]: on wide screens the stage pins and its row slides sideways
 * while the page scrolls. Elsewhere (and with reduced motion) the row stays a
 * native scroll-snap carousel; either way [data-hscroll-bar] shows progress.
 */
export function initHorizontalScroll() {
  document.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((outer) => {
    const viewport = outer.querySelector<HTMLElement>('[data-hscroll-viewport]');
    const track = outer.querySelector<HTMLElement>('[data-hscroll-track]');
    const bar = outer.querySelector<HTMLElement>('[data-hscroll-bar]');
    if (!viewport || !track) return;
    const setBar = (p: number) => bar?.style.setProperty('--progress', Math.max(0.04, p).toFixed(4));

    const wide = window.matchMedia('(min-width: 1024px)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let distance = 0;
    let progress = 0;
    let stop: (() => void) | null = null;

    const native = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      setBar(max > 0 ? viewport.scrollLeft / max : 1);
    };
    viewport.addEventListener('scroll', () => !stop && native(), { passive: true });

    const layout = () => {
      stop?.();
      stop = null;
      outer.style.height = '';
      track.style.transform = '';
      viewport.style.overflowX = '';
      if (!wide.matches || reduce.matches) return native();

      viewport.style.overflowX = 'hidden';
      viewport.scrollLeft = 0;
      distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
      outer.style.height = `calc(100svh + ${distance}px)`;
      stop = scroll(
        (p: number) => {
          progress = p;
          track.style.transform = `translate3d(${(-p * distance).toFixed(1)}px, 0, 0)`;
          setBar(p);
        },
        { target: outer, offset: ['start start', 'end end'] },
      );
      setBar(progress);
    };

    layout();
    let t = 0;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = window.setTimeout(layout, 150);
    });
    wide.addEventListener('change', layout);
    reduce.addEventListener('change', layout);
  });
}

/**
 * [data-film]: the film frame opens to full bleed as it scrolls in (--open 0→1),
 * and its video downloads/plays only while on screen. Reduced motion or Data
 * Saver keep the poster frame; the toggle lets anyone pause or resume.
 */
export function initFilm() {
  document.querySelectorAll<HTMLElement>('[data-film]').forEach((section) => {
    const frame = section.querySelector<HTMLElement>('.film-frame');
    const video = section.querySelector<HTMLVideoElement>('[data-film-video]');
    const toggle = section.querySelector<HTMLButtonElement>('[data-film-toggle]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

    if (frame && !reduce) {
      frame.style.setProperty('--open', '0');
      scroll((p: number) => frame.style.setProperty('--open', p.toFixed(4)), {
        target: section,
        offset: ['start end', 'start 25%'],
      });
    }

    if (!video || reduce || saveData) return;
    let visible = false;
    let userPaused = false;
    const sync = () => {
      if (visible && !userPaused) video.play().catch(() => {});
      else video.pause();
      if (!toggle) return;
      toggle.querySelector<HTMLElement>('[data-film-icon="pause"]')!.hidden = userPaused;
      toggle.querySelector<HTMLElement>('[data-film-icon="play"]')!.hidden = !userPaused;
      toggle.querySelector<HTMLElement>('[data-film-label]')!.textContent = userPaused ? 'Play film' : 'Pause film';
    };
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', () => {
        userPaused = !userPaused;
        sync();
      });
    }
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    ).observe(video);
  });
}
