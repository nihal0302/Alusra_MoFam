import { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import animationData from '../../assets/noor/success-check.json';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

// The success tick, played once and left on its last frame (LottieFiles "Success Check", white
// background layer removed so it sits on the card). Under reduced motion it shows the last frame only.
export function SuccessCheck({ className }) {
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
  }, [reduced]);

  return <span className={className} ref={box} aria-hidden="true" />;
}
