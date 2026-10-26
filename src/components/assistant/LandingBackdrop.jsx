// A quiet decorative layer behind the Variation 2 starting screen: a fine dot grid fading out from the top-left corner, a few
// flowing contour lines, two soft curved sweeps of light along the bottom (blurred, so they fade out instead of ending in an
// edge), and a faint white dotted globe that turns and floats slowly (see DotGlobe.jsx). A light blur sits over all of it except
// the dots of the globe, so everything reads as soft. All of it is faint and drawn in theme colours (see the .nb-* rules in
// AssistantV2.css). It carries no meaning, so it is hidden from screen readers, and it only moves slowly (not at all with
// reduced motion).
import { DotGlobe } from './DotGlobe.jsx';

export function LandingBackdrop() {
  return (
    <div className="noor-backdrop" aria-hidden="true">
      <svg viewBox="0 0 400 760" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="nb-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--c-white)', stopOpacity: 0.75 }} />
            <stop offset="1" style={{ stopColor: 'var(--c-white)', stopOpacity: 0.05 }} />
          </linearGradient>
          <pattern id="nb-dots" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" className="nb-dot" />
          </pattern>
          <radialGradient id="nb-fade" cx="0.1" cy="0.08" r="0.75">
            <stop offset="0" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </radialGradient>
          <filter id="nb-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <mask id="nb-dotmask">
            <rect width="400" height="400" fill="url(#nb-fade)" />
          </mask>
        </defs>

        <rect width="400" height="400" fill="url(#nb-dots)" mask="url(#nb-dotmask)" />


        <g className="nb-drift">
          <path className="nb-line" d="M-20 470 C 70 420, 150 470, 240 395 S 370 270, 430 296" />
          <path className="nb-line nb-line--sage" d="M-20 500 C 80 448, 160 500, 250 424 S 378 298, 430 328" />
          <path className="nb-line" d="M-20 530 C 90 476, 170 530, 260 452 S 384 326, 430 360" />
          <path className="nb-line nb-line--sage" d="M-20 560 C 100 504, 180 560, 270 480 S 390 354, 430 392" />
          <path className="nb-line" d="M-20 590 C 110 532, 190 590, 280 508 S 396 382, 430 424" />
        </g>

        <g className="nb-sweeps" filter="url(#nb-soft)">
          <path className="nb-swoosh nb-swoosh--tint" d="M-10 760 L-10 676 C 110 690, 230 640, 310 566 S 396 452, 410 408 L410 760 Z" />
          <path className="nb-swoosh" d="M-10 760 L-10 634 C 90 646, 200 598, 272 520 S 388 340, 410 258 L410 760 Z" />
        </g>

      </svg>
      <div className="nb-globe-field" />
      <div className="noor-backdrop__veil" />
      <DotGlobe />
    </div>
  );
}
