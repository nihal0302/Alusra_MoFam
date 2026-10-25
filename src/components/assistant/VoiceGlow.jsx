import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

// A soft, blurred colour field behind the panel while Mira is listening. Its glow follows the
// loudness of the microphone: the level is read on the device only (nothing is recorded or sent)
// and written to the CSS variable --level, so the blobs swell and brighten as someone speaks and
// settle when they pause. If the microphone is unavailable or blocked, a slow idle pulse takes over.
// Under reduced motion the glow is still and the microphone is not used.
export function VoiceGlow() {
  const box = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = box.current;
    if (!el || reduced) return undefined;

    const panel = el.closest('.noor-panel');
    let stopped = false;
    let raf = 0;
    let stream = null;
    let ctx = null;
    let analyser = null;
    let data = null;
    let level = 0;
    const t0 = performance.now();

    const tick = (now) => {
      if (stopped) return;
      let target;
      if (analyser) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        // sqrt curve: quiet and normal speech already register strongly, shouting simply tops out
        target = Math.min(1, Math.sqrt(Math.max(0, (rms - 0.008) * 16)));
      } else {
        // Idle: a calm, uneven breath.
        const s = (now - t0) / 1000;
        target = 0.22 + 0.14 * Math.sin(s / 1.6) + 0.07 * Math.sin(s / 0.7);
      }
      // Quick to rise, slower to settle, so it feels alive without flickering.
      level += (target - level) * (target > level ? 0.38 : 0.07);
      const v = level.toFixed(3);
      el.style.setProperty('--level', v);
      panel?.style.setProperty('--level', v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        if (stopped) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(s);
        const a = ctx.createAnalyser();
        a.fftSize = 512;
        a.smoothingTimeConstant = 0.8;
        src.connect(a);
        data = new Uint8Array(a.fftSize);
        analyser = a;
      } catch {
        /* blocked or no microphone: the idle pulse keeps the glow alive */
      }
    })();

    return () => {
      stopped = true;
      panel?.style.removeProperty('--level');
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [reduced]);

  return (
    <div className="noor-glow" ref={box} aria-hidden="true">
      <i /><i /><i /><i />
    </div>
  );
}
