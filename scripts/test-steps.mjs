// Checks the application asked one question at a time (Variation 1): which question comes next for each kind of person, how a
// typed answer to each question is read, what each question shows (buttons, Skip, upload), and the review.
// `npm run steps:test`  (exits 1 if an expectation fails)
import { application } from '../src/content/application.en.js';
import { buildDetected, buildResumeOffer, buildResumeSummary, buildWhoAsk, detectDisability, readResume, readWho } from '../src/lib/application.js';
import { demo } from '../src/content/demo.en.js';
import { eligibility } from '../src/content/eligibility.en.js';
import { reviewRows } from '../src/lib/eligibility.js';
import { resolveHints } from '../src/lib/hints.js';
import { readFeedback, recordFeedback } from '../src/lib/feedback.js';
import { buildReviewSteps, buildStepPrompt, nextStep, readStepAnswer, STEPS } from '../src/lib/stepwise.js';

let bad = 0;
const check = (label, ok, extra = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? `  ${extra}` : ''}`);
};

// ---- The order of the questions, as someone answers them all
function walk(who, answers, skipped = []) {
  const data = {};
  const settled = new Set();
  const asked = [];
  for (let i = 0; i < 40; i++) {
    const id = nextStep(who, data, settled);
    if (!id) break;
    asked.push(id);
    if (skipped.includes(id)) settled.add(id);
    else for (const k of STEPS.find((s) => s.id === id).fields ?? [id]) data[k] = answers[k] ?? 'x';
  }
  return asked.join(' ');
}

check('self, no employment', walk('self', {}, ['employmentStatus']) === 'emirate address photo report disability additional altMobile eidExpiry employmentStatus support');
check(
  'self, employed',
  walk('self', { employmentStatus: 'Employed' }) === 'emirate address photo report disability additional altMobile eidExpiry employmentStatus workSector employer jobTitle educationLevel academicDegree institutionLocation support',
);
check(
  'self, student',
  walk('self', { employmentStatus: 'Student' }) === 'emirate address photo report disability additional altMobile eidExpiry employmentStatus educationLevel institutionLocation support',
);
check('someone else asks for their Emirates ID and birth date first, and not the expiry date', walk('other', {}, ['employmentStatus']).startsWith('cardholderEid cardholderDob emirate address') && !walk('other', {}, ['employmentStatus']).includes('eidExpiry'));
check('documents already sent are not asked again', nextStep('self', { emirate: 'Dubai', address: 'x', disability: 'Autism', photo: {}, report: {} }, new Set()) === 'additional');
check('every question has its copy', STEPS.every((s) => application.steps[s.id]) && Boolean(application.steps.deliveryMobile));

// ---- Reading what is typed
const read = (id, text, who = 'self') => readStepAnswer(application, id, text, who);
const reads = [
  ['cardholderEid', '784 1985 1234567 1', 'other', '784-1985-1234567-1'],
  ['cardholderDob', 'born 15/05/1985', 'other', '15 May 1985'],
  ['emirate', 'we live in sharjah', 'self', 'Sharjah'],
  ['address', 'Villa 12, Street 5, Al Barsha 1', 'self', 'Villa 12, Street 5, Al Barsha 1'],
  ['address', 'Dubai', 'self', null],
  ['disability', 'he is autistic', 'self', 'Autism'],
  ['altMobile', '050 111 2222', 'self', '+971 50 111 2222'],
  ['eidExpiry', '20 March 2030', 'self', '20 March 2030'],
  ['employmentStatus', 'still at school', 'self', 'Student'],
  ['workSector', 'private sector', 'self', 'Private'],
  ['employer', 'Al Noor Trading', 'self', 'Al Noor Trading'],
  ['jobTitle', 'accountant', 'self', 'accountant'],
  ['educationLevel', 'university', 'self', 'Higher education'],
  ['academicDegree', 'bachelors', 'self', 'Bachelor’s degree'],
  ['institutionLocation', 'abroad', 'self', 'Outside the UAE'],
  ['specialSupport', 'yes', 'self', 'Yes'],
  ['shadowTeacher', 'no', 'self', 'No'],
  ['deliveryMobile', '+971 55 123 4567', 'self', '+971 55 123 4567'],
];
for (const [id, text, who, want] of reads) {
  const got = read(id, text, who);
  check(`${id}: “${text}”`, got === want, got === want ? '' : `got ${JSON.stringify(got)}`);
}

// ---- What each question shows
const prompt = (id, who = 'self', data = {}, opts = {}) => buildStepPrompt(application, id, { who, data, ...opts });
const types = (p) => p.cards.map((c) => c.type).join(',');
check('emirate: a list of seven, no Skip', types(prompt('emirate')) === 'choices' && prompt('emirate').cards[0].options.length === 7);
check('address: typed, no buttons', types(prompt('address')) === '' && prompt('address').text[0].question.includes('{mobile}') === false);
check('address names the delivery number', prompt('address', 'self', { deliveryMobile: '+971 50 123 4567' }).text[0].note.includes('+971 50 123 4567'));
check('disability: all eleven types, Multiple in a section of its own', (() => { const k = prompt('disability').cards[0]; return k.options.length === 10 && k.extra.options.join() === 'Multiple' && !k.options.includes('Multiple'); })());
check('photo: upload card only', types(prompt('photo')) === 'upload');
check('the optional employment question has choices and Skip', types(prompt('employmentStatus')) === 'choices,voice');
check('changing an optional answer has no Skip', types(prompt('employmentStatus', 'self', {}, { changing: true })) === 'choices');
check('the two support questions are one card with Yes and No each, and a Skip button', (() => { const cs = prompt('support').cards; return cs[0].type === 'choiceSet' && cs[0].sections.length === 2 && cs[0].sections.every((s) => s.options.join() === 'Yes,No') && cs[1].type === 'voice'; })());
check('a support step with one answered is complete only when both are', nextStep('self', { emirate: 'a', address: 'a', disability: 'a', photo: {}, report: {}, specialSupport: 'No' }, new Set(['additional', 'altMobile', 'eidExpiry', 'employmentStatus'])) === 'support' && nextStep('self', { emirate: 'a', address: 'a', disability: 'a', photo: {}, report: {}, specialSupport: 'No', shadowTeacher: 'No' }, new Set(['additional', 'altMobile', 'eidExpiry', 'employmentStatus'])) === null);
check('yes or no questions offer Yes and No', prompt('specialSupport').cards[0].options.join() === 'Yes,No');
check('someone else: “their” wording', prompt('disability', 'other').text[0].question.includes('their') && !prompt('disability', 'other').text[0].question.includes('your'));
check('yourself: “your” wording', prompt('disability', 'self').text[0].question.includes('your'));
check('an extra report can be added again', prompt('additional', 'self', {}, { again: true, name: 'scan.pdf' }).text[0].lead === 'I have added scan.pdf.');
check('no placeholder is left unfilled', STEPS.every((s) => !/\{\w+\}/.test(JSON.stringify(prompt(s.id, 'other', { deliveryMobile: '+971 50 123 4567' }).text))));

// ---- The review
const data = {
  emirate: 'Dubai', address: 'Villa 12, Street 5, Al Barsha 1', deliveryMobile: '+971 50 123 4567', disability: 'Autism',
  photo: { name: 'photo.jpg', size: 2048 }, report: { name: 'report.pdf', size: 4096 }, additional: [{ name: 'scan.pdf', size: 1024 }],
  altMobile: '+971 50 111 2222', employmentStatus: 'Student', educationLevel: 'Secondary', specialSupport: 'Yes', shadowTeacher: 'No',
};
const review = buildReviewSteps(application, { who: 'self', data });
const rows = review.cards[0].groups.flatMap((g) => g.rows);
const has = (id, value) => rows.some((r) => r.id === id && (value === undefined || r.value === value));
check('review: delivery, disability, documents, optional and education rows', ['emirate', 'address', 'deliveryMobile', 'disability', 'photo', 'report', 'additional', 'altMobile', 'employmentStatus', 'educationLevel', 'specialSupport', 'shadowTeacher'].every((id) => has(id)));
check('review: what was given can be changed, UAE PASS details cannot', rows.filter((r) => r.source === 'you' && r.field).length >= 10 && rows.filter((r) => r.source === 'uaepass').every((r) => !r.field));
check('review for someone else adds the cardholder group', buildReviewSteps(application, { who: 'other', data: { ...data, cardholderEid: '784-1985-1234567-1' } }).cards[0].groups.some((g) => g.title === 'Cardholder'));

const employedRows = buildReviewSteps(application, { who: 'self', data: { ...data, employmentStatus: 'Employed', workSector: 'Private' } }).cards[0].groups.flatMap((g) => g.rows);
check('the support questions are asked of everyone and kept in the review, work answers only when employed', employedRows.some((r) => r.id === 'specialSupport') && employedRows.some((r) => r.id === 'workSector') && !buildReviewSteps(application, { who: 'self', data: { ...data, employmentStatus: 'Student', workSector: 'Private' } }).cards[0].groups.flatMap((g) => g.rows).some((r) => r.id === 'workSector'));

// ---- The reminder to use the microphone or type is given once
const hinted = (id, who = 'self') => prompt(id, who, { deliveryMobile: '+971 50 123 4567' });
const once = resolveHints(hinted('address'), true);
const later = resolveHints(hinted('address'), false);
check('the first reply that carries the reminder keeps it', once.had && once.scenario.text[0].how.includes('microphone'));
check('later replies leave it out, and the sentence still reads', later.had && !JSON.stringify(later.scenario).includes('microphone') && later.scenario.text[0].how === 'Please provide it.');
check('a line that is only the reminder disappears', (() => { const r = resolveHints(hinted('emirate'), false); return r.scenario.text[0].how === undefined && r.scenario.text[0].question.includes('emirate'); })());
check('a reply without the reminder is left as it is', (() => { const p = hinted('photo'); return resolveHints(p, false).scenario === p && !resolveHints(p, false).had; })());
check('no marker is ever shown', STEPS.every((s) => !/[‹›]/.test(JSON.stringify(resolveHints(hinted(s.id, 'other'), true).scenario)) && !/[‹›]/.test(JSON.stringify(resolveHints(hinted(s.id, 'other'), false).scenario))));

// ---- Thumbs up / down on a reply: one rating per reply, changeable, and removable
const fb = (rating, messageId = 3) => recordFeedback({ rating, variant: '2', conversation: 0, messageId, replyId: 'app:emirate', reply: 'Which emirate?' });
fb('up');
check('a thumbs up is kept', readFeedback().length === 1 && readFeedback()[0].rating === 'up' && readFeedback()[0].replyId === 'app:emirate');
fb('down');
check('rating the same reply again replaces it', readFeedback().length === 1 && readFeedback()[0].rating === 'down');
fb('up', 5);
check('another reply is a separate entry', readFeedback().length === 2);
fb(null);
check('taking a rating back removes it', readFeedback().length === 1 && readFeedback()[0].messageId === 5);


// The application starts with UAE PASS: one question (who the card is for), then the Emirates ID and birth date only for someone else.
for (const [text, want] of [['myself', 'self'], ['It is for me', 'self'], ['Someone else', 'other'], ['for my son', 'other'], ['on behalf of my mother', 'other'], ['blue', null]]) {
  check('who: ' + text, readWho(application, text) === want);
}
check('someone else: the cardholder’s Emirates ID is asked first', nextStep('other', { deliveryMobile: 'x' }, new Set()) === 'cardholderEid');
check('yourself: nothing about the cardholder is asked', nextStep('self', { deliveryMobile: 'x' }, new Set()) === 'emirate');
const whoAsk = buildWhoAsk(application, { conv: true });
check('who question: the details from UAE PASS, then Myself and Someone else', whoAsk.cards[0].type === 'details' && whoAsk.cards[1].buttons.map((b) => b.label).join() === 'Myself,Someone else');
// The report is read (simulated): the type comes from words in the file name, otherwise the sample type, and is confirmed with the person.
for (const [name, want] of [['autism-assessment.pdf', 'Autism'], ['Hearing report.pdf', 'Hearing'], ['deaf-blind.pdf', 'Hearing-Visual'], ['scan0001.pdf', application.reading.sample]]) {
  check('reading: ' + name, detectDisability(application, name) === want);
}
check('reading: confirm or change', buildDetected(application, 'Autism').cards[0].buttons.length === 2 && buildDetected(application, 'Autism').text[0].question.includes('Autism'));

// Someone returning to an application left half done: continue or start again, and what was entered earlier is shown.
for (const [text, want] of [['Continue where I stopped', 'continue'], ['yes please', 'continue'], ['Start again', 'again'], ['start over', 'again'], ['no', 'again'], ['banana', null]]) {
  check('resume: ' + text, readResume(application, text) === want);
}
check('resume: the offer has Continue and Start again', buildResumeOffer(application, demo.saved).cards[0].buttons.map((b) => b.label).join() === 'Continue where I stopped,Start again');
const summary = buildResumeSummary(application, eligibility, demo.saved, reviewRows);
check('resume: shows the UAE PASS details, the eligibility answers and the delivery details', summary.cards[0].groups.map((g) => g.key).join() === 'uaepass,eligibility,delivery' && summary.cards[0].groups[2].rows.some((r) => r.value === 'Dubai'));
check('resume: the saved application is missing the documents, so they are asked next', nextStep('self', { ...demo.saved.data }, new Set()) === 'photo');

console.log(bad ? `\n${bad} unexpected` : '\nall as expected');
process.exit(bad ? 1 : 0);
