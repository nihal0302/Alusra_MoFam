// Application flow logic and chat turns (applying for yourself). Pure functions over the copy in
// content/application.en.js, so a real backend can replace the data sources later.

export const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// Mobile numbers must carry their country code (+ or 00 in front), 8-15 digits in all. UAE numbers
// (+971 5X XXX XXXX) are spaced for reading; other countries are kept as +<digits>.
export function normalisePhone(raw) {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  if (!/^\+[1-9]\d{7,14}$/.test(digits)) return null;
  const uae = digits.match(/^\+971(5\d)(\d{7})$/);
  return uae ? '+971 ' + uae[1] + ' ' + uae[2].slice(0, 3) + ' ' + uae[2].slice(3) : digits;
}

export const validName = (raw) => /\p{L}{2}/u.test(raw) && raw.trim().length <= 80;

export function matchEmirate(text, options) {
  const t = text.toLowerCase();
  return options.find((o) => t.includes(o.toLowerCase())) ?? options.find((o) => t.includes(o.toLowerCase().split(' ')[0]));
}

export const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export function buildSigningIn(app) {
  const w = app.signIn.wait;
  return {
    id: 'app:signing',
    tool: null,
    text: [{ lead: w.lead, primary: w.primary }],
    cards: [{ type: 'signing', title: w.title, steps: w.steps, ms: w.ms, done: w.done, note: w.note, spoken: `${w.title}. ${w.steps.join(', ')}.` }],
  };
}

// The details arriving from UAE PASS: for someone applying on behalf of another person only their own name, mobile and email.
export function buildSignIn(app, who = 'self') {
  const s = app.signIn;
  const rows = app.conv.profileRows[who].map((id) => s.profile.rows.find((r) => r.id === id)).filter(Boolean);
  return {
    id: 'app:signin',
    tool: { working: s.working, done: s.done },
    then: 'afterSignIn',
    text: [{ lead: fill(s.lead, { first: s.profile.first }), primary: who === 'other' ? app.conv.signIn.primary.other : s.primary }],
    cards: [{ type: 'fetch', title: s.card.title, rows, note: s.card.note, spoken: `From UAE PASS: ${rows.map((r) => r.label).join(', ')}.` }],
  };
}

export function buildPrompt(app, step, { changing = false, hasOther = false } = {}) {
  const st = app.steps[step];
  const cards = [];
  if (st.kind === 'choice') cards.push({ type: 'choices', label: st.label, options: st.options, field: step, spoken: `Choices: ${st.options.join(', ')}.` });
  if (st.kind === 'file') cards.push({ type: 'upload', field: step, ...st.upload, maxMb: app.upload.maxMb, drop: app.upload.drop, dropActive: app.upload.dropActive, errors: app.upload.errors, spoken: `${st.upload.title}. ${st.upload.hint}.` });
  return {
    id: `app:${step}`,
    tool: null,
    text: [{ lead: changing ? undefined : hasOther && st.leadOne ? st.leadOne : st.lead, question: st.text }],
    cards,
  };
}

export function buildNudge(text) {
  return { id: 'app:nudge', tool: null, text: [{ lead: 'A small correction is needed.', question: text }], cards: [] };
}

export function buildSubmitted(app, reference) {
  const s = app.submit;
  return {
    id: 'app:submitted',
    tool: { working: s.working, done: s.done },
    text: [{ lead: fill(s.lead, { first: app.signIn.profile.first }), primary: s.primary }],
    cards: [
      {
        type: 'submitted',
        reference,
        ...s.card,
        emailNote: s.card.emailNote,
        mira: {
          ...s.mira,
          subtitle: fill(s.mira.subtitle, {
            first: app.signIn.profile.first,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          }),
          confirm: fill(s.mira.confirm, { email: app.signIn.profile.rows.find((r) => r.id === 'email')?.value ?? '', mobile: app.signIn.profile.rows.find((r) => r.id === 'mobile')?.value ?? '' }),
        },
        spoken: `${s.card.title}. Application number: ${reference}.`,
      },
      { type: 'suggestions', title: 'Need anything else?', items: [s.suggestion] },
    ],
  };
}

// After UAE PASS: the details that came from it, and the one question of who the card is for (two buttons; typing also works).
export function buildWhoAsk(app, { conv = false } = {}) {
  const w = app.who;
  const s = app.signIn;
  const rows = app.conv.profileRows.self.map((id) => s.profile.rows.find((r) => r.id === id)).filter(Boolean);
  const m = app.conv.signIn.mira;
  const details = conv
    ? { type: 'details', before: true, open: true, title: app.conv.signIn.title, rows, note: s.card.note, mira: { ...m, welcome: fill(m.welcome, { first: s.profile.first }) }, spoken: `${app.conv.signIn.title}.` }
    : { type: 'fetch', before: true, title: s.card.title, rows, note: s.card.note, spoken: `From UAE PASS: ${rows.map((r) => r.label).join(', ')}.` };
  return {
    id: 'app:who',
    tool: { working: s.working, done: s.done },
    text: [{ lead: w.lead, question: w.question, how: w.how }],
    cards: [details, { type: 'actions', buttons: [{ label: w.myself, variant: 'primary' }, { label: w.other, variant: 'secondary' }] }],
  };
}

// When who the card is for was already said (in the first message): just the details that came from UAE PASS.
export function buildSignedIn(app, { conv = false, upfront = false } = {}) {
  const base = buildWhoAsk(app, { conv });
  const details = { ...base.cards[0], before: false };
  if (upfront && details.mira) details.mira = { ...details.mira, ...app.upfront.mira, welcome: fill(app.upfront.mira.welcome, { first: app.signIn.profile.first }) };
  return { ...base, id: 'app:signedin', text: [{ primary: upfront ? app.upfront.text : app.who.signedIn }], cards: [details] };
}

// For someone else: whether they are an Emirati citizen or a UAE resident (buttons; typing works too).
export function buildStatusAsk(app) {
  const s = app.who.status;
  return { id: 'app:status', tool: null, text: [{ question: s.question, how: s.how }], cards: [{ type: 'actions', buttons: s.options.map((o, i) => ({ label: o.label, variant: i === 0 ? 'primary' : 'secondary' })) }] };
}

// 'citizen', 'resident', 'neither' or null from a typed or spoken reply ("neither" and "resident" are checked before "citizen").
export function readStatus(app, text) {
  const t = text.toLowerCase();
  const has = (words) => words.some((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t));
  const by = Object.fromEntries(app.who.status.options.map((o) => [o.value, o.match]));
  if (has(by.neither.filter((k) => k !== 'no')) || /^\s*no\b/.test(t)) return 'neither';
  if (has(by.resident)) return 'resident';
  if (has(by.citizen)) return 'citizen';
  return null;
}

// The application cannot go on: why, and where to get help. `support` is the contact card (the same as for a question Mira cannot answer).
export function buildNotEligible(app, reason, support) {
  const n = app.notEligible;
  return {
    id: 'app:not-eligible',
    tool: null,
    // the title with the reason under it (one line), the alert mark beside them; then the offer of help above the contacts
    text: [{ alert: { title: n.question, body: n.reasons[reason] } }],
    cards: [...(support ? [{ ...support, lead: n.how }] : []), { type: 'actions', buttons: [{ label: 'Ask something else', variant: 'secondary' }, { label: 'Apply for a POD card', variant: 'primary' }] }],
  };
}

// The Emirates ID, email and mobile number found in a message (all three: the person has given their details up front).
export function readProfile(text) {
  const eid = text.match(/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/)?.[0] ?? null;
  const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null;
  const rest = text.replace(eid ?? '', ' ').replace(email ?? '', ' ');
  const mobile = rest.match(/(?:\+?971|0)?[\s-]?5\d[\s-]?\d{3}[\s-]?\d{4}/)?.[0] ?? null;
  return { eid, email, mobile };
}

// Someone returns to an application left half done: continue or start again.
export function buildResumeOffer(app, saved) {
  const r = app.resume;
  const stage = app.conv.review.labels?.[saved.stage] ?? saved.stage;
  return {
    id: 'app:resume-offer',
    tool: null,
    text: [{ ack: r.ack, question: r.question, how: fill(r.how, { stage }) }],
    cards: [{ type: 'actions', buttons: [{ label: r.continue, variant: 'primary' }, { label: r.again, variant: 'secondary' }] }],
  };
}

// What was entered earlier, shown again before the next question.
export function buildResumeSummary(app, eligibility, saved, reviewRows) {
  const r = app.resume;
  const labels = app.conv.review.labels;
  const uaepass = app.conv.profileRows[saved.who].map((id) => app.signIn.profile.rows.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x.id, label: x.label, value: x.value }));
  const who = [{ id: 'who', label: labels.applyingFor, value: saved.who === 'other' ? app.conv.review.forOther : app.conv.review.forSelf }];
  const groups = [
    { key: 'uaepass', title: r.groups.uaepass, rows: uaepass },
    { key: 'who', title: r.groups.who, rows: who },
  ].filter((g) => g.rows.length);
  return { id: 'app:resume-summary', tool: null, text: [{ primary: r.summary }], cards: [{ type: 'saved', groups, icons: r.icons, spoken: `${r.summary} ${groups.map((g) => g.title).join(', ')}.` }] };
}

// "continue" / "start again" from a typed or spoken reply: 'continue', 'again' or null.
export function readResume(app, text) {
  const t = text.toLowerCase();
  const has = (words) => words.some((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(t));
  if (has(app.resume.match.again)) return 'again';
  if (has(app.resume.match.continue)) return 'continue';
  return null;
}

// "myself" / "someone else" from a typed or spoken reply: 'self', 'other' or null.
export function readWho(app, text) {
  const t = text.toLowerCase();
  const has = (words) => words.some((k) => new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(t));
  if (has(app.who.match.other)) return 'other';
  if (has(app.who.match.self)) return 'self';
  return null;
}

// The simulated reading of the two documents, and what Mira says once she has read them.
export function buildReading(app) {
  const r = app.reading;
  return { id: 'app:reading', tool: null, text: [{ primary: r.text }], cards: [{ type: 'reading', title: r.title, steps: r.steps, ms: r.ms, done: r.done, spoken: `${r.title}. ${r.steps.join(', ')}.` }] };
}

// The disability type "found" in the report: from words in its file name, otherwise the sample type (see content `reading`).
export function detectDisability(app, fileName = '') {
  const hit = app.reading.detect.find(([pattern]) => new RegExp(pattern, 'i').test(fileName));
  return hit ? hit[1] : app.reading.sample;
}

export function buildDetected(app, value, who = 'self') {
  const r = app.reading;
  return {
    id: 'app:detected',
    tool: null,
    // a line of body copy, the type in bold, and the question as body copy under it
    text: [{ intro: fill(r.intro, { your: who === 'other' ? 'their' : 'your' }), question: value, how: r.question, plainHow: true }],
    cards: [{ type: 'actions', buttons: [{ label: r.confirm, variant: 'primary' }, { label: r.change, variant: 'secondary' }] }],
  };
}

export const newReference = () => `POD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
