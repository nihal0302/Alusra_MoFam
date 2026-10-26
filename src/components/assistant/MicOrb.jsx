// The microphone's short "look here" animation (Variation 2, starting screen): a small glowing orb inside the button. A warm
// gradient fills it (brighter at the rim, softer towards the middle, with a slow drifting glow), and three thin loops sit on
// the rim, each very slightly out of round and each rippling at its own pace, so they overlap like a few offset circles.
// Drawn in the voice glow's gold, pale gold, ember and white. It plays once (the CSS animation that fades it in and out
// is in AssistantV2.css), and the component is removed afterwards. Not drawn at all with reduced motion.
const POINTS = 72;
const STEPS = 8; // shapes in one full ripple; the last repeats the first so the loop is seamless

// A closed loop whose radius swells and shrinks `lobes` times round the circle; `phase` moves the ripples round it.
const loop = (radius, depth, lobes, phase) => {
  let d = '';
  for (let i = 0; i < POINTS; i++) {
    const t = (i / POINTS) * Math.PI * 2;
    const r = radius + depth * Math.sin(lobes * t + phase);
    d += `${i ? 'L' : 'M'}${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
};

const frames = (radius, depth, lobes, start) =>
  Array.from({ length: STEPS + 1 }, (_, j) => loop(radius, depth, lobes, start + (j / STEPS) * Math.PI * 2)).join(';');

// radius, depth of the ripple, lobes, starting phase, seconds per ripple, width, which stroke
const RINGS = [
  { r: 19.2, a: 0.9, k: 2, p: 0, dur: 3.4, w: 1.2, stroke: 'url(#mo-gold)' },
  { r: 18.8, a: 0.8, k: 2, p: 2.2, dur: 4.2, w: 1, stroke: 'url(#mo-pale)' },
  { r: 18.4, a: 0.6, k: 3, p: 4.1, dur: 4.8, w: 0.8, stroke: 'url(#mo-white)' },
];

function Ring({ ring, extra }) {
  const first = loop(ring.r, ring.a, ring.k, ring.p);
  return (
    <path d={first} fill="none" stroke={ring.stroke} strokeWidth={ring.w + (extra ?? 0)} strokeLinejoin="round">
      <animate attributeName="d" dur={`${ring.dur}s`} repeatCount="indefinite" values={frames(ring.r, ring.a, ring.k, ring.p)} />
    </path>
  );
}

export function MicOrb() {
  return (
    <span className="noor-mic__orb" aria-hidden="true">
      <svg viewBox="-22 -22 44 44" focusable="false">
        <defs>
          <linearGradient id="mo-gold" gradientUnits="userSpaceOnUse" x1="-20" y1="-20" x2="20" y2="20">
            <stop offset="0" style={{ stopColor: 'var(--noor-glow-gold)' }} />
            <stop offset="0.55" style={{ stopColor: 'var(--noor-glow-core)' }} />
            <stop offset="1" style={{ stopColor: 'var(--noor-glow-ember)' }} />
          </linearGradient>
          <linearGradient id="mo-pale" gradientUnits="userSpaceOnUse" x1="20" y1="-20" x2="-20" y2="20">
            <stop offset="0" style={{ stopColor: 'var(--noor-glow-core)' }} />
            <stop offset="1" style={{ stopColor: 'var(--noor-glow-gold)' }} />
          </linearGradient>
          <linearGradient id="mo-white" gradientUnits="userSpaceOnUse" x1="-20" y1="20" x2="20" y2="-20">
            <stop offset="0" style={{ stopColor: 'var(--c-white)', stopOpacity: 0.95 }} />
            <stop offset="1" style={{ stopColor: 'var(--noor-glow-core)', stopOpacity: 0.8 }} />
          </linearGradient>
          <radialGradient id="mo-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0" style={{ stopColor: 'var(--noor-glow-core)', stopOpacity: 0.094 }} />
            <stop offset="0.55" style={{ stopColor: 'var(--noor-glow-gold)', stopOpacity: 0.085 }} />
            <stop offset="0.85" style={{ stopColor: 'var(--noor-glow-ember)', stopOpacity: 0.136 }} />
            <stop offset="1" style={{ stopColor: 'var(--noor-glow-core)', stopOpacity: 0.6 }} />
          </radialGradient>
          <radialGradient id="mo-drift" cx="50%" cy="50%" r="50%">
            <stop offset="0" style={{ stopColor: 'var(--c-white)', stopOpacity: 0.5 }} />
            <stop offset="1" style={{ stopColor: 'var(--noor-glow-gold)', stopOpacity: 0 }} />
          </radialGradient>
          <filter id="mo-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        <circle r="21" fill="url(#mo-fill)" />
        <circle r="11" fill="url(#mo-drift)">
          <animateTransform attributeName="transform" type="translate" dur="3.6s" repeatCount="indefinite" values="-5 -4; 5 3; -4 5; -5 -4" />
        </circle>
        <g filter="url(#mo-blur)" opacity="0.6">
          {RINGS.map((ring) => (
            <Ring key={`glow-${ring.k}`} ring={ring} extra={1.6} />
          ))}
        </g>
        {RINGS.map((ring) => (
          <Ring key={ring.k} ring={ring} />
        ))}
      </svg>
    </span>
  );
}
