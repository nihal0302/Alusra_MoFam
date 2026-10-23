import { assetUrl } from '../lib/assets.js';
import './ImageSlot.css';

// Renders the original asset when present in src/assets/, otherwise a clearly
// marked placeholder naming the file it is waiting for.
export function ImageSlot({ file, alt = '', fit = 'cover', className = '', decorative = false }) {
  const src = assetUrl(file);
  if (src) {
    return (
      <img
        className={`image-slot__img ${className}`}
        src={src}
        alt={decorative ? '' : alt}
        style={{ objectFit: fit }}
      />
    );
  }
  return (
    <div
      className={`image-slot ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative || undefined}
    >
      <span className="image-slot__tag">Image slot</span>
      <span className="image-slot__file">{file}</span>
    </div>
  );
}
