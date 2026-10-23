// Assistant icons (card … search) are Phosphor-style stand-ins drawn on the same 256 grid.
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
  card: (
    <>
      <rect x="32" y="56" width="192" height="144" rx="16" {...S} />
      <line x1="32" y1="104" x2="224" y2="104" {...S} />
      <line x1="64" y1="152" x2="112" y2="152" {...S} />
    </>
  ),
  heart: (
    <path d="M128,216S28,160,28,92A52,52,0,0,1,128,72h0A52,52,0,0,1,228,92C228,160,128,216,128,216Z" {...S} />
  ),
  chat: (
    <>
      <path d="M128,32A96,96,0,0,0,44.17,176.7L32,224l47.3-12.17A96,96,0,1,0,128,32Z" {...S} />
      <line x1="96" y1="112" x2="160" y2="112" {...S} />
      <line x1="96" y1="144" x2="160" y2="144" {...S} />
    </>
  ),
  grid: (
    <>
      <rect x="40" y="40" width="72" height="72" rx="8" {...S} />
      <rect x="144" y="40" width="72" height="72" rx="8" {...S} />
      <rect x="40" y="144" width="72" height="72" rx="8" {...S} />
      <rect x="144" y="144" width="72" height="72" rx="8" {...S} />
    </>
  ),
  arrowRight: (
    <>
      <line x1="40" y1="128" x2="216" y2="128" {...S} />
      <polyline points="144 56 216 128 144 200" {...S} />
    </>
  ),
  close: (
    <>
      <line x1="200" y1="56" x2="56" y2="200" {...S} />
      <line x1="56" y1="56" x2="200" y2="200" {...S} />
    </>
  ),
  minus: <line x1="40" y1="128" x2="216" y2="128" {...S} />,
  refresh: (
    <>
      <polyline points="176 104 224 104 224 56" {...S} />
      <path d="M188.4,192a88,88,0,1,1,1.83-126.23L224,104" {...S} />
    </>
  ),
  mic: (
    <>
      <rect x="88" y="24" width="80" height="128" rx="40" {...S} />
      <path d="M200,128a72,72,0,0,1-144,0" {...S} />
      <line x1="128" y1="200" x2="128" y2="232" {...S} />
    </>
  ),
  check: <polyline points="40 144 96 200 224 72" {...S} />,
  stop: <rect x="64" y="64" width="128" height="128" rx="16" fill="currentColor" />,
  search: (
    <>
      <circle cx="112" cy="112" r="72" {...S} />
      <line x1="163" y1="163" x2="224" y2="224" {...S} />
    </>
  ),
  expand: (
    <>
      <polyline points="168 48 208 48 208 88" {...S} />
      <line x1="208" y1="48" x2="152" y2="104" {...S} />
      <polyline points="88 208 48 208 48 168" {...S} />
      <line x1="48" y1="208" x2="104" y2="152" {...S} />
    </>
  ),
  collapse: (
    <>
      <polyline points="200 104 152 104 152 56" {...S} />
      <line x1="208" y1="48" x2="152" y2="104" {...S} />
      <polyline points="56 152 104 152 104 200" {...S} />
      <line x1="48" y1="208" x2="104" y2="152" {...S} />
    </>
  ),
  user: (
    <>
      <circle cx="128" cy="96" r="40" {...S} />
      <path d="M32,216c0-48,43-72,96-72s96,24,96,72" {...S} />
    </>
  ),
  users: (
    <>
      <circle cx="88" cy="104" r="32" {...S} />
      <path d="M24,200c0-36,28-56,64-56s64,20,64,56" {...S} />
      <circle cx="184" cy="112" r="24" {...S} />
      <path d="M176,148c32,0,56,16,56,48" {...S} />
    </>
  ),
  flag: (
    <>
      <line x1="48" y1="224" x2="48" y2="48" {...S} />
      <path d="M48,56c40-24,72,24,112,0v104c-40,24-72-24-112,0" {...S} />
    </>
  ),
  home: (
    <>
      <polyline points="32 120 128 40 224 120" {...S} />
      <path d="M56,104v104h144V104" {...S} />
      <path d="M104,208v-56h48v56" {...S} />
    </>
  ),
  building: (
    <>
      <rect x="40" y="64" width="176" height="144" rx="8" {...S} />
      <line x1="128" y1="104" x2="128" y2="168" {...S} />
      <line x1="96" y1="136" x2="160" y2="136" {...S} />
      <path d="M96,64V40h64v24" {...S} />
    </>
  ),
  question: (
    <>
      <circle cx="128" cy="128" r="96" {...S} />
      <path d="M100,108a28,28,0,1,1,40,25c-8,4-12,10-12,19" {...S} />
      <circle cx="128" cy="184" r="8" fill="currentColor" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="128" cy="128" r="96" {...S} />
      <line x1="96" y1="96" x2="160" y2="160" {...S} />
      <line x1="160" y1="96" x2="96" y2="160" {...S} />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="128" cy="128" r="96" {...S} />
      <polyline points="88 132 116 160 172 104" {...S} />
    </>
  ),
  file: (
    <>
      <path d="M56,32H160l48,48V224H56Z" {...S} />
      <polyline points="160 32 160 80 208 80" {...S} />
      <line x1="88" y1="136" x2="176" y2="136" {...S} />
      <line x1="88" y1="168" x2="176" y2="168" {...S} />
    </>
  ),
  camera: (
    <>
      <rect x="32" y="72" width="192" height="136" rx="16" {...S} />
      <circle cx="128" cy="140" r="36" {...S} />
      <path d="M96,72l12-24h40l12,24" {...S} />
    </>
  ),
  arrowLeft: (
    <>
      <line x1="216" y1="128" x2="40" y2="128" {...S} />
      <polyline points="112 56 40 128 112 200" {...S} />
    </>
  ),
  info: (
    <>
      <circle cx="128" cy="128" r="96" {...S} />
      <line x1="128" y1="120" x2="128" y2="176" {...S} />
      <circle cx="128" cy="84" r="8" fill="currentColor" />
    </>
  ),
  upload: (
    <>
      <path d="M48 160v40a8 8 0 0 0 8 8h144a8 8 0 0 0 8-8v-40" {...S} />
      <polyline points="88 88 128 48 168 88" {...S} />
      <line x1="128" y1="48" x2="128" y2="160" {...S} />
    </>
  ),
  copy: (
    <>
      <rect x="88" y="88" width="128" height="128" rx="12" {...S} />
      <path d="M168 88V56a8 8 0 0 0-8-8H48a8 8 0 0 0-8 8v112a8 8 0 0 0 8 8h40" {...S} />
    </>
  ),
  shield: (
    <>
      <path d="M40 114V56a8 8 0 0 1 8-8h160a8 8 0 0 1 8 8v58c0 72-60 100-88 110-28-10-88-38-88-110Z" {...S} />
      <polyline points="92 120 120 148 168 100" {...S} />
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
