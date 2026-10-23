# Homepage replica — status

Source: alusra.gov.ae/en/ saved page (`Alusra - Ministry of Family.html`, 23 Oct 2026).
Only the `.html` was supplied; its `_files` folder was not.

| Area | Fidelity | Why |
|---|---|---|
| Structure, section order, all copy, links | Exact | From the saved HTML |
| Registration banner, hero slider (layout, type, colours, motion, breakpoints) | Exact | CSS was inline in the HTML |
| Navbar, About, What we do, News, Careers, Contact, Footer styling | Approximate | Rules live in the missing `style.css` / `bootstrap.min.css` |
| Images and logos | Placeholder slots | Missing from `_files`; each slot names the file it expects |
| Fonts (Lyon Arabic Display, Graphik Arabic) | Fallback (Georgia / system sans) | Licensed; not supplied |
| Icons | Exact, except clock and arrow-up-right | Those two were external SVGs; Phosphor equivalents used |

## To reach "as is"
1. Copy everything from `Alusra - Ministry of Family_files/` into `src/assets/` — slots fill automatically.
2. Supply `style.css` (and `bootstrap.min.css`) — replace every `APPROX` block with the real values.
3. Supply the webfont files (or confirm a licensed source).

## Intentional deviations
- Logical CSS properties throughout, so RTL/Arabic needs no layout rewrite.
- Hero autoplay pauses on hover/focus and is off under `prefers-reduced-motion` (WCAG 2.2.2).
