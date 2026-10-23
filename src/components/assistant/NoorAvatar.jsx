import { ImageSlot } from '../ImageSlot.jsx';

// state: idle | thinking (rotating ring) | listening (pulsing ring)
export function NoorAvatar({ src, size = 44, state = 'idle', className = '', ring = false }) {
  return (
    <span
      className={`noor-avatar noor-avatar--${state}${ring ? ' noor-avatar--ring' : ''} ${className}`}
      style={{ '--avatar-size': `${size}px` }}
    >
      <ImageSlot file={src} decorative />
    </span>
  );
}
