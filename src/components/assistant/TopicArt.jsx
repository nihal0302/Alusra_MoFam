// The glossy tile art on the three entry cards: a tilted rounded tile in a brand colour with a white glyph.
// Colours come from CSS (--art-from / --art-to on the card), so the art follows the theme.
const GLYPHS = {
  // a page with a plus
  apply: (
    <>
      <path className="noor-art__glyph" d="M23 16h13.5l8.5 8.5V47a3.5 3.5 0 0 1-3.5 3.5h-18.5A3.5 3.5 0 0 1 19.5 47V19.5A3.5 3.5 0 0 1 23 16z" />
      <path className="noor-art__fold" d="M36.5 16v5a3.5 3.5 0 0 0 3.5 3.5h5z" />
      <path className="noor-art__cut" d="M30.2 33h3.6v4h4v3.6h-4v4h-3.6v-4h-4V37h4z" />
    </>
  ),
  // a speech bubble with a question mark
  ask: (
    <>
      <path className="noor-art__glyph" d="M26 16.5h14a8.5 8.5 0 0 1 8.5 8.5v5a8.5 8.5 0 0 1-8.5 8.5h-6.5l-8 6.5 1.2-7.4A8.5 8.5 0 0 1 17.5 30v-5A8.5 8.5 0 0 1 26 16.5z" />
      <path className="noor-art__stroke" d="M28.6 26.2a4.3 4.3 0 1 1 6.1 3.9c-1.4.7-2 1.5-2 3" />
      <circle className="noor-art__dot" cx="32.7" cy="36.8" r="1.7" />
    </>
  ),
  // a magnifying glass
  status: (
    <>
      <circle className="noor-art__ring" cx="29" cy="29" r="10.5" />
      <circle className="noor-art__lens" cx="29" cy="29" r="8" />
      <path className="noor-art__handle" d="M37 37l9.5 9.5" />
    </>
  ),
};

export function TopicArt({ id }) {
  const gid = `noor-art-${id}`;
  return (
    <svg className="noor-art" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" className="noor-art__from" />
          <stop offset="1" className="noor-art__to" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 32 32)">
        <rect x="7" y="7" width="50" height="50" rx="15" fill={`url(#${gid}-fill)`} />
        <path className="noor-art__sheen" d="M7 24a15 15 0 0 1 15-17h20a15 15 0 0 1 15 17v2.5c-14 8-36 8-50 0z" />
        {GLYPHS[id]}
      </g>
    </svg>
  );
}
