// The application as a conversation (Variation 2): the questions are grouped and asked two or three at a time, answered in
// free text (or by voice), documents are attached to the chat, the review is a sentence, and changes are typed. Plain keyword
// and pattern reading, no model: it only trusts what is clearly there, and asks again for the rest. Pure functions over the
// copy in content/application.conv.en.js (`conv`) so a real service can replace them later.
import { fill, formatSize, normalisePhone, validName } from './application.js';
import { parseAnswer } from './eligibility.js';
import { extractFacts } from './intake.js';

export const CONV_KINDS = ['multi', 'docs', 'confirm', 'edit'];

export const joinList = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

// ---- Who the card is for ---------------------------------------------------------------------------------------------

// Words that change when the card is for a child ("your disability type" / "your child’s disability type").
export const subject = (who, extra = {}) =>
  who === 'child'
    ? { your: 'your child’s', Your: 'Your child’s', you: 'your child', do: 'does', they: 'your child', Is: 'Is', cardholder: 'your child', ...extra }
    : { your: 'your', Your: 'Your', you: 'you', do: 'do', they: 'you', Is: 'Are', cardholder: 'you', ...extra };

// ---- The groups, in the order they are asked --------------------------------------------------------------------------
// required: what must be known before moving on. Optional groups can be skipped, and are done once answered or skipped.
const EMPLOYED = ['Employed', 'Self-employed'];

export const GROUPS = [
  { id: 'cardholder', required: ['cardholderEid'], when: (who) => who === 'child' },
  { id: 'delivery', required: ['emirate', 'address'] },
  { id: 'disability', required: ['disability'] },
  { id: 'documents', required: ['photo', 'report'] },
  { id: 'extras', optional: true },
  { id: 'employment', optional: true },
  { id: 'workplace', optional: true, when: (who, d) => EMPLOYED.includes(d.employmentStatus) },
  { id: 'education', optional: true, when: (who, d) => Boolean(d.employmentStatus) },
  { id: 'support', optional: true, when: (who, d) => Boolean(d.employmentStatus) && (who === 'child' || d.employmentStatus === 'Student') },
];

export const FIELD_GROUP = {
  cardholderEid: 'cardholder',
  cardholderDob: 'cardholder',
  emirate: 'delivery',
  address: 'delivery',
  deliveryMobile: 'delivery',
  disability: 'disability',
  altMobile: 'extras',
  eidExpiry: 'extras',
  employmentStatus: 'employment',
  workSector: 'workplace',
  employer: 'workplace',
  jobTitle: 'workplace',
  academicDegree: 'education',
  educationLevel: 'education',
  institutionLocation: 'education',
  specialSupport: 'support',
  shadowTeacher: 'support',
};

const groupMeta = (id) => GROUPS.find((g) => g.id === id);

// The next group that still has something to ask, or null when the application is complete.
export function nextGroup(who, data, settled) {
  return (
    GROUPS.find((g) => {
      if (g.when && !g.when(who, data)) return false;
      return g.optional ? !settled.has(g.id) : !g.required.every((k) => data[k]);
    })?.id ?? null
  );
}

// ---- Reading a message -------------------------------------------------------------------------------------------------

export const looksLikeQuestion = (text) => /\?|^\s*(what|how|when|where|why|which|who|can|could|do|does|is|are|will|should)\b/i.test(text);

const YES = /^\s*(yes|yep|yeah|yup|ok|okay|sure|submit|confirm|go ahead|please do|looks good|all good|correct|that'?s (right|correct))\b/i;
const NO = /^\s*(no|nope|not yet|wait|hold on|cancel|don'?t)\b/i;
const SKIP = /^\s*(skip|none|nothing|not now|n\/a|no thanks|no thank you|no|nope|nothing else|leave (it|this) out)\b/i;
export const parseYes = (text) => YES.test(text.replace(/[’]/g, "'"));
export const parseNo = (text) => NO.test(text.replace(/[’]/g, "'"));
export const parseSkip = (text) => SKIP.test(text.replace(/[’]/g, "'"));

// Words around a value that are not part of it ("my sister …", "the address is …", "change my emirate to …").
const FILLER = new Set(
  (
    "i im i'm am live lives living in at from and my the a an emergency contact is are name number mobile phone call please their his her " +
    "its it's reach can you we should person as to of for with also then me no yes ok okay sure thanks thank hello hi hey not dont don't know " +
    "idk unsure change update make set instead new correct wrong actually sorry be would like want use put add emirate photo photograph " +
    "picture report details application it is that this one address location delivery deliver delivered uae united arab emirates rak uaq " +
    "alternative alternate expiry expires expire date birth born dob id eid sector employer job title degree level education support shadow teacher"
  ).split(' '),
);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(w)}($|[^\\p{L}\\p{N}])`, 'iu');

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

// An Emirates ID: 15 digits, with or without dashes or spaces.
export function findEid(text) {
  for (const m of text.matchAll(/\d[\d\s-]{12,22}\d/g)) {
    const d = m[0].replace(/\D/g, '');
    if (d.length === 15) return { value: `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 14)}-${d.slice(14)}`, raw: m[0] };
  }
  return null;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const monthOf = (word) => {
  const w = word.toLowerCase().replace(/\.$/, '');
  return w.length >= 3 ? MONTHS.findIndex((m) => m.startsWith(w) || (w === 'sept' && m === 'september')) : -1;
};
const validDate = (y, m, d) => {
  const dt = new Date(Date.UTC(y, m, d));
  return y >= 1900 && y <= 2100 && dt.getUTCMonth() === m && dt.getUTCDate() === d;
};
const showDate = (y, m, d) => `${d} ${MONTHS[m][0].toUpperCase()}${MONTHS[m].slice(1)} ${y}`;

// A date written as "15 May 2012", "May 15, 2012", "15/05/2012" (day first) or "2012-05-15".
export function findDate(text) {
  const t = text.toLowerCase();
  let m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})\.?,?\s+(\d{4})\b/);
  if (m && monthOf(m[2]) >= 0 && validDate(+m[3], monthOf(m[2]), +m[1])) return { display: showDate(+m[3], monthOf(m[2]), +m[1]), raw: m[0] };
  m = t.match(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (m && monthOf(m[1]) >= 0 && validDate(+m[3], monthOf(m[1]), +m[2])) return { display: showDate(+m[3], monthOf(m[1]), +m[2]), raw: m[0] };
  m = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (m && validDate(+m[1], +m[2] - 1, +m[3])) return { display: showDate(+m[1], +m[2] - 1, +m[3]), raw: m[0] };
  m = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/);
  if (m && validDate(+m[3], +m[2] - 1, +m[1])) return { display: showDate(+m[3], +m[2] - 1, +m[1]), raw: m[0] };
  return null;
}

// The option whose name (or another way of saying it) appears in the message; the longest match wins, so
// "hearing and visual" is Hearing-Visual, not Hearing.
export function matchOption(text, options) {
  let best = null;
  let bestLen = 0;
  for (const o of options) {
    for (const a of new Set([o.value.toLowerCase(), ...o.aliases])) {
      if (a.length > bestLen && wordRe(a).test(text)) {
        best = o;
        bestLen = a.length;
      }
    }
  }
  return best ? best.value : null;
}

const stripOption = (text, options, value) => {
  const o = options.find((x) => x.value === value);
  if (!o) return text;
  let t = text;
  for (const a of new Set([o.value.toLowerCase(), ...o.aliases])) t = t.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(a)}(?=$|[^\\p{L}\\p{N}])`, 'giu'), '$1 ');
  return t;
};

const tidy = (s) => s.replace(/\s+/g, ' ').replace(/^[,.;:\s-]+|[,.;:\s-]+$/g, '');

// A free-text value with the words that introduce it taken off the front ("deliver it to …", "change the address to …").
function cleanFree(text) {
  return tidy(
    text
      .replace(/^\s*(please\s+)?(change|update|set|make)\s+(my\s+|the\s+|their\s+)?(delivery\s+)?(address|location|emirate|employer|job\s+title|title|mobile|number)?\s*(to|is|as)?\s*/i, '')
      .replace(/^\s*(please\s+)?(deliver(ed)?\s+(it\s+)?(to|at)|my\s+address\s+is|the\s+address\s+is|address\s*[:-]|i\s+live\s+(in|at)|we\s+live\s+(in|at)|it'?s|it\s+is)\s+/i, ''),
  );
}

// The delivery address: the message itself, unless all it says is the emirate.
function readAddress(text, emirates) {
  if (looksLikeQuestion(text)) return null;
  const addr = cleanFree(text);
  let rest = addr;
  for (const e of emirates) rest = rest.replace(new RegExp(`(^|[^\\p{L}])${escapeRe(e.value)}(?=$|[^\\p{L}])`, 'giu'), '$1 ');
  const tokens = rest.split(/[\s,.;:/-]+/).filter((t) => t && !FILLER.has(t.toLowerCase().replace(/[’]/g, "'")));
  return tokens.some((t) => /[\p{L}\p{N}]{2,}/u.test(t)) ? addr : null;
}

const LEADING = /^(?:(?:i|we|they|he|she|works?|working|worked|a|an|the|at|with|for|in|employer|job|title|position|is|my|their|his|her)\s+)+/i;
const stripLead = (s) => tidy(tidy(s).replace(LEADING, ''));
const goodText = (s) => (/\p{L}{2}/u.test(s) && s.length <= 80 ? s : null);

// Yes or no from a short phrase.
export function readYesNo(text) {
  const t = text.replace(/[’]/g, "'");
  if (/\b(no|not|don't|dont|doesn't|doesnt|never|without|none|nope)\b/i.test(t)) return 'No';
  if (/\b(yes|yeah|yep|yup|receiving|receives|has|have|does|is|there is|true)\b/i.test(t)) return 'Yes';
  return null;
}

// What a message says about the fields of one group. `have` is what is already known; with `overwrite` a new value replaces it.
export function readGroup(id, text, have, ctx, overwrite = false) {
  const found = {};
  const o = ctx.conv.options;
  const set = (k, v) => {
    if (v && (overwrite || !have[k])) found[k] = v;
  };
  switch (id) {
    case 'cardholder': {
      const eid = findEid(text);
      set('cardholderEid', eid?.value);
      const dob = findDate(eid ? text.replace(eid.raw, ' ') : text);
      set('cardholderDob', dob?.display);
      break;
    }
    case 'delivery': {
      if (looksLikeQuestion(text)) break;
      const phone = findPhone(text);
      if (phone) found.deliveryMobile = phone.value; // volunteered: used instead of the UAE PASS number
      const rest = phone ? text.replace(phone.raw, ' ') : text;
      set('emirate', matchOption(rest, o.emirates));
      set('address', readAddress(rest, o.emirates));
      break;
    }
    case 'disability':
      set('disability', matchOption(text, o.disability));
      break;
    case 'extras': {
      const phone = findPhone(text);
      set('altMobile', phone?.value);
      if (ctx.who !== 'child') set('eidExpiry', findDate(phone ? text.replace(phone.raw, ' ') : text)?.display);
      break;
    }
    case 'employment':
      set('employmentStatus', matchOption(text, o.employmentStatus));
      break;
    case 'workplace': {
      const sector = matchOption(text, o.workSector);
      set('workSector', sector);
      const rest = tidy(stripOption(text, o.workSector, sector).replace(/\bsector\b/gi, ' '));
      const parts = / as /i.test(rest) ? [rest.split(/ as (.+)/i)[0], rest.split(/ as (.+)/i)[1]] : rest.split(/[,;\n]+/);
      set('employer', goodText(stripLead(parts[0] ?? '')));
      set('jobTitle', goodText(stripLead(parts[1] ?? '')));
      break;
    }
    case 'education': {
      set('educationLevel', matchOption(text, o.educationLevel));
      if (EMPLOYED.includes(have.employmentStatus)) set('academicDegree', matchOption(text, o.academicDegree));
      set('institutionLocation', matchOption(text, o.institutionLocation));
      break;
    }
    case 'support': {
      const plain = [];
      for (const clause of text.split(/[,;.\n]|\b(?:and|but)\b/i)) {
        const yn = readYesNo(clause);
        if (!yn) continue;
        if (/shadow/i.test(clause)) set('shadowTeacher', yn);
        else if (/support|education|special/i.test(clause)) set('specialSupport', yn);
        else plain.push(yn);
      }
      const open = ['specialSupport', 'shadowTeacher'].filter((k) => !found[k] && (overwrite || !have[k]));
      if (plain.length === 1 && plain[0] === 'No' && !Object.keys(found).length) open.forEach((k) => set(k, 'No'));
      else plain.forEach((yn, i) => open[i] && set(open[i], yn));
      break;
    }
    default:
  }
  return found;
}

// One value for one field, as typed after "What is the new …?" or "change my … to …".
export function readSingle(field, text, ctx) {
  const o = ctx.conv.options;
  switch (field) {
    case 'cardholderEid':
      return findEid(text)?.value ?? null;
    case 'cardholderDob':
    case 'eidExpiry':
      return findDate(text)?.display ?? null;
    case 'emirate':
      return matchOption(text, o.emirates);
    case 'address':
      return readAddress(text, o.emirates);
    case 'deliveryMobile':
    case 'altMobile':
      return findPhone(text)?.value ?? null;
    case 'disability':
      return matchOption(text, o.disability);
    case 'employmentStatus':
      return matchOption(text, o.employmentStatus);
    case 'workSector':
      return matchOption(text, o.workSector);
    case 'academicDegree':
      return matchOption(text, o.academicDegree);
    case 'educationLevel':
      return matchOption(text, o.educationLevel);
    case 'institutionLocation':
      return matchOption(text, o.institutionLocation);
    case 'employer':
    case 'jobTitle':
      return goodText(stripLead(cleanFree(text)));
    case 'specialSupport':
    case 'shadowTeacher':
      return readYesNo(text);
    default:
      return null;
  }
}

// Which field a "change my …" message points at (checked in this order, so "alternative number" is not the delivery number).
const EDIT_KEYWORDS = [
  ['altMobile', /\b(alternative|alternate|alt|other|second)\s+(mobile|number|phone)\b/i],
  ['deliveryMobile', /\b(delivery|contact)\s+(mobile|number|phone)\b|\b(mobile|phone)\b/i],
  ['address', /\b(address|location)\b/i],
  ['emirate', /\bemirate\b/i],
  ['disability', /\b(disability|disability type)\b/i],
  ['eidExpiry', /\b(expiry|expires|expiration)\b/i],
  ['cardholderDob', /\b(birth|dob|born|birthday)\b/i],
  ['cardholderEid', /\b(emirates id|eid)\b/i],
  ['employmentStatus', /\bemployment status\b/i],
  ['workSector', /\bsector\b/i],
  ['employer', /\bemployer\b/i],
  ['jobTitle', /\bjob\b|\btitle\b/i],
  ['academicDegree', /\bdegree\b/i],
  ['educationLevel', /\beducation level\b|\bstudy level\b/i],
  ['institutionLocation', /\binstitution\b/i],
  ['specialSupport', /\bsupport\b/i],
  ['shadowTeacher', /\bshadow\b/i],
];

export function readEditField(text) {
  if (/\b(photo|photograph|picture|image)\b/i.test(text)) return 'photo';
  if (/\breport\b/i.test(text)) return 'report';
  return EDIT_KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? null;
}

// ---- Mira's turns ----------------------------------------------------------------------------------------------

// What was just taken, in a sentence.
function notedList(app, data, noted, docs = []) {
  const parts = noted.filter((k) => data[k] && app.conv.noted[k]).map((k) => fill(app.conv.noted[k], { v: data[k] }));
  for (const d of docs) parts.push(app.conv.docs.yourNames[d]);
  return joinList(parts);
}

const ack = (app, data, noted, docs) => {
  const list = notedList(app, data, noted, docs);
  return list ? fill(app.conv.ackLead, { list }) : app.conv.plainLead;
};

// Buttons that go with a question: answer by voice, and skip an optional one.
const BUTTONS = { cardholder: { voice: true }, delivery: { voice: true }, extras: { voice: true, skip: true }, employment: { skip: true }, workplace: { voice: true, skip: true }, education: { voice: true, skip: true }, support: { skip: true } };
const buttonCard = (app, id) => (BUTTONS[id] ? { type: 'voice', label: BUTTONS[id].voice ? app.conv.voice : null, skip: BUTTONS[id].skip ? app.conv.skip : null, group: id } : null);

const disabilityCard = (app) => ({ type: 'choices', label: 'Disability type', options: app.conv.options.disability.map((o) => o.value), field: 'disability', spoken: 'Disability types.' });

// The question for one group: the words, an example, and the buttons. `partial` is true when some of it was answered.
function groupParts(app, id, { who, data }) {
  const c = app.conv;
  const g = c.groups[id];
  const meta = groupMeta(id);
  const missing = (meta.required ?? []).filter((k) => !data[k]);
  const partial = Boolean(meta.required) && missing.length > 0 && meta.required.some((k) => data[k]);
  const employed = EMPLOYED.includes(data.employmentStatus);
  const child = who === 'child';
  const text = id === 'extras' && child ? g.askChild : id === 'education' && employed ? g.askEmployed : g.ask;
  const example = id === 'extras' && child ? g.exampleChild : id === 'education' && employed ? g.exampleEmployed : g.example;
  const sub = subject(who, { mobile: data.deliveryMobile ?? '' });
  return {
    primary: partial ? fill(c.more, { list: joinList(missing.map((k) => g.need[k])) }) : fill(text, sub),
    example: partial ? undefined : example,
    cards: [...(id === 'disability' ? [disabilityCard(app)] : []), buttonCard(app, id)].filter(Boolean),
  };
}

// Right after UAE PASS: the details are in, and the first group is asked.
export function buildSignInConv(app, { who, data, group }) {
  const s = app.signIn;
  const c = app.conv;
  const parts = groupParts(app, group, { who, data });
  const rows = c.profileRows.map((id) => s.profile.rows.find((r) => r.id === id)).filter(Boolean);
  return {
    id: 'app:signin',
    tool: { working: s.working, done: s.done },
    text: [{ lead: fill(s.lead, { first: s.profile.first }), primary: `${c.signIn.primary} ${parts.primary}`, example: parts.example, exampleLabel: parts.example ? c.exampleLabel : undefined }],
    cards: [{ type: 'details', title: c.signIn.title, rows, note: s.card.note, spoken: `${c.signIn.title}.` }, ...parts.cards],
  };
}

// Asks for one group (or what is still missing of it), after saying what was understood.
export function buildGroupAsk(app, id, { who, data, noted = [], docs = [], prefix = '' }) {
  const parts = groupParts(app, id, { who, data });
  return {
    id: `app:${id}`,
    tool: null,
    text: [
      {
        lead: ack(app, data, noted, docs),
        primary: `${prefix}${prefix ? ' ' : ''}${parts.primary}`,
        example: parts.example,
        exampleLabel: parts.example ? app.conv.exampleLabel : undefined,
      },
    ],
    cards: parts.cards,
  };
}

const docItems = (app, data) =>
  ['photo', 'report'].map((k) => ({
    id: k,
    label: app.conv.docs.card.items[k].label,
    hint: data[k] ? `${data[k].name} · ${formatSize(data[k].size)}` : app.conv.docs.card.items[k].hint,
    done: Boolean(data[k]),
  }));

export function buildDocsAsk(app, { who, data, noted = [], docs = [], prefix = '' }) {
  const c = app.conv.docs;
  const sub = subject(who);
  const missing = ['photo', 'report'].filter((k) => !data[k]);
  const first = !noted.length && !docs.length && missing.length === 2;
  const text = missing.length === 2 ? fill(c.text, sub) : fill(c.one, { ...sub, missing: c.names[missing[0]] });
  return {
    id: 'app:docs',
    tool: null,
    text: [{ lead: first ? c.lead : ack(app, data, noted, docs), primary: `${prefix}${prefix ? ' ' : ''}${text}` }],
    cards: [{ type: 'docs', title: c.card.title, items: docItems(app, data), button: c.card.button, spoken: `${c.card.title}. ${missing.map((k) => c.names[k]).join(' and ')} still needed.` }],
  };
}

// Asks for one field again (from Change, or "change my …").
export function buildEditAsk(app, field, { who, lead }) {
  const text = fill(app.conv.edit[field], subject(who));
  return {
    id: 'app:edit',
    tool: null,
    text: [{ lead: lead ?? 'Certainly.', primary: text }],
    cards: field === 'disability' ? [disabilityCard(app)] : [],
  };
}

// The sentence summary, with the full review card under it for anyone who wants to see every row.
export function buildReviewConv(app, { who, data, updated = [] }) {
  const c = app.conv.review;
  const profile = Object.fromEntries(app.signIn.profile.rows.map((row) => [row.id, row.value]));
  const child = who === 'child';
  const summary = fill(child ? c.summaryChild : c.summarySelf, {
    name: profile.name,
    eid: data.cardholderEid,
    where: wordRe(data.emirate).test(data.address) ? data.address : `${data.address}, ${data.emirate}`, // do not say the emirate twice
    phone: data.deliveryMobile,
    disability: data.disability,
  });
  const extraBits = [
    data.altMobile && `an alternative number (${data.altMobile})`,
    data.eidExpiry && `the Emirates ID expiry date (${data.eidExpiry})`,
    data.additional?.length && `${data.additional.length === 1 ? 'an additional report' : `${data.additional.length} additional reports`}`,
    data.employmentStatus && 'your employment and education details',
  ].filter(Boolean);
  const extras = extraBits.length ? ` ${fill(c.extras, { list: joinList(extraBits) })}` : '';
  const row = (id, value, source, field) => (value ? { id, label: c.labels[id], value, source, field } : null);
  const file = (f) => (f ? `${f.name} · ${formatSize(f.size)}` : '');
  const compact = (rows) => rows.filter(Boolean);
  const groups = [
    {
      title: c.groups.applicant,
      rows: compact([
        row('applyingFor', child ? c.forChild : c.forSelf, 'you'),
        row('name', profile.name, 'uaepass'),
        row('eid', profile.eid, 'uaepass'),
        row('nationality', profile.nationality, 'uaepass'),
        row('gender', profile.gender, 'uaepass'),
        row('mobile', profile.mobile, 'uaepass'),
        row('email', profile.email, 'uaepass'),
      ]),
    },
    ...(child ? [{ title: c.groups.cardholder, rows: compact([row('cardholderEid', data.cardholderEid, 'you', 'cardholderEid'), row('cardholderDob', data.cardholderDob, 'you', 'cardholderDob')]) }] : []),
    {
      title: c.groups.request,
      rows: compact([row('emirate', data.emirate, 'you', 'emirate'), row('address', data.address, 'you', 'address'), row('deliveryMobile', data.deliveryMobile, 'you', 'deliveryMobile')]),
    },
    { title: c.groups.disability, rows: compact([row('disability', data.disability, 'you', 'disability')]) },
    {
      title: c.groups.docs,
      rows: compact([row('photo', file(data.photo), 'you', 'photo'), row('report', file(data.report), 'you', 'report'), row('additional', (data.additional ?? []).map((f) => f.name).join(', '), 'you')]),
    },
    {
      title: c.groups.optional,
      rows: compact([row('altMobile', data.altMobile, 'you', 'altMobile'), row('eidExpiry', data.eidExpiry, 'you', 'eidExpiry')]),
    },
    {
      title: c.groups.work,
      rows: compact(['employmentStatus', 'workSector', 'employer', 'jobTitle', 'academicDegree', 'educationLevel', 'institutionLocation', 'specialSupport', 'shadowTeacher'].map((k) => row(k, data[k], 'you', k))),
    },
  ].filter((g) => g.rows.length);
  const r = app.review;
  return {
    id: 'app:review',
    tool: null,
    text: [
      updated.length
        ? { lead: fill(c.updated, { list: joinList(updated) }), primary: `${summary}${extras} ${c.askAgain}`, example: c.example, exampleLabel: app.conv.exampleLabel }
        : { lead: c.lead, primary: `${summary}${extras} ${c.ask}`, example: c.example, exampleLabel: app.conv.exampleLabel },
    ],
    cards: [
      {
        type: 'appReview',
        title: r.title,
        fromUaePass: r.fromUaePass,
        change: r.change,
        consent: r.consent,
        note: r.note,
        submit: { label: r.submit, event: 'submit' },
        groups,
        spoken: 'Review your application. The details are listed in groups, with a Change option where you can edit them.',
      },
    ],
  };
}

export const buildNudgeConv = (lead, primary, example, exampleLabel) => ({ id: 'app:nudge', tool: null, text: [{ lead, primary, ...(example ? { example, exampleLabel } : {}) }], cards: [] });

export function buildResume(app, kind, data) {
  const r = app.conv.resume;
  let primary;
  if (kind === 'multi' || kind === 'edit') primary = r.multi;
  else if (kind === 'docs') primary = fill(r.docs, { list: joinList(['photo', 'report'].filter((k) => !data[k]).map((k) => app.conv.docs.names[k])) });
  else if (kind === 'confirm') primary = r.confirm;
  else return null;
  return { id: 'app:resume', tool: null, text: [{ primary }], cards: [] };
}

// ---- The eligibility questions, asked together --------------------------------------------------------------------------

// Reads one reply to the numbered questions. `qids` are the questions that were asked, in order. Understands numbered
// answers ("1. Myself 2. Emirati citizen…"), short answers in order ("myself, Emirati citizen, yes, yes") and plain sentences
// ("I'm an Emirati citizen and I have a report from a government hospital"), and only returns what it can tell.
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
