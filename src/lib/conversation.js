// The application as a conversation (Variation 2): the questions are grouped and asked two or three at a time, answered in
// free text (or by voice), documents are attached to the chat, the review is a sentence, and changes are typed. Plain keyword
// and pattern reading, no model: it only trusts what is clearly there, and asks again for the rest. Pure functions over the
// copy in content/application.conv.en.js (`conv`) so a real service can replace them later.
import { fill, normalisePhone, validName } from './application.js';
import { parseAnswer } from './eligibility.js';
import { extractFacts } from './intake.js';

export const CONV_KINDS = ['multi', 'docs', 'confirm', 'edit'];

export const joinList = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);

// ---- Who the card is for ---------------------------------------------------------------------------------------------

// Words that change when the card is for someone else ("your disability type" / "their disability type").
export const subject = (who, extra = {}) =>
  who === 'other'
    ? { your: 'their', Your: 'Their', you: 'they', do: 'do', they: 'they', Is: 'Is', cardholder: 'the person you’re applying for', ...extra }
    : { your: 'your', Your: 'Your', you: 'you', do: 'do', they: 'you', Is: 'Are', cardholder: 'you', ...extra };

// ---- The groups, in the order they are asked --------------------------------------------------------------------------
// required: what must be known before moving on. Optional groups can be skipped, and are done once answered or skipped.
export const EMPLOYED = ['Employed', 'Self-employed'];
const WORK_ONLY = ['workSector', 'employer', 'jobTitle', 'academicDegree']; // asked only of someone who is working

export const GROUPS = [
  { id: 'cardholder', required: ['cardholderEid'], when: (who) => who === 'other' },
  // What decides eligibility comes first: the documents (Mira reads the report), then the disability type is confirmed; then the rest.
  { id: 'documents', required: ['photo', 'report'] },
  { id: 'disability', required: ['disability'] },
  { id: 'delivery', required: ['emirate', 'address'] },
  { id: 'extras', optional: true },
  { id: 'employment', optional: true },
  { id: 'workplace', optional: true, when: (who, d) => EMPLOYED.includes(d.employmentStatus) },
  { id: 'education', optional: true, when: (who, d) => Boolean(d.employmentStatus) },
  { id: 'support', optional: true }, // on the Ministry's form for everyone, not only students
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
      if (ctx.who !== 'other') set('eidExpiry', findDate(phone ? text.replace(phone.raw, ' ') : text)?.display);
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
  return list ? fill(app.conv.ackLead, { list }) : undefined;
};

// The optional questions have a Skip button. (There is no "answer by voice" button here: the microphone in the message box is
// what the person is pointed to, and it lights up when a question is asked.)
const SKIPPABLE = ['extras', 'employment', 'workplace', 'education', 'support'];
const buttonCard = (app, id) => (SKIPPABLE.includes(id) ? { type: 'voice', label: null, skip: app.conv.skip, group: id } : null);

// The fields that were drop-down lists on the Ministry's form are offered as chips (the list each one uses is in content `options`).
const CHIP_LISTS = {
  emirate: 'emirates',
  disability: 'disability',
  employmentStatus: 'employmentStatus',
  workSector: 'workSector',
  academicDegree: 'academicDegree',
  educationLevel: 'educationLevel',
  institutionLocation: 'institutionLocation',
  specialSupport: 'yesNo',
  shadowTeacher: 'yesNo',
};

// The chips for a field, or null when it is typed or spoken only.
export function chipOptions(app, field) {
  const list = app.conv.options[CHIP_LISTS[field]];
  return list ? list.map((o) => o.value) : null;
}

// The chips of a list, with any answer that has its own section (content `chipExtras`, e.g. "Multiple" for the disability type)
// taken out of the main list.
export function chipSplit(app, field, options = chipOptions(app, field)) {
  const extra = app.conv.chipExtras?.[field];
  if (!extra) return { options };
  return { options: options.filter((o) => !extra.options.includes(o)), extra: { prompt: extra.prompt, options: extra.options.filter((o) => options.includes(o)) } };
}

const chipCard = (app, field) => ({ type: 'choices', label: app.conv.review.labels[field], ...chipSplit(app, field), prompt: app.conv.chipPrompts[field], field, spoken: `${app.conv.review.labels[field]}.` });

// Every field a group asks for, so that a group answered one chip at a time knows what is still missing.
// (A group not listed here asks for what it requires.)
export function groupFields(id, data) {
  switch (id) {
    case 'delivery':
      return ['emirate', 'address'];
    case 'disability':
      return ['disability'];
    case 'employment':
      return ['employmentStatus'];
    case 'workplace':
      return ['workSector', 'employer', 'jobTitle'];
    case 'education':
      return ['educationLevel', ...(EMPLOYED.includes(data.employmentStatus) ? ['academicDegree'] : []), 'institutionLocation'];
    case 'support':
      return ['specialSupport', 'shadowTeacher'];
    default:
      return groupMeta(id)?.required ?? [];
  }
}

// The question for one group: the words, an example, and the buttons. `partial` is true when some of it was answered.
function groupParts(app, id, { who, data }) {
  const c = app.conv;
  const g = c.groups[id];
  const meta = groupMeta(id);
  const fields = groupFields(id, data);
  const missing = fields.filter((k) => !data[k]);
  const partial = missing.length > 0 && fields.some((k) => data[k]);
  const employed = EMPLOYED.includes(data.employmentStatus);
  const other = who === 'other';
  const how = g.how;
  const itemList = id === 'extras' && other ? g.itemsOther : id === 'education' && employed ? g.itemsEmployed : g.items;
  const example = id === 'extras' && other ? g.exampleOther : id === 'education' && employed ? g.exampleEmployed : g.example;
  const sub = subject(who, { mobile: data.deliveryMobile ?? '' });
  const firstChip = missing.find((k) => chipOptions(app, k));
  // The question, how to answer it, and a note, each on its own line (the message shows them as separate paragraphs).
  return {
    question: partial ? fill(c.more, { list: joinList(missing.map((k) => g.need[k])) }) : fill(g.ask, sub),
    tag: meta.optional ? c.optionalTag : undefined,
    items: partial || !itemList ? undefined : itemList.map((t) => fill(t, sub)),
    how: partial ? (firstChip ? c.moreHowChips : c.moreHow) : how ? fill(how, sub) : undefined,
    note: partial || !g.note ? undefined : fill(g.note, sub),
    example: partial ? undefined : example,
    // Chips for the first thing still missing that has a list (one list at a time, so it is clear what a chip answers). Questions
    // that do not depend on each other and are all still open (g.sections) are shown together in one card instead.
    cards: [
      ...(g.sections && !partial
        ? [
            {
              type: 'choiceSet',
              group: id,
              sections: g.sections.map((s) => ({ field: s.field, short: c.review.labels[s.field], question: fill(s.question, sub), options: chipOptions(app, s.field) })),
            },
          ]
        : [...[missing.find((k) => chipOptions(app, k))].filter(Boolean).map((k) => chipCard(app, k))]),
      buttonCard(app, id),
    ].filter(Boolean),
  };
}

// Right after UAE PASS: the details are in, and the first group is asked.
export function buildSignInConv(app, { who, data, group }) {
  const s = app.signIn;
  const c = app.conv;
  const parts = groupParts(app, group, { who, data });
  const rows = c.profileRows[who].map((id) => s.profile.rows.find((r) => r.id === id)).filter(Boolean);
  return {
    id: 'app:signin',
    tool: { working: s.working, done: s.done },
    text: [{ lead: c.signIn.mira.lead, question: parts.question, tag: parts.tag, items: parts.items, how: parts.how, note: parts.note, example: parts.example, exampleLabel: parts.example ? c.exampleLabel : undefined }],
    // the UAE PASS details (open) come right under the acknowledgement and before the question; the answers sit under the question
    cards: [{ type: 'details', before: true, open: true, title: c.signIn.title, rows, note: s.card.note, mira: { ...c.signIn.mira, welcome: fill(c.signIn.mira.welcome, { first: s.profile.first }) }, spoken: `${c.signIn.title}.` }, ...parts.cards],
  };
}

// The message and card before the UAE PASS button, worded for who the card is for. `base` is the scripted scenario.
export function buildApplyConv(app, base, who) {
  const a = app.conv.apply[who === 'other' ? 'other' : 'self'];
  return {
    ...base,
    text: [{ lead: a.lead, primary: a.info, question: a.question, how: a.description }],
    cards: base.cards.map((card) => (card.type === 'uaepass' ? { ...card, description: a.description } : card)),
  };
}

// The first message gave all the details: UAE PASS is still the first step, to check them. `base` is the scripted scenario.
export function buildUpfrontSignIn(app, base) {
  const u = app.upfront.signIn;
  return {
    ...base,
    // one statement (no separate acknowledgement line above it), then the question with the button
    text: [{ lead: `${u.lead} ${u.primary}`, plainLead: true, question: app.conv.apply.self.question }],
    cards: base.cards.map((card) => (card.type === 'uaepass' ? { ...card, description: u.description } : card)),
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
        plainLead: true, // an acknowledgement: regular text
        primary: prefix || undefined,
        question: parts.question,
        tag: parts.tag,
        items: parts.items,
        how: parts.how,
        note: parts.note,
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
    hint: data[k] ? data[k].name : app.conv.docs.card.items[k].hint,
    done: Boolean(data[k]),
    // the file already in (sent earlier in the chat), for its thumbnail and name
    file: data[k] ? { name: data[k].name, type: data[k].type, url: data[k].url } : null,
    hintEmpty: app.conv.docs.card.items[k].hint,
    // what the document's own row accepts (the same rules as Variation 1's upload boxes)
    upload: {
      accept: app.steps[k].upload.accept,
      types: app.steps[k].upload.types,
      typeNames: app.steps[k].upload.typeNames,
      maxMb: app.upload.maxMb,
      errors: app.upload.errors,
      button: app.conv.docs.card.uploadLabel,
      remove: app.conv.docs.card.removeLabel,
    },
  }));

export function buildDocsAsk(app, { who, data, noted = [], docs = [], prefix = '' }) {
  const c = app.conv.docs;
  const sub = subject(who);
  const missing = ['photo', 'report'].filter((k) => !data[k]);
  const first = !noted.length && !docs.length && missing.length === 2;
  const text = missing.length === 2 ? fill(c.text, sub) : fill(c.one, { ...sub, missing: c.names[missing[0]] });
  const dis = data.disability;
  const kind = /intellectual|autism|psychiatric|adhd|learning|communication/i.test(dis ?? '') ? c.mira.psychological : c.mira.medical;
  const how = missing.length === 2 ? (dis ? (dis === 'Multiple' ? c.mira.multiple : fill(c.mira.report, { disability: dis.toLowerCase(), kind })) : c.how) : c.oneHow;
  return {
    id: 'app:docs',
    tool: null,
    text: [{ lead: first ? c.lead : ack(app, data, noted, docs), plainLead: true, primary: prefix || undefined, question: text, how }],
    cards: [{ type: 'docs', title: c.card.title, items: docItems(app, data), spoken: `${c.card.title}. ${missing.map((k) => c.names[k]).join(' and ')} still needed.` }],
  };
}

// Asks for one field again (from Change, or "change my …").
export function buildEditAsk(app, field, { who, lead }) {
  const text = fill(app.conv.edit[field], subject(who));
  return {
    id: 'app:edit',
    tool: null,
    text: [{ lead, question: text }],
    cards: chipOptions(app, field) ? [chipCard(app, field)] : [],
  };
}

// The rows of the review, in groups (empty groups left out). Shared by the sentence summary (Variation 2) and the review card (Variation 1).
export function reviewGroups(app, { who, data }) {
  const c = app.conv.review;
  const profile = Object.fromEntries(app.signIn.profile.rows.map((row) => [row.id, row.value]));
  const other = who === 'other';
  const row = (id, value, source, field) => (value ? { id, label: c.labels[id], value, source, field } : null);
  const file = (f) => (f ? f.name : '');
  const compact = (rows) => rows.filter(Boolean);
  const groups = [
    {
      key: 'applicant',
      title: c.groups.applicant,
      // For someone else only the applicant's name, mobile and email are used; the rest of their UAE PASS is not part of the form.
      rows: compact([
        row('applyingFor', other ? c.forOther : c.forSelf, 'you'),
        ...app.conv.profileRows[who].map((id) => row(id, profile[id], 'uaepass')),
      ]),
    },
    ...(other ? [{ key: 'cardholder', title: c.groups.cardholder, rows: compact([row('cardholderEid', data.cardholderEid, 'you', 'cardholderEid'), row('cardholderDob', data.cardholderDob, 'you', 'cardholderDob')]) }] : []),
    {
      key: 'request',
      title: c.groups.request,
      rows: compact([row('emirate', data.emirate, 'you', 'emirate'), row('address', data.address, 'you', 'address'), row('deliveryMobile', data.deliveryMobile, 'you', 'deliveryMobile')]),
    },
    { key: 'disability', title: c.groups.disability, rows: compact([row('disability', data.disability, 'you', 'disability')]) },
    {
      key: 'docs',
      title: c.groups.docs,
      rows: compact([row('photo', file(data.photo), 'you', 'photo'), row('report', file(data.report), 'you', 'report'), row('additional', (data.additional ?? []).map((f) => f.name).join(', '), 'you')]),
    },
    {
      key: 'optional',
      title: c.groups.optional,
      rows: compact([row('altMobile', data.altMobile, 'you', 'altMobile'), row('eidExpiry', data.eidExpiry, 'you', 'eidExpiry')]),
    },
    {
      key: 'work',
      title: c.groups.work,
      // Answers that no longer apply (the employment status was changed afterwards) are left out.
      rows: compact(
        ['employmentStatus', 'workSector', 'employer', 'jobTitle', 'academicDegree', 'educationLevel', 'institutionLocation', 'specialSupport', 'shadowTeacher']
          .filter((k) => !WORK_ONLY.includes(k) || EMPLOYED.includes(data.employmentStatus))
          .map((k) => row(k, data[k], 'you', k)),
      ),
    },
  ].filter((g) => g.rows.length);
  return groups;
}

// The review: a short opener and a line saying what follows, then the card with every answer. The card's confirmation says in one
// paragraph that the details are accurate and how to submit or change them.
export function buildReviewConv(app, { who, data, updated = [], fromMessage = false }) {
  const c = app.conv.review;
  const r = app.review;
  const again = updated.length > 0;
  return {
    id: 'app:review',
    tool: null,
    text: [again ? { lead: fill(c.updated, { list: joinList(updated) }), question: c.mira.question, how: c.mira.how } : { question: c.mira.question, how: c.mira.how }],
    cards: [
      {
        type: 'appReview',
        title: r.title,
        fromUaePass: fromMessage ? app.upfront.reviewTag : r.fromUaePass,
        change: r.change,
        consent: r.consent,
        note: r.note,
        submit: { label: r.submit, event: 'submit' },
        mira: { consent: c.mira.consent, submit: c.mira.submit, icons: c.mira.icons },
        groups: reviewGroups(app, { who, data }),
        spoken: 'Review your application. The details are listed in groups, with a Change option where you can edit them. Reply yes to submit, or say what you would like to change.',
      },
    ],
  };
}

export const buildNudgeConv = (lead, primary, example, exampleLabel) => ({ id: 'app:nudge', tool: null, text: [{ lead, question: primary, ...(example ? { example, exampleLabel } : {}) }], cards: [] });

export function buildResume(app, kind, data) {
  const r = app.conv.resume;
  let primary;
  if (kind === 'multi' || kind === 'edit') primary = r.multi;
  else if (kind === 'docs') primary = fill(r.docs, { list: joinList(['photo', 'report'].filter((k) => !data[k]).map((k) => app.conv.docs.names[k])) });
  else if (kind === 'confirm') primary = r.confirm;
  else return null;
  return { id: 'app:resume', tool: null, text: [{ question: primary }], cards: [] };
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
    // The list is numbered from 1 as it was asked; numbers from the form (2 for the citizenship question…) work too.
    const byPosition = Object.fromEntries(qids.map((id, i) => [i + 1, id]));
    const byForm = Object.fromEntries(qids.map((id) => [numbers[id], id]));
    const byNumber = marks.every((m) => byPosition[Number(m[1])]) ? byPosition : byForm;
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
export function buildBatch(eligibility, qids, first, who = 'self') {
  const b = eligibility.batch;
  const items = qids.map((id, i) => ({ n: i + 1, text: b.items[id] }));
  const what = qids.length === 1 ? 'one more answer' : `${qids.length} more answers`;
  return {
    id: first ? 'check:batch' : 'check:batchMore',
    tool: null,
    // The questions are part of the message (numbered as they are on the form, so "2. yes" still points at the right one).
    text: [
      {
        ...(first ? { ack: b.intro, question: b.primaries?.[qids.length] ?? b.primary, how: b.hows?.[qids.length] ?? b.how } : { question: fill(b.more, { what }), how: b.moreHow }),
        items,
        example: batchExample(eligibility, qids, who),
        exampleLabel: b.exampleLabel,
      },
    ],
    cards: [],
  };
}

export function batchExample(eligibility, qids, who = 'self') {
  const examples = who === 'other' ? { ...eligibility.batch.examples, ...eligibility.batch.examplesOther } : eligibility.batch.examples;
  const sentence = joinList(qids.map((id) => examples[id]));
  return `${sentence[0].toUpperCase()}${sentence.slice(1)}.`;
}
