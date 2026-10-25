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
- **UAE PASS button:** now built from the official black button artwork (`UaePassLogo.jsx` holds the official logo paths; states active, pressed, focus ring, disabled from the supplied SVGs) and the Buttons Guidelines v2: black style on the light card, title "Sign in with UAE PASS", 300 x 44, radius 12. Title is live text, not the artwork's embedded SF Pro. White and outline styles not built (not needed on this light card); hover is not specified by the guidelines, so none is added.
- **Uploads** are checked on the device (type, 10 MB) and kept in memory only. No backend: nothing is sent anywhere.
- **Docs list** now follows the website's "Required documents" (medical report for physical and sensory, psychological report for intellectual, psychological, ADHD, autism and learning difficulties, from an accredited authority; passport-size photo, white background).
- **Not built / flagged:** Figma's "Proof of residency" upload (not in the website's list), dependants/guardian path, draft saving, real notifications, Arabic.

### Outcome card and expand timing (25 Oct 2026)
- **Expand on click:** "Start POD application" (chip or typed) grows the panel immediately, before Noor replies.
- **Outcome card:** opens at its heading when taller than the window (otherwise the whole card is simply in view); supplied green check asset (`src/assets/noor/check-success.png`); title and subtitle on one line when there is room; more space under the checklist label.
- **Report types** moved into an "i" tooltip (hover, keyboard focus or tap) on the report row.
- **Actions:** "Nothing is submitted" removed from outcome cards. One row: "Review answers" (left), "I'll apply later" + primary (right); stacks primary-first when the card is narrow.

### UAE PASS wait (25 Oct 2026)
- After "Sign in with UAE PASS", Noor shows a "Signing in with UAE PASS" card for 30 s (`signIn.wait.ms` in `application.en.js`): progress bar plus four steps, ending on "Signed in". Then the details arrive exactly as before.
- Typing is ignored during the wait; Restart cancels it. The approval itself is simulated; swap the timer in `useApplication.js` for the real UAE PASS callback.

### Success animation (25 Oct 2026)
- The eligible outcome card plays the LottieFiles "Success Check" once and rests on its last frame (`SuccessCheck.jsx`, `src/assets/noor/success-check.json`, player `lottie-web` light build). Its white background layer was removed so it sits on the card. Reduced motion shows the final frame only. Replaces the static green check image.

### Chat polish (25 Oct 2026)
- **Icons:** the assistant now uses Hugeicons (stroke, rounded; the set in the Majlis Figma library) via `@hugeicons/core-free-icons` and `ChatIcon.jsx`. The website's own icons are unchanged. Small ticks use a heavier stroke so they stay readable inside circles.
- **UAE PASS wait:** progress bar removed; steps only.
- **Upload box:** icon tile, headline, "or choose a file from your device", button; drag-over state.
- **Review:** "From UAE PASS" tags and Change links sit on one fixed right edge.
- **Submitted:** uses the success animation and opens at its top, like the eligibility result.
- **Tone:** bot lines rewritten to neutral, factual wording (no praise or claims about what the user provided).

### Round of tweaks (25 Oct 2026)
- Assistant renamed **Mira** (visible text only; `noor-*` class names, `NoorMessage`/`NoorAvatar` and asset file names are unchanged internally).
- Entry options use File add / Message question / File search icons; "Myself" / "My child" use the earlier person icons; Legal UAE resident uses a house with a door (Home03); the accredited-authority "Yes" uses Hospital02; upload button uses Upload01.
- Reference numbers read **POD-xxxx**. More space under the sign-in title and above the notification line.

### Entry, dots and attachments (25 Oct 2026)
- Entry options: 40px tiles with 22px, lighter-stroke icons. Expand/collapse use ArrowExpand01 / ArrowShrink01.
- Welcome dots: unchanged (the livelier, full-width version was tried and reverted).
- Message box has an attach (paperclip) button: PDF, JPG or PNG up to 10 MB, shown as a removable chip, sent with an optional message. Mira says plainly that she cannot read documents yet and nothing is submitted (`attachmentReply`). Always available. At the photograph and report steps, a file sent from the message box counts as that upload (same type and size checks); elsewhere Mira replies as above.

### Listening state (25 Oct 2026)
- Tapping the mic hides the three entry options and keeps the light theme: a soft white veil with four blurred colour blobs (gold, warm ember, sage, pale core) rising from the bottom and drifting slowly. No waveform. The input becomes glassmorphic (translucent sheen, strong blur and saturation, bright top edge, soft tinted shadow) ("Listening…", a hint, a small stop button). Listening lasts until stop is pressed.
- The glow is subtle at rest (about 15% opacity, as a flat low band) and gains roughly 25 points of opacity, and swells a little, as the person speaks, following the real microphone level, read on the device only (Web Audio analyser; nothing is recorded or sent) and written to the CSS variable --level. If the microphone is blocked or missing, a slow idle pulse is used; under reduced motion the glow is still and the microphone is not requested.
- New tokens --noor-glow-gold/ember/green/core (oklch, APPROX): saturated shades of the theme colours, used only here. Flagged as a design decision.
- Speech itself is still simulated: pressing stop puts a fixed sample sentence into the message box for the person to edit and send (it is not sent automatically).

- The hero carousel on the dummy homepage is now still (`hero.autoplay: false` in `home.en.js`); the dots still switch slides by hand.
- The voice glow grows taller as the person speaks (up to about 2.6x its resting height, and noticeably stronger in colour), staying a flat band at rest.
- Welcome dots keep their zoom pulse and cover about 25% more area when the panel is expanded (570px instead of 455px).
- Entry options are soft white cards with no outline and no arrow. Hover lifts the card, fills it with a warm wash, sweeps a light across it and turns the icon tile solid gold; compact panels show them as rows, the expanded panel as three taller cards.
- Every Mira reply opens with a short, professional positive line again ("Thank you, your photograph has been received.", "Happy to help you check your application.", "Good progress."). It acknowledges the person, and never claims anything the bot cannot know (nothing like "that photo is perfect").
- Fixed: after a conversation, "Start a new conversation" no longer leaves the welcome illustration and dots pushed up under the header. The conversation and welcome views are separate elements now (`key`), and the welcome view can no longer hold a scroll position.
- Voice mode: the heading becomes "Listening…" (hint "Speak naturally, then press stop" below it), and the glass input holds only a live waveform (44 small bars, dots when quiet, rising with the microphone level) with the stop button beside it. VoiceGlow publishes the level on the panel for the bars.
- Voice waveform is denser (112 bars, 2px, thinned automatically in narrow boxes) and the waveform and background glow react harder: more sensitive microphone curve, faster attack, taller bars, and a glow that rises up to roughly 3.5x its resting height.
- Voice mode: glow height reduced about 30% (up to roughly half the panel at full voice); waveform bars are capped at about 35px so they never touch the 56px glass box; the "Listening…" heading and hint now sit above the colour veil instead of being washed under it.
- Voice mode keeps the avatar and heading exactly where they are in the default state: the entry cards fade out but still hold their space (they are inert while hidden).
- The "A few things to confirm" and "Not eligible yet" cards play the LottieFiles "Info" animation (amber tones, `InfoMark.jsx`, `src/assets/noor/info-status.json`) once and rest on its last frame. "View service page" and "Call 800 114" are now white, fully rounded buttons with a gold outline, a leading phone icon on the call one, and a solid gold hover, so they no longer read as cream information cards. `LottieMark.jsx` is the shared player.
- Info animation replaced with the updated LottieFiles "Info" file (`Info Status (1).json`): same file location and player, gold circle with a white "i".
- Outcome cards use the same footer as the success card: the quiet "Check again" (refresh icon) on the left, "Call 800 114" (outlined) and "View service page" (filled) together on the right. "Review answers" is removed from every outcome card, including the eligible one.
- Tapping the microphone in the middle of a conversation now shows the Mira avatar and the "Listening…" heading (the same view as the welcome screen) over the chat; the conversation stays mounted underneath, so its scroll position is kept when listening ends.
- Info animation replaced again with `Info Status (2).json` (amber ring and a light peach disc with a white "i"); used on the "A few things to confirm" and "Not eligible yet" cards.
- Input hints reworded to a professional tone and none starts with "Or": "Describe how I can help you…" (welcome), "Type your message to Mira…", "Type or speak your answer…", "Enter or select your emirate…", "Enter the contact’s full name…", "Mobile number, e.g. +971 50 123 4567", "Upload your photograph above, or attach it here…", and "Add a note to your file (optional)…".
- "Check application status" now starts with Mira asking for the application ID (placeholder and voice sample follow suit). A POD-#### ID, typed or spoken ("POD 1042" or just the four digits also work), returns Mira's reply naming the current step plus a status card with the step in progress. Anything else gets a polite request to check the ID, and a different question simply leaves the ID prompt. Sample data only: the last digit of the ID picks one of three stages (`src/lib/status.js`, copy in `statusCheck`).
- Real assets now in use: the Al Usra and Ministry of Family logos in the header, and the registration hero photo (with its birds, transparent edges). The header and hero use the cream surface token so the photo blends into the page like the live site; the footer logos (alusra-white, uae-alusra-white) are still waiting for their files.
- Mira now answers from the Ministry's published information (alusra.gov.ae/en), with no model and no network. `npm run knowledge` reads the English site into `src/content/knowledge/site.json` (13 services, 25 FAQs on the social media resolution, About, Contact, Careers, Beneficiaries); `src/content/knowledge.en.js` frames it (service names and the words that identify each, general topics); `src/lib/knowledge.js` does the matching. A question that names a service gets the answer for what was asked (terms, documents, fees, times, how to apply) with a link card to that page; follow-ups ("and the fees?") stay on the same service; bare "fees?" asks which service; greetings and thanks get a short reply; unrelated questions say Mira could not find it and offer 800 114. The scripted flows (eligibility check, application, status) are unchanged. `npm run knowledge:test` checks about 70 sample questions. Gaps in the source (placeholder hotline "800-XXX", "Torem ipsum" text, "#" links, mistyped ".gov.as" emails) are left out on purpose.
- Entry cards redesigned after a reference: soft gold, ember and sage gradient cards, a tilted glossy tile (drawn in SVG from the theme colours: page with plus, question bubble, magnifier) in the corner, a title with a short description, and a small arrow chip that fills gold on hover. Three in a row when the chat is wide (600px and up), stacked rows when it is narrow. Descriptions live in `topics` in `assistant.en.js`.
