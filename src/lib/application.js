// Application flow logic and chat turns (applying for yourself). Pure functions over the copy in
// content/application.en.js, so a real backend can replace the data sources later.

export const ORDER = ['emirate', 'emergencyName', 'emergencyPhone', 'photo', 'report'];

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

export function buildSignIn(app) {
  const s = app.signIn;
  return {
    id: 'app:signin',
    tool: { working: s.working, done: s.done },
    then: 'afterSignIn',
    text: [{ lead: fill(s.lead, { first: s.profile.first }), primary: s.primary }],
    cards: [{ type: 'fetch', title: s.card.title, rows: s.profile.rows, note: s.card.note, spoken: `From UAE PASS: ${s.profile.rows.map((r) => r.label).join(', ')}.` }],
  };
}

export function buildPrompt(app, step, { changing = false } = {}) {
  const st = app.steps[step];
  const cards = [];
  if (st.kind === 'choice') cards.push({ type: 'choices', label: st.label, options: st.options, field: step, spoken: `Choices: ${st.options.join(', ')}.` });
  if (st.kind === 'file') cards.push({ type: 'upload', field: step, ...st.upload, maxMb: app.upload.maxMb, drop: app.upload.drop, dropActive: app.upload.dropActive, errors: app.upload.errors, spoken: `${st.upload.title}. ${st.upload.hint}.` });
  return {
    id: `app:${step}`,
    tool: null,
    text: [{ lead: changing ? 'Certainly. Let’s update that.' : st.lead, primary: st.text }],
    cards,
  };
}

export function buildNudge(text) {
  return { id: 'app:nudge', tool: null, text: [{ lead: 'Thank you. One small correction is needed.', primary: text }], cards: [] };
}

export function buildReview(app, data) {
  const r = app.review;
  const profile = Object.fromEntries(app.signIn.profile.rows.map((row) => [row.id, row.value]));
  const file = (f) => (f ? `${f.name} · ${formatSize(f.size)}` : '');
  const row = (id, value, source, field) => ({ id, label: r.labels[id], value, source, field });
  return {
    id: 'app:review',
    tool: null,
    text: [{ lead: r.lead, primary: r.text }],
    cards: [
      {
        type: 'appReview',
        title: r.title,
        fromUaePass: r.fromUaePass,
        change: r.change,
        consent: r.consent,
        note: r.note,
        submit: { label: r.submit, event: 'submit' },
        groups: [
          {
            title: r.groups.details,
            rows: [
              row('applyingFor', r.myself, 'you'),
              row('name', profile.name, 'uaepass'),
              row('gender', profile.gender, 'uaepass'),
              row('dob', profile.dob, 'uaepass'),
              row('nationality', profile.nationality, 'uaepass'),
              row('eid', profile.eid, 'uaepass'),
              row('emirate', data.emirate, 'you', 'emirate'),
            ],
          },
          {
            title: r.groups.contact,
            rows: [
              row('mobile', profile.mobile, 'uaepass'),
              row('email', profile.email, 'uaepass'),
              row('emergencyName', data.emergencyName, 'you', 'emergencyName'),
              row('emergencyPhone', data.emergencyPhone, 'you', 'emergencyPhone'),
            ],
          },
          {
            title: r.groups.docs,
            rows: [row('photo', file(data.photo), 'you', 'photo'), row('report', file(data.report), 'you', 'report')],
          },
        ],
        spoken: 'Review your application. Details, contact information and documents are listed with a Change option where you can edit them.',
      },
    ],
  };
}

export function buildSubmitted(app, reference) {
  const s = app.submit;
  return {
    id: 'app:submitted',
    tool: { working: s.working, done: s.done },
    text: [{ lead: fill(s.lead, { first: app.signIn.profile.first }), primary: s.primary, secondary: s.secondary }],
    cards: [
      { type: 'submitted', reference, ...s.card, spoken: `${s.card.title}. ${s.card.refLabel}: ${reference}.` },
      { type: 'suggestions', title: 'Need anything else?', items: [s.suggestion] },
    ],
  };
}

export const newReference = () => `POD-${String(Math.floor(Math.random() * 9000) + 1000)}`;
