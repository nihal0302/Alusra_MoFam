# MoFam — Al Usra front-end prototype

React + Vite. `npm install`, then `npm run dev`.

## Conventions
- Copy lives in `src/content/` only; components receive it as props.
- Colours, type, radii and motion come from `src/styles/tokens.css` and `motion.css`. Never hard-code a hex in a component; a new colour is a design decision — raise it.
- Logical CSS properties only (`inline-start`/`inline-end`, `margin-inline`, …) — Arabic/RTL is coming.
- `prefers-reduced-motion` is handled at the source, not retrofitted.
- Images resolve by file name from `src/assets/` via `ImageSlot`; missing files render a labelled slot.
- Mark any value not taken from a source as `APPROX` in a comment.
- No backend. Canned data only, structured so a real service can replace it.

See `docs/STATUS.md` for what is exact vs approximate.
