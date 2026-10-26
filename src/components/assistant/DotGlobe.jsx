import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

// A faint dotted globe for the Variation 2 starting screen backdrop: rows of tiny, very light grey dots on a sphere that is twisted a little
// and tilted, so it reads as a soft mesh. It turns very slowly and floats a few pixels, and is drawn on a canvas so it stays
// cheap. The back of the globe shows through, fainter. With reduced motion it is drawn once and does not move.
const ROWS = 17;
const COLS = 40;

const POINTS = [];
for (let i = 0; i < ROWS; i++) {
  const lat = -1.35 + (i / (ROWS - 1)) * 2.7; // from near one pole to near the other
  for (let j = 0; j < COLS; j++) POINTS.push({ lat, lon: (j / COLS) * Math.PI * 2 });
}

export function DotGlobe() {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const color = getComputedStyle(canvas).color;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    const start = performance.now();

    const size = () => {
      const r = canvas.getBoundingClientRect();
      // getBoundingClientRect includes any scale the chat has while it opens; the layout size is what we want
      w = canvas.clientWidth || r.width;
      h = canvas.clientHeight || r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const draw = (now) => {
      const t = reduced ? 0 : (now - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      const R = Math.min(w, h) * 0.44;
      const cx = w * 0.7 + (reduced ? 0 : Math.sin(t * 0.3) * 9);
      const cy = h * 0.34 + (reduced ? 0 : Math.cos(t * 0.24) * 7);
      const turn = t * 0.11;
      const tilt = 0.4 + (reduced ? 0 : Math.sin(t * 0.17) * 0.1);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      for (const p of POINTS) {
        const lon = p.lon + p.lat * 0.75 + turn; // the twist grows towards the poles
        const x0 = Math.cos(p.lat) * Math.sin(lon);
        const y0 = Math.sin(p.lat) * (1 + 0.12 * Math.sin(lon * 2 + t * 0.3));
        const z0 = Math.cos(p.lat) * Math.cos(lon);
        const x = x0 + 0.3 * y0; // a slight lean
        const y = y0 * cosT - z0 * sinT;
        const z = y0 * sinT + z0 * cosT;
        const depth = (z + 1) / 2; // 0 at the back, 1 at the front
        const persp = 1 / (1 - z * 0.22);
        ctx.globalAlpha = 0.22 + 0.7 * depth;
        ctx.beginPath();
        ctx.arc((cx + R * x * persp) * dpr, (cy + R * y * persp) * dpr, (1 + 0.8 * depth) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    size();
    draw(performance.now());
    const observer = new ResizeObserver(() => {
      size();
      if (reduced) draw(performance.now());
    });
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reduced]);

  return <canvas ref={ref} className="nb-globe" />;
}
