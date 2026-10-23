// Icon geometry copied verbatim from the saved page's inline SVGs (Phosphor,
// regular weight, 256 viewBox). `clock` and `arrowUpRight` were external files
// (Clock.svg, arrow-up-right-icon.svg) not supplied — Phosphor equivalents used.
const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 16 };

const paths = {
  instagram: (
    <>
      <circle cx="128" cy="128" r="40" {...S} strokeMiterlimit="10" />
      <rect x="32" y="32" width="192" height="192" rx="48" {...S} />
      <circle cx="180" cy="76" r="12" fill="currentColor" />
    </>
  ),
  facebook: (
    <>
      <circle cx="128" cy="128" r="96" {...S} />
      <path d="M168,88H152a24,24,0,0,0-24,24V224" {...S} />
      <line x1="96" y1="144" x2="160" y2="144" {...S} />
    </>
  ),
  x: (
    <>
      <polygon points="48 40 96 40 208 216 160 216 48 40" {...S} />
      <line x1="113.88" y1="143.53" x2="48" y2="216" {...S} />
      <line x1="208" y1="40" x2="142.12" y2="112.47" {...S} />
    </>
  ),
  linkedin: (
    <>
      <rect x="32" y="32" width="192" height="192" rx="8" {...S} />
      <line x1="120" y1="112" x2="120" y2="176" {...S} />
      <line x1="88" y1="112" x2="88" y2="176" {...S} />
      <path d="M120,140a28,28,0,0,1,56,0v36" {...S} />
      <circle cx="88" cy="84" r="12" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <circle cx="128" cy="104" r="32" {...S} />
      <path d="M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z" {...S} />
    </>
  ),
  mail: (
    <>
      <path d="M32,56H224a0,0,0,0,1,0,0V192a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V56A0,0,0,0,1,32,56Z" {...S} />
      <polyline points="224 56 128 144 32 56" {...S} />
    </>
  ),
  briefcase: (
    <path
      fill="currentColor"
      d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v72H40V72Zm0,128H40V160H216v40Z"
    />
  ),
  phone: (
    <path
      d="M164.39,145.34a8,8,0,0,1,7.59-.69l47.16,21.13a8,8,0,0,1,4.8,8.3A48.33,48.33,0,0,1,176,216,136,136,0,0,1,40,80,48.33,48.33,0,0,1,81.92,32.06a8,8,0,0,1,8.3,4.8l21.13,47.2a8,8,0,0,1-.66,7.53L89.32,117a7.93,7.93,0,0,0-.54,7.81c8.27,16.93,25.77,34.22,42.75,42.41a7.92,7.92,0,0,0,7.83-.59Z"
      {...S}
    />
  ),
  clock: (
    <>
      <circle cx="128" cy="128" r="96" {...S} />
      <polyline points="128 72 128 128 184 128" {...S} />
    </>
  ),
  arrowUpRight: (
    <>
      <line x1="64" y1="192" x2="192" y2="64" {...S} />
      <polyline points="88 64 192 64 192 168" {...S} />
    </>
  ),
};

export function Icon({ name, size = 20, title }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className="icon"
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
