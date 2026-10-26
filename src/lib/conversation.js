// The application as a conversation (Variation 2): several answers in one message, documents by attaching, a sentence
// summary, and changes by typing. Plain keyword and pattern reading, no model: it only trusts what is clearly there,
// and asks again for the rest. Pure functions over the copy in content/application.en.js (`conv`).
import { buildReview, fill, formatSize, normalisePhone, validName } from './application.js';
import { parseAnswer } from './eligibility.js';
import { extractFacts } from './intake.js';

export const DETAILS = ['emirate', 'emergencyName', 'emergencyPhone'];

export const joinList = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

// ---- Reading a message ------------------------------------------------------------------------------------------

export const looksLikeQuestion = (text) => /\?|^\s*(what|how|when|where|why|which|who|can|could|do|does|is|are|will|should)\b/i.test(text);

const YES = /^\s*(yes|yep|yeah|yup|ok|okay|sure|submit|confirm|go ahead|please do|looks good|all good|correct|that'?s (right|correct))\b/i;
const NO = /^\s*(no|nope|not yet|wait|hold on|cancel|don'?t)\b/i;
export const parseYes = (text) => YES.test(text.replace(/[’]/g, "'"));
export const parseNo = (text) => NO.test(text.replace(/[’]/g, "'"));

// Words around a name that are not part of it ("my sister Sara Al Ketbi", "the contact is Omar Khan").
const FILLER = new Set(
  (
    "i im i'm am live lives living in at from and my the a an emergency contact is are name number mobile phone call please their his her " +
    "sister brother wife husband mother father mom mum dad friend son daughter uncle aunt cousin relative neighbour neighbor " +
    "its it's reach can you we should person as to of for with also then me no yes ok okay sure thanks thank hello hi hey not dont don't know " +
    "idk unsure change update make set instead new correct wrong actually sorry be would like want use put add emirate photo photograph " +
    "picture report details application it is that this one please number numbers"
  ).split(' '),
);

// A mobile number with its country code, or a local UAE mobile (05X XXX XXXX) read as +971.
export function lenientPhone(raw) {
  const full = normalisePhone(raw);
  if (full) return full;
  const digits = raw.replace(/\D/g, '');
  return /^0?5\d{8}$/.test(digits) ? normalisePhone(`+971${digits.replace(/^0/, '')}`) : null;
}

export function findPhone(text) {
  for (const m of text.matchAll(/(?:\+|00)?\d[\d\s-]{6,}\d/g)) {
    const value = lenientPhone(m[0]);
    if (value) return { value, raw: m[0] };
  }
  return null;
}

const ALIASES = { rak: 'Ras Al Khaimah', uaq: 'Umm Al Quwain' };
const word = (w) => new RegExp(`\\b${w.toLowerCase()}\\b`, 'i');

// Whole emirate names only (and RAK / UAQ): "Abu" alone could be the start of a person's name.
export function findEmirate(text, options) {
  const full = options.find((o) => word(o).test(text));
  if (full) return full;
  const alias = Object.keys(ALIASES).find((k) => word(k).test(text));
  return alias ? ALIASES[alias] : null;
}

export function findName(text, phoneRaw, options) {
  let t = text;
  if (phoneRaw) t = t.split(phoneRaw).join(' ');
  for (const o of options) t = t.replace(new RegExp(`\\b${o}\\b`, 'ig'), ' ');
  for (const k of Object.keys(ALIASES)) t = t.replace(new RegExp(`\\b${k}\\b`, 'ig'), ' ');
  const tokens = t
    .replace(/[,.;:!“”"()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !FILLER.has(w.toLowerCase().replace(/[’]/g, "'")))
    .filter((w) => /^\p{L}[\p{L}'’.-]*$/u.test(w));
  if (!tokens.length || tokens.length > 5) return null;
  const name = tokens.map((w) => (w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  return validName(name) ? name : null;
}

// What a message tells us about the three details. `have` is what is already known; with `overwrite` a new value replaces it.
export function readDetails(text, options, have = {}, overwrite = false) {
  const found = {};
  const phone = findPhone(text);
  if (phone && (overwrite || !have.emergencyPhone)) found.emergencyPhone = phone.value;
  const emirate = findEmirate(text, options);
  if (emirate && (overwrite || !have.emirate)) found.emirate = emirate;
  if ((overwrite || !have.emergencyName) && !looksLikeQuestion(text)) {
    const name = findName(text, phone?.raw, options);
    if (name) found.emergencyName = name;
  }
  return found;
}

// Which document a change request points at ("change my photo").
export function readEditTarget(text) {
  if (/\b(photo|photograph|picture|image)\b/i.test(text)) return 'photo';
  if (/\breport\b/i.test(text)) return 'report';
  return null;
}

// ---- Mira's turns ----------------------------------------------------------------------------------------------

const missingDetails = (data) => DETAILS.filter((k) => !data[k]);

// What was just taken, in a sentence: "Dubai as your emirate and Sara Al Ketbi (+971 50 765 4321) as your emergency contact".
function notedList(app, data, noted, docs = []) {
  const n = app.conv.noted;
  const parts = [];
  if (noted.includes('emirate')) parts.push(fill(n.emirate, { v: data.emirate }));
  if (noted.includes('emergencyName') && noted.includes('emergencyPhone')) parts.push(fill(n.both, { name: data.emergencyName, phone: data.emergencyPhone }));
  else {
    if (noted.includes('emergencyName')) parts.push(fill(n.emergencyName, { v: data.emergencyName }));
    if (noted.includes('emergencyPhone')) parts.push(fill(n.emergencyPhone, { v: data.emergencyPhone }));
  }
  for (const d of docs) parts.push(app.conv.docs.yourNames[d]);
  return joinList(parts);
}

const ack = (app, data, noted, docs) => {
  const list = notedList(app, data, noted, docs);
  return list ? fill(app.conv.ackLead, { list }) : app.conv.plainLead;
};

// A button that starts voice mode, offered whenever Mira asks for several answers at once.
const voiceCard = (app) => ({ type: 'voice', label: app.conv.voice });

// Right after UAE PASS: your details are in, and everything still needed is asked in one go.
export function buildSignInConv(app, data = {}) {
  const s = app.signIn;
  const c = app.conv;
  const missing = missingDetails(data);
  return {
    id: 'app:signin',
    tool: { working: s.working, done: s.done },
    text: [
      {
        lead: fill(s.lead, { first: s.profile.first }),
        primary: `${c.signIn.primary} ${fill(c.first, { list: joinList(missing.map((k) => c.ask[k])) })}`,
        example: c.example,
        exampleLabel: c.exampleLabel,
      },
    ],
    cards: [
      { type: 'details', title: c.signIn.title, rows: s.profile.rows, note: s.card.note, spoken: `${c.signIn.title}.` },
      voiceCard(app),
    ],
  };
}

// Asks only for what is still missing, after saying what was understood.
export function buildDetailsAsk(app, data, { noted = [], docs = [], prefix = '' } = {}) {
  const c = app.conv;
  const missing = missingDetails(data);
  return {
    id: 'app:details',
    tool: null,
    text: [{ lead: ack(app, data, noted, docs), primary: `${prefix}${prefix ? ' ' : ''}${fill(c.more, { list: joinList(missing.map((k) => c.ask[k])) })}` }],
    cards: [voiceCard(app)],
  };
}

const docItems = (app, data) =>
  ['photo', 'report'].map((k) => ({
    id: k,
    label: app.conv.docs.card.items[k].label,
    hint: data[k] ? `${data[k].name} · ${formatSize(data[k].size)}` : app.conv.docs.card.items[k].hint,
    done: Boolean(data[k]),
  }));

export function buildDocsAsk(app, data, { noted = [], docs = [], prefix = '' } = {}) {
  const c = app.conv.docs;
  const missing = ['photo', 'report'].filter((k) => !data[k]);
  const first = !noted.length && !docs.length && missing.length === 2;
  const text = missing.length === 2 ? c.text : fill(c.one, { missing: c.names[missing[0]] });
  return {
    id: 'app:docs',
    tool: null,
    text: [{ lead: first ? c.lead : ack(app, data, noted, docs), primary: `${prefix}${prefix ? ' ' : ''}${text}` }],
    cards: [{ type: 'docs', title: c.card.title, items: docItems(app, data), button: c.card.button, spoken: `${c.card.title}. ${missing.map((k) => c.names[k]).join(' and ')} still needed.` }],
  };
}

// The sentence summary, with the same review card under it for anyone who wants to see every row.
export function buildReviewConv(app, data, { updated = [] } = {}) {
  const c = app.conv.review;
  const profile = Object.fromEntries(app.signIn.profile.rows.map((row) => [row.id, row.value]));
  const base = buildReview(app, data);
  const summary = fill(c.summary, { name: profile.name, emirate: data.emirate, contact: data.emergencyName, phone: data.emergencyPhone });
  return {
    ...base,
    text: [
      updated.length
        ? { lead: fill(c.updated, { list: joinList(updated) }), primary: `${summary} ${c.askAgain}`, example: c.example, exampleLabel: app.conv.exampleLabel }
        : { lead: c.lead, primary: `${summary} ${c.ask}`, example: c.example, exampleLabel: app.conv.exampleLabel },
    ],
  };
}

export const buildNudgeConv = (lead, primary, example, exampleLabel) => ({ id: 'app:nudge', tool: null, text: [{ lead, primary, ...(example ? { example, exampleLabel } : {}) }], cards: [] });

export function buildResume(app, kind, data) {
  const r = app.conv.resume;
  let primary;
  if (kind === 'multi') primary = fill(r.multi, { list: joinList(missingDetails(data).map((k) => app.conv.ask[k])) });
  else if (kind === 'docs') primary = fill(r.docs, { list: joinList(['photo', 'report'].filter((k) => !data[k]).map((k) => app.conv.docs.names[k])) });
  else if (kind === 'confirm') primary = r.confirm;
  else return null;
  return { id: 'app:resume', tool: null, text: [{ primary }], cards: [] };
}

// ---- The eligibility questions, asked together (Variation 2) --------------------------------------------------------

// Reads one reply to the numbered questions. `qids` are the questions that were asked, in order. Understands numbered
// answers ("1. Myself 2. Emirati citizen…"), short answers in order ("myself, Emirati citizen, yes, yes") and plain
// sentences ("I'm an Emirati citizen and I have a report from a government hospital"), and only returns what it can tell.
export function readBatch(text, qids, eligibility) {
  const questions = eligibility.questions;
  const numbers = eligibility.batch.numbers;
  const read = (id, segment) => parseAnswer(questions[id], segment)?.value;
  const facts = extractFacts(text);
  const numbered = {};
  const positional = {};

  // 1. Numbers: "1. …", "2) …", "3: …", or a number at the start of a line.
  let marks = [...text.matchAll(/(?:^|\s)([1-4])\s*[.):–-]\s*/g)];
  if (marks.length < 2) marks = [...text.matchAll(/^\s*([1-4])\s+/gm)];
  if (marks.length >= 1) {
    const byNumber = Object.fromEntries(qids.map((id) => [numbers[id], id]));
    const usable = marks.every((m) => byNumber[Number(m[1])]);
    marks.forEach((m, i) => {
      const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
      const segment = text.slice(m.index + m[0].length, end);
      // If the numbers do not line up with what was asked (the person renumbered), go by order instead.
      const id = usable ? byNumber[Number(m[1])] : qids[i];
      if (id) {
        const value = read(id, segment);
        if (value) numbered[id] = value;
      }
    });
  }

  // 2. Short answers in order, when there are exactly as many as questions asked.
  if (!marks.length) {
    const parts = text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === qids.length) {
      parts.forEach((segment, i) => {
        const value = read(qids[i], segment);
        if (value) positional[qids[i]] = value;
      });
    }
  }

  const merged = { ...positional, ...facts, ...numbered };
  return Object.fromEntries(Object.entries(merged).filter(([k]) => qids.includes(k) || k in questions));
}

// The numbered questions (all of them, or only those still missing) with an example of how to answer.
export function buildBatch(eligibility, qids, first) {
  const b = eligibility.batch;
  const items = qids.map((id) => ({ n: b.numbers[id], text: b.items[id] }));
  const what = qids.length === 1 ? 'one more answer' : `${qids.length} more answers`;
  return {
    id: first ? 'check:batch' : 'check:batchMore',
    tool: null,
    text: [first ? { lead: b.lead, primary: b.primary } : { lead: b.moreLead, primary: fill(b.more, { what }) }],
    cards: [
      {
        type: 'batch',
        title: b.title,
        items,
        exampleLabel: b.exampleLabel,
        example: batchExample(eligibility, qids),
        voice: b.voice,
        spoken: `${b.title}. ${items.map((i) => `${i.n}. ${i.text}`).join(' ')}`,
      },
    ],
  };
}

export function batchExample(eligibility, qids) {
  const sentence = joinList(qids.map((id) => eligibility.batch.examples[id]));
  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`;
}
