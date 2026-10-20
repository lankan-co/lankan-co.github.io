/**
 * HeroLogo — animated entrance for the brand lockup.
 *
 * Choreography (≈1.4s):
 *   1. the white square settles in (fade + scale 0.94 → 1)
 *   2. the "ලං" mark unfurls: a circular clip grows from the centre of the
 *      spiral while the mark rotates out of a slight twist
 *   3. the wordmark slides out from behind the square
 *
 * Reduced motion → the finished logo is rendered immediately.
 */
import { motion, useReducedMotion, type TargetAndTransition } from 'framer-motion';
import logo from '@/data/logo-paths.json';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroLogo({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const { width: W, height: H } = logo.viewBox;
  const sq = logo.square;
  // Spiral centre, measured from the artwork
  const cx = 190;
  const cy = 350;

  const initial = (v: TargetAndTransition) => (reduce ? false : v);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label="Lankan Brands & Co."
      overflow="visible"
    >
      <defs>
        <clipPath id="hero-mark-clip">
          <motion.circle
            cx={cx}
            cy={cy}
            initial={initial({ r: 0 })}
            animate={{ r: 420 }}
            transition={{ duration: 1.2, delay: 0.35, ease: EASE }}
          />
        </clipPath>
        <clipPath id="hero-word-clip">
          <rect x={sq.width} y="0" width={W - sq.width + 20} height={H} />
        </clipPath>
      </defs>

      {/* 1 — square */}
      <motion.rect
        width={sq.width}
        height={sq.height}
        fill="#fff"
        style={{ transformOrigin: `${sq.width / 2}px ${sq.height / 2}px`, transformBox: 'view-box' }}
        initial={initial({ opacity: 0, scale: 0.94 })}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
      />

      {/* 2 — mark */}
      <g clipPath="url(#hero-mark-clip)">
        <motion.path
          fill="#000"
          fillRule="evenodd"
          d={logo.mark}
          style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' }}
          initial={initial({ rotate: -24 })}
          animate={{ rotate: 0 }}
          transition={{ duration: 1.3, delay: 0.35, ease: EASE }}
        />
      </g>

      {/* 3 — wordmark, revealed from behind the square */}
      <g clipPath="url(#hero-word-clip)">
        <motion.g
          initial={initial({ x: -120, opacity: 0 })}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.1, delay: 0.7, ease: EASE }}
        >
          <path fill="#fff" fillRule="evenodd" transform={`translate(${logo.wordmarkOffsetX} 0)`} d={logo.wordmark} />
        </motion.g>
      </g>
    </svg>
  );
}
