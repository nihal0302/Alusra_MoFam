// "Everything in one message": read what a person wrote and attached, then build Mira's reply.
// Plain keyword reading, no model: it fills the same answers the question cards would collect (who, status, report,
// accredited), and only trusts clear wording. Anything it cannot tell is asked as a normal question afterwards.
import { buildResult, nextStep, reviewRows } from './eligibility.js';

const sentence = '[^.!?\\n]';
const clause = '[^.!?,\\n]'; // stops at a comma, so "not sure if I am a citizen, but the report..." reads as two statements

// ---- Reading the message ------------------------------------------------------------------------------------------

const OTHER = new RegExp(
  "\\b(my|our)\\s+(\\w+\\s+)?(son|daughter|child|children|kid|kids|boy|girl|baby|toddler|nephew|niece|grandson|granddaughter|mother|father|mom|mum|dad|parent|parents|brother|sister|wife|husband|uncle|aunt|cousin|grandmother|grandfather|relative|friend|neighbour|neighbor)\\b|\\bfor (him|her|them|someone|somebody|another)\\b|\\b(someone|somebody) else\\b|\\bon (his|her|their|someone's|somebody's)? ?behalf\\b|\\bunder 18\\b|\\bhis (report|photo|photograph)\\b|\\bher (report|photo|photograph)\\b",
);
const SELF = new RegExp(
  "\\b(myself|for me|my own|i am applying|i'm applying|i am a person|i have a (disability|medical)|my (medical )?(report|photo|photograph)|i am an? (emirati|citizen|resident)|i'm an? (emirati|citizen|resident))\\b",
);

const NON_CITIZEN = /non[- ]emirati|not an? emirati|not an? citizen|not an? uae national/;
const NEITHER = /\b(neither|tourist|visitor|visit visa|no residency|not a resident|non[- ]resident|do not live in the uae|don't live in the uae)\b/;
const CITIZEN = /\b(emirati|emiratis|citizen|citizens|uae national|uae nationals|national of the uae)\b/;
const RESIDENT = /\b(resident|residents|residency|residence|expat|golden visa|work visa|employment visa|family visa|living in (the )?(uae|dubai|abu dhabi|sharjah|ajman|fujairah))\b/;

const NO_REPORT = new RegExp(`\\b(no|not|don't|do not|doesn't|does not|haven't|have not|without|never)\\b${sentence}{0,25}\\b(report|diagnosis|assessment|medical certificate)\\b`);
const UNSURE_REPORT = new RegExp(`not sure${clause}{0,30}\\b(report|diagnosis)\\b`);
const YES_REPORT = new RegExp(
  `\\b(have|has|got|attached|attaching|enclosed|uploaded|here (is|are)|issued|received)\\b${sentence}{0,40}\\b(report|diagnosis|assessment|medical|psychological|certificate)\\b|\\b(report|diagnosis|assessment)\\b${sentence}{0,30}\\b(attached|enclosed|issued|from)\\b`,
);

const PUBLIC_BODIES = /\b(mohap|seha|dubai health|rashid hospital|latifa hospital|al jalila|tawam|sheikh khalifa medical|skmc|ministry of health|ehs|dha)\b/;
const YES_ACCREDITED = new RegExp(
  `\\b(government|governmental|public|federal|accredited|official)\\b${sentence}{0,25}\\b(hospital|clinic|authority|centre|center|health|report|issued|doctor)\\b|\\b(hospital|clinic|report|issued)\\b${sentence}{0,25}\\b(government|governmental|accredited|public)\\b`,
);
const NO_ACCREDITED = new RegExp(
  `\\b(private|overseas|abroad|outside (the )?uae|not accredited|non[- ]accredited|not from a government)\\b${sentence}{0,25}\\b(hospital|clinic|doctor|report|centre|center|authority|issued)\\b|\\b(report|hospital|clinic)\\b${sentence}{0,25}\\b(private|abroad|overseas|not accredited)\\b`,
);

// Returns only what the message clearly says, using the same values as the question cards' options.
export function extractFacts(text) {
  const t = ` ${text.toLowerCase().replace(/[’]/g, "'")} `;
  const f = {};

  if (OTHER.test(t)) f.who = 'other';
  else if (SELF.test(t)) f.who = 'self';

  if (/not sure/.test(t) && new RegExp(`not sure${clause}{0,30}\\b(citizen|resident|emirati)\\b`).test(t)) f.status = 'unsure';
  else if (NON_CITIZEN.test(t)) f.status = RESIDENT.test(t) ? 'resident' : 'neither';
  else if (NEITHER.test(t)) f.status = 'neither';
  else if (CITIZEN.test(t)) f.status = 'citizen';
  else if (RESIDENT.test(t)) f.status = 'resident';

  if (UNSURE_REPORT.test(t)) f.report = 'unsure';
  else if (NO_REPORT.test(t)) f.report = 'no';
  else if (YES_REPORT.test(t)) f.report = 'yes';

  if (f.report !== 'no') {
    const mentionsReport = /\b(report|diagnosis|assessment|medical|psychological|certificate)\b/.test(t);
    if (NO_ACCREDITED.test(t)) f.accredited = 'no';
    else if (YES_ACCREDITED.test(t) || (mentionsReport && PUBLIC_BODIES.test(t))) f.accredited = 'yes';
    if (f.accredited && !f.report && mentionsReport) f.report = 'yes';
  }
  return f;
}

export const countFacts = (facts) => Object.keys(facts).length;

// ---- Sorting the files ------------------------------------------------------------------------------------------

// A picture is the photograph unless its name says it is a report; a PDF is the report.
export function classifyFile(file) {
  if (file.type.startsWith('image/')) return /report|medical|diagnos|assessment|psych|scan|x-?ray|certificate/i.test(file.name) ? 'report' : 'photo';
  return 'report';
}

const fileInfo = (f) => ({ name: f.name, size: f.size, type: f.type, url: f.url, file: f.file });

// Adds this message's files to the documents held so far. A newer file replaces an older one of the same kind;
// a second file of the same kind in one message is set aside. Returns what happened, for Mira to say.
export function placeFiles(docs, files) {
  const next = { ...docs };
  const seen = new Set();
  const notes = [];
  for (const f of files) {
    const kind = classifyFile(f);
    if (seen.has(kind)) {
      notes.push({ type: 'extra', kind, name: f.name });
      continue;
    }
    seen.add(kind);
    if (next[kind]) notes.push({ type: 'replaced', kind, name: f.name });
    next[kind] = fileInfo(f);
  }
  return { docs: next, notes };
}

// ---- Mira's reply ----------------------------------------------------------------------------------------------

const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const joinAnd = (list) => (list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);
const docValue = (d) => (d ? d.name : null);

// On an eligible result, the checklist shows which documents have already been attached.
export function markReceived(card, docs, copy, always = false) {
  if (card.tone !== 'success') return card;
  return {
    ...card,
    items: card.items.map((it) => {
      const k = it.icon === 'camera' ? 'photo' : it.icon === 'file' ? 'report' : null;
      if (!k) return it;
      if (docs[k]) return { ...it, text: `${copy.received} · ${docs[k].name}` };
      return always || Object.keys(docs).length ? { ...it, text: `${copy.stillToAttach} · ${it.text}` } : it;
    }),
  };
}

// answers: eligibility answers so far (already merged); docs: { photo, report } so far.
// resultShownFor: the answers a result was already shown for (so a later file does not repeat the result).
export function buildIntake({ eligibility, copy, answers, docs, notes, hadText, fileCount, resultShownFor }) {
  const step = nextStep(answers);
  const complete = step === 'review';
  const sameResult = complete && resultShownFor === JSON.stringify(answers);

  const rows = reviewRows(eligibility, answers).map((r) => ({ qid: r.qid, label: r.label, value: r.answer || null }));
  const missingDocs = ['photo', 'report'].filter((k) => !docs[k]);
  const docRows = ['photo', 'report'].map((k) => ({ id: k, label: copy.docLabels[k], value: docValue(docs[k]) }));

  const card = {
    type: 'intake',
    title: copy.card.title,
    detailsLabel: copy.card.detailsLabel,
    docsLabel: copy.card.docsLabel,
    missing: copy.card.missing,
    notAttached: copy.card.notAttached,
    changeLabel: copy.card.changeLabel,
    note: copy.card.note,
    rows,
    // Only documents the person has attached are listed: the check does not ask for them, so one that is missing is not shown as missing.
    docs: docRows.filter((d) => d.value),
    spoken: `${copy.card.title}. ${rows.map((r) => `${r.label}: ${r.value ?? copy.card.missing}`).join('. ')}.`,
  };

  // Words
  const lead = hadText
    ? fileCount > 1 ? copy.leads.readFiles : fileCount === 1 ? copy.leads.readFile : copy.leads.read
    : fileCount > 1 ? copy.leads.files : copy.leads.file;
  const noteText = notes.map((n) => fill(copy.notes[n.type], { kind: copy.docNames[n.kind], name: n.name })).join(' ');
  const missingText = missingDocs.map((k) => copy.docNames[k]).join(' and ');

  let primary;
  let secondary;
  if (sameResult) {
    primary = copy.primary.docsUpdated;
    secondary = missingDocs.length ? fill(copy.secondary.docsMissing, { missing: missingText }) : `${copy.secondary.docsDone} ${copy.secondary.resultAbove}`;
  } else if (complete) {
    primary = copy.primary.complete;
    secondary = missingDocs.length ? fill(copy.secondary.docsMissing, { missing: missingText }) : copy.secondary.docsDone;
  } else {
    // Some answers are still missing: no "What I understood" card yet. Mira says what she has noted so far (a plain sentence) and
    // the next question follows. The card comes once all the answers are in.
    const heard = Object.entries(copy.noted)
      .map(([qid, said]) => said[answers[qid]])
      .filter(Boolean);
    primary = heard.length ? fill(copy.notedLead, { list: joinAnd(heard) }) : undefined;
    secondary = undefined;
  }
  if (noteText) secondary = secondary ? `${noteText} ${secondary}` : noteText;

  const cards = complete ? [card] : [];
  let kind = null;
  if (complete && !sameResult) {
    const built = buildResult(eligibility, answers);
    kind = built.kind;
    cards.push(markReceived(built.scenario.cards[0], docs, copy, true));
  }

  return {
    complete,
    kind,
    resultFor: complete && !sameResult ? JSON.stringify(answers) : null,
    scenario: {
      id: `intake:${complete ? (sameResult ? 'docs' : 'complete') : 'partial'}`,
      tool: null,
      // When something is missing, the first missing question follows this message.
      then: complete ? undefined : 'continueIntake',
      text: [{ lead, plainLead: true, primary, secondary }],
      cards,
    },
  };
}
