// The application one question at a time (Variation 1), in the order of the Ministry's form. The same fields, option lists and
// reading of typed answers as the conversational version (conversation.js), but each turn asks a single thing: a short list is
// shown as buttons, anything else is typed or spoken, and the optional questions can be skipped. Pure functions over the copy in
// content/application.en.js (`steps`) and application.conv.en.js (`options`), so a real service can replace them later.
import { fill } from './application.js';
import { EMPLOYED, chipOptions, chipSplit, readSingle, reviewGroups, subject } from './conversation.js';

// The questions, in the order they are asked. `when` decides whether the question applies; a question that is optional is
// done once it is answered or skipped. A step can also be asked on its own, from the review (e.g. `deliveryMobile`), without being in this list.
export const STEPS = [
  { id: 'cardholderEid', when: (who) => who === 'other' },
  { id: 'cardholderDob', optional: true, when: (who) => who === 'other' },
  // What decides eligibility comes first: the documents (Mira reads the report), then the disability type is confirmed; then the rest.
  { id: 'photo' },
  { id: 'report' },
  { id: 'disability' },
  { id: 'emirate' },
  { id: 'address' },
  { id: 'additional', optional: true },
  { id: 'altMobile', optional: true },
  { id: 'eidExpiry', optional: true, when: (who) => who !== 'other' },
  { id: 'employmentStatus', optional: true },
  { id: 'workSector', optional: true, when: (who, d) => EMPLOYED.includes(d.employmentStatus) },
  { id: 'employer', optional: true, when: (who, d) => EMPLOYED.includes(d.employmentStatus) },
  { id: 'jobTitle', optional: true, when: (who, d) => EMPLOYED.includes(d.employmentStatus) },
  { id: 'educationLevel', optional: true, when: (who, d) => Boolean(d.employmentStatus) },
  { id: 'academicDegree', optional: true, when: (who, d) => EMPLOYED.includes(d.employmentStatus) },
  { id: 'institutionLocation', optional: true, when: (who, d) => Boolean(d.employmentStatus) },
  // On the Ministry's form for everyone, not only students. The two do not depend on each other, so they are asked together in one
  // card (a single one is asked on its own when the other was answered by typing, and when changed from the review).
  { id: 'support', fields: ['specialSupport', 'shadowTeacher'], optional: true },
];

export const isOptional = (id) => Boolean(STEPS.find((s) => s.id === id)?.optional);

// The next question that still needs asking, or null when the application is complete.
export function nextStep(who, data, settled) {
  return (
    STEPS.find((s) => {
      if (s.when && !s.when(who, data)) return false;
      if (s.fields ? s.fields.every((k) => data[k]) : data[s.id]) return false;
      return s.optional ? !settled.has(s.id) : true;
    })?.id ?? null
  );
}

// The answers a choice question offers.
export function stepOptions(app, id) {
  const st = app.steps[id];
  if (st.options) return st.options;
  return st.optionsFrom ? app.conv.options[st.optionsFrom].map((o) => o.value) : [];
}

// One question: what Mira says, and the buttons that go with it (the answers, and Skip when the question is optional).
// `first` is the first question after the UAE PASS details arrive; `again` asks the same upload once more.
export function buildStepPrompt(app, id, { who, data, changing = false, again = false, name = '' }) {
  const st = app.steps[id];
  const sub = subject(who, { mobile: data.deliveryMobile ?? '', name });
  const cards = [];
  if (st.kind === 'choice') {
    cards.push({ type: 'choices', label: st.label, ...chipSplit(app, id, stepOptions(app, id)), prompt: app.conv.chipPrompts[id], field: id, spoken: `${st.label}: ${stepOptions(app, id).join(', ')}.` });
  }
  if (st.kind === 'choiceSet') {
    // the questions and their order are the same as in Variation 2 (content groups.support.sections)
    cards.push({
      type: 'choiceSet',
      group: id,
      sections: app.conv.groups[id].sections.map((s) => ({ field: s.field, short: app.conv.review.labels[s.field], question: fill(s.question, sub), options: chipOptions(app, s.field) })),
    });
  }
  if (st.kind === 'file') {
    cards.push({ type: 'upload', field: id, ...st.upload, maxMb: app.upload.maxMb, drop: app.upload.drop, dropActive: app.upload.dropActive, errors: app.upload.errors, spoken: `${st.upload.title}. ${st.upload.hint}.` });
  }
  // A skip button, except when a value is being changed (there is nothing to leave out then).
  if (isOptional(id) && !changing) cards.push({ type: 'voice', label: null, skip: app.conv.skip, group: id });

  const hasOther = id === 'photo' && Boolean(data.report);
  let lead = st.lead;
  if (changing) lead = undefined; // the person asked for the change: no acknowledgement
  else if (again) lead = fill(st.leadAgain, sub);
  else if (hasOther && st.leadOne) lead = st.leadOne;
  return {
    id: `app:${id}`,
    tool: null,
    text: [{ lead, plainLead: true, question: fill(again ? st.textAgain : st.text, sub), tag: isOptional(id) && !changing ? app.conv.optionalTag : undefined, how: again || !st.how ? undefined : fill(st.how, sub), note: again || !st.note ? undefined : fill(st.note, sub) }],
    cards,
  };
}

// What a typed or spoken answer says for one question, or null. (The same reading as the conversational version.)
export const readStepAnswer = (app, id, text, who) => readSingle(id, text, { who, conv: app.conv });

// The review card: every answer in groups, with Change next to the ones the person gave.
export function buildReviewSteps(app, { who, data }) {
  const r = app.review;
  return {
    id: 'app:review',
    tool: null,
    // like Variation 2: an opener, then one line saying what follows (no separate instruction bubble)
    text: [{ lead: app.conv.review.lead, primary: `${app.conv.review.intro} ${r.text}` }],
    cards: [
      {
        type: 'appReview',
        title: r.title,
        fromUaePass: r.fromUaePass,
        change: r.change,
        consent: r.consent,
        note: r.note,
        submit: { label: r.submit, event: 'submit' },
        groups: reviewGroups(app, { who, data }),
        spoken: 'Review your application. Details, delivery, documents and optional information are listed with a Change option where you can edit them.',
      },
    ],
  };
}
