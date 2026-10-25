import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

// Plays a Lottie animation once and leaves it on its last frame. Under reduced motion it shows the last frame only.
export function LottieMark({ animationData, className }) {
  const box = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: box.current,
      renderer: 'svg',
      loop: false,
      autoplay: !reduced,
      animationData,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    if (reduced) anim.goToAndStop(anim.totalFrames - 1, true);
    return () => anim.destroy();
  }, [animationData, reduced]);

  return <span className={className} ref={box} aria-hidden="true" />;
}
