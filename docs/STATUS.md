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

## Noor assistant (added 23 Oct 2026)
Source: Figma Noor component set `2789:27388` (welcome, POD reply, replacement/marriage threads).
| Area | State |
|---|---|
| Launcher, panel, welcome + topic chips, conversation, cards | Built to Figma specs |
| Thinking dots, tool chip, word-by-word streaming, listening state | Built (not in Figma; from the brief) |
| Scenarios: POD, guardian, replacement, marriage grant, track (sample data), counselling, all services, fallback | Canned |
| Voice | Simulated: mic → listening → fixed transcript |
| "Start check" | Stub reply — Eligibility (Step 3) not built |
| Dot pattern behind avatar | CSS, not the 7 MB Figma bitmap |
| Colours/type | Gold + Archivo per D1/D2; `--noor-pending` #925E14 differs from brief warning (flagged) |
Deviations from Figma: no "Apply service" (scope), "a few quick questions" (adaptive), service links point at real alusra.gov.ae pages.

### Noor revision (23 Oct 2026)
- **Accessibility:** finished replies announced once via a polite live region (streaming text hidden from screen readers); "You said / Noor said" prefixes; focus returns to the input after a topic or voice turn and to the launcher on close; all controls ≥44px; placeholder/date text moved to `--noor-muted` for 4.5:1 contrast; `aria-disabled` keeps focus where it is; forced-colors and reduced-motion handled; `dir="auto"` input for Arabic.
- **Positive feedback:** every reply opens with a short, sincere lead line with a check mark (`lead` in `assistant.en.js`).
- **Expand:** header button grows the panel from screen centre to the right edge (full screen under 900px; hidden under 520px).
- **Motion:** staggered welcome, leave/close transitions, spring user bubbles, drawn ticks, launcher ring, hover nudges; all collapse under reduced motion.
- Not verified: real screen reader (NVDA/VoiceOver) and reduced-motion emulation — only reviewed in code and checked in Chromium.

### Eligibility flow (23 Oct 2026)
- **Entry:** three tasks only — Start POD application · Ask a question · Check application status (journey map, 22 Oct). Other services are reached by typing/speaking and get guidance + link.
- **Questions** (adaptive, 2–4): who it's for → Emirati citizen / legal resident → medical or psychological report → report from an accredited authority (website terms and conditions). Answer by tapping, typing or voice. "Who it's for" is added to word the questions and apply the under-18 guardian rule; remove if not wanted.
- **Then:** Check your answers (per-row Change, adaptive re-ask) → result: eligible (preparation checklist, guardian note, "Continue with UAE PASS"), not eligible (reason, next steps, service link, call 800 114, check again), or not sure (what to confirm).
- **Stub:** "Continue with UAE PASS" replies that sign-in isn't built yet. LLM is to be connected last; `src/lib/noor.js` (matching) and `src/lib/eligibility.js` (`evaluate`) are the swap points.
- **Copy to verify:** checklist items come from the journey map (report per category, passport photo on white background); the terms list says "legal resident" where the website reads "legally resident".

### Eligibility dialog (23 Oct 2026, replaces the in-chat question cards)
- Start check / Start POD application opens the Figma-style dialog inside the panel: header with avatar, stepper (Eligibility · Documents · Application), adaptive progress bar, question bubble, option cards with icons, Back / Continue footer. Typing or speaking in your own words selects the same options.
- Check your answers → "Confirm and continue" → outcome screen (success layout from Figma). Eligible: "Review answers · I'll apply later · Yes, I want to apply"; "Yes" returns to chat with a UAE PASS sign-in card (stub). Not eligible / not sure: reasons, what to do, links, "Check again · Back to chat".
- Chat: lead lines no longer carry a check icon; the log now stays pinned to the bottom unless the reader scrolls up (previously tall cards broke the 140px rule).
- Checklist items are the two from the journey map. The Figma success screen also lists "Emirates ID of the applicant" and a dated assessment report; those are not in the sources I have, so they are not shown.

### Eligibility back in the conversation (23 Oct 2026)
- The full-screen dialog was dropped. Questions are Noor bubbles with icon option cards again; one tap answers, and typing or speaking in the main input does the same. The input stays focused (placeholder: "Type or speak your answer…"). No Back / Continue.
- Stepper (Eligibility · Documents · Application) sits in a subtle strip below the header once the check starts, so the header keeps room for expand · restart · close. Step 1 turns green when the result is eligible; 2 and 3 are not built.
- Result card keeps the Figma success layout; actions live in the card (Review answers · I'll apply later · Yes, I want to apply).
- Scroll pinning no longer mistakes its own scroll event for the reader scrolling up.

### Application, applying for yourself (23 Oct 2026)
- **Flow (all in the chat, no forms):** eligible → "Yes, I want to apply" → UAE PASS card → sign-in (simulated) → details fetched row by row (name, gender, date of birth, nationality, Emirates ID, mobile, email; sample data for "Hamdan Al Ketbi") → Noor asks emirate, emergency contact name and number → personal photograph upload → medical/psychological report upload → review (UAE PASS rows tagged, own answers editable) → "Confirm and submit" → application number (counts up, sample `PoC-xxxx`) + tracker.
- **Expanded layout** opens automatically when the check starts (not on phones, already full screen).
- **UAE PASS button:** black style, "Sign in with UAE PASS", per the UAE PASS Buttons Guidelines (2023). The fingerprint logo in `src/assets/uaepass/uae-pass-logo.svg` is an approximation; replace with the official artwork.
- **Uploads** are checked on the device (type, 10 MB) and kept in memory only. No backend: nothing is sent anywhere.
- **Docs list** now follows the website's "Required documents" (medical report for physical and sensory, psychological report for intellectual, psychological, ADHD, autism and learning difficulties, from an accredited authority; passport-size photo, white background).
- **Not built / flagged:** Figma's "Proof of residency" upload (not in the website's list), dependants/guardian path, draft saving, real notifications, Arabic.
