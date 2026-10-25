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

## Assistant (Mira)
- Widget in `src/components/assistant/`; all copy, persona and scripted scenarios in `src/content/assistant.en.js`; matching in `src/lib/noor.js` (replace with a service call later).
- Noor tokens (`--noor-*`) live in `tokens.css` with Figma/design-system values (Archivo + gold, decisions D1/D2); motion tokens `--dur-1…5`, `--ease-*` in `motion.css`.
- Non-POD services are guidance + link out only — never an "Apply" button. Eligibility/UAE PASS/application steps are not built; "Start check" replies with an honest stub.
- Knowledge: Mira answers general questions from the Ministry's published pages. `npm run knowledge` refreshes `src/content/knowledge/site.json` from alusra.gov.ae/en; copy and matching live in `src/content/knowledge.en.js` and `src/lib/knowledge.js`; `npm run knowledge:test` checks sample questions. No model, no network.
- Intake: details and files in one message are read by `src/lib/intake.js` (copy in `src/content/intake.en.js`); `npm run intake:test` checks it.
