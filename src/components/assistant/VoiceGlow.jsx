import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

// A soft, blurred colour field behind the panel while Mira is listening. Its glow pulses with the loudness of the voice, written to
// the CSS variable --level, so the colour swells and brightens on each word and settles in the pauses.
// Nobody speaks and no microphone is opened (the answer is simulated, see Assistant.jsx), so the loudness is simulated from the words
// as they appear: every new word gives a pulse of its own strength, some louder than others, and between words the glow settles to a
// calm, uneven breath.
// Under reduced motion the glow is still.
// `said`: the words heard so far. `overChat`: in the middle of a conversation only the colour rises from the bottom; the chat itself is left as it is.
export function VoiceGlow({ overChat = false, said = '' }) {
  const box = useRef(null);
  const reduced = usePrefersReducedMotion();
  const voice = useRef({ words: 0, until: 0, loud: 0 });

  // A new word: a pulse (about as long as the word), louder or softer at random.
  useEffect(() => {
    const n = said.trim() ? said.trim().split(/\s+/).length : 0;
    const v = voice.current;
    if (n > v.words) {
      v.until = performance.now() + 380;
      // mostly medium, now and then a loud word
      v.loud = Math.random() < 0.25 ? 0.9 + Math.random() * 0.1 : 0.45 + Math.random() * 0.35;
    }
    v.words = n;
  }, [said]);

  useEffect(() => {
    const el = box.current;
    if (!el || reduced) return undefined;

    const panel = el.closest('.noor-panel');
    let stopped = false;
    let raf = 0;
    let level = 0;
    const t0 = performance.now();

    const tick = (now) => {
      if (stopped) return;
      const s = (now - t0) / 1000;
      // Between words: a calm, uneven breath.
      const idle = 0.18 + 0.1 * Math.sin(s / 1.6) + 0.05 * Math.sin(s / 0.7);
      const v = voice.current;
      const target = now < v.until ? Math.max(idle, v.loud) : idle;
      // Quick to rise, a little slower to settle, so each word is a visible pulse.
      level += (target - level) * (target > level ? 0.38 : 0.12);
      const out = level.toFixed(3);
      el.style.setProperty('--level', out);
      panel?.style.setProperty('--level', out);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      panel?.style.removeProperty('--level');
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div className={`noor-glow${overChat ? ' noor-glow--chat' : ''}`} ref={box} aria-hidden="true">
      <i /><i /><i /><i />
    </div>
  );
}
