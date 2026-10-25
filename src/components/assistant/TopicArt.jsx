// The glossy tile art on the three entry cards: a straight rounded tile in a brand colour with a white glyph.
// Colours come from CSS (--art-from / --art-to on the card), so the art follows the theme.
const GLYPHS = {
  // All three glyphs are drawn in the same 26 x 26 box (19 to 45 on the 64 grid), centred on the tile, as solid white
  // shapes with round corners; details are cut out in the tile colour. That keeps their size and weight alike.
  // a page with a plus
  apply: (
    <>
      <path className="noor-art__glyph" d="M26 19H35L43 27V40a5 5 0 0 1-5 5H26a5 5 0 0 1-5-5V24a5 5 0 0 1 5-5z" />
      <path className="noor-art__fold" d="M35 19v4.5A3.5 3.5 0 0 0 38.5 27H43z" />
      <path className="noor-art__cut" d="M30.4 30.5h3.2v3.3h3.3v3.2h-3.3v3.3h-3.2V37h-3.3v-3.2h3.3z" />
    </>
  ),
  // a speech bubble with a question mark
  ask: (
    <>
      <path className="noor-art__glyph" d="M27 19H37a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H31.5L25 45l1-6.2A8 8 0 0 1 19 31v-4a8 8 0 0 1 8-8z" />
      <path className="noor-art__stroke" d="M28.9 26.4C28.9 24.6 30.3 23.5 32 23.5C33.7 23.5 35.1 24.6 35.1 26.2C35.1 27.6 34.2 28.2 33.3 28.8C32.5 29.3 32 29.8 32 31" />
      <circle className="noor-art__dot" cx="32" cy="34.3" r="1.5" />
    </>
  ),
  // a magnifying glass
  status: (
    <>
      <circle className="noor-art__ring" cx="28.5" cy="28.5" r="7.6" />
      <path className="noor-art__handle" d="M34.4 34.4L43.2 43.2" />
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
      <g>
        <rect x="7" y="7" width="50" height="50" rx="15" fill={`url(#${gid}-fill)`} />
        <path className="noor-art__sheen" d="M7 24a15 15 0 0 1 15-17h20a15 15 0 0 1 15 17v2.5c-14 8-36 8-50 0z" />
        {GLYPHS[id]}
      </g>
    </svg>
  );
}
