// Checks the application asked one question at a time (Variation 1): which question comes next for each kind of person, how a
// typed answer to each question is read, what each question shows (buttons, Skip, upload), and the review.
// `npm run steps:test`  (exits 1 if an expectation fails)
import { application } from '../src/content/application.en.js';
import { buildDetected, buildNotEligible, buildResumeOffer, buildResumeSummary, buildWhoAsk, detectDisability, readProfile, readResume, readWho } from '../src/lib/application.js';
import { buildUpfrontSignIn } from '../src/lib/conversation.js';
import { buildCase } from '../src/lib/caseDetails.js';
import { buildMissingInfoReceived, buildStatusReply } from '../src/lib/status.js';
import { statusCheck } from '../src/content/assistant.en.js';
import { caseView } from '../src/content/case.en.js';
import { account } from '../src/content/account.en.js';
import { listApplications } from '../src/lib/account.js';
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

check('self, no employment', walk('self', {}, ['employmentStatus']) === 'photo report disability emirate address additional altMobile eidExpiry employmentStatus support');
check(
  'self, employed',
  walk('self', { employmentStatus: 'Employed' }) === 'photo report disability emirate address additional altMobile eidExpiry employmentStatus workSector employer jobTitle educationLevel academicDegree institutionLocation support',
);
check(
  'self, student',
  walk('self', { employmentStatus: 'Student' }) === 'photo report disability emirate address additional altMobile eidExpiry employmentStatus educationLevel institutionLocation support',
);
check('someone else asks for their Emirates ID and birth date first, and not the expiry date', walk('other', {}, ['employmentStatus']).startsWith('cardholderEid cardholderDob photo report') && !walk('other', {}, ['employmentStatus']).includes('eidExpiry'));
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
check('yourself: nothing about the cardholder is asked, the documents come first', nextStep('self', { deliveryMobile: 'x' }, new Set()) === 'photo');
const whoAsk = buildWhoAsk(application, { conv: true });
check('who question: the details from UAE PASS, then Myself and Someone else', whoAsk.cards[0].type === 'details' && whoAsk.cards[1].buttons.map((b) => b.label).join() === 'Myself,Someone else');
// The report is read (simulated): the type comes from words in the file name, otherwise the sample type, and is confirmed with the person.
for (const [name, want] of [['autism-assessment.pdf', 'Autism'], ['Hearing report.pdf', 'Hearing'], ['deaf-blind.pdf', 'Hearing-Visual'], ['scan0001.pdf', application.reading.sample]]) {
  check('reading: ' + name, detectDisability(application, name) === want);
}
check('reading: confirm or change', buildDetected(application, 'Autism').cards[0].buttons.length === 2 && buildDetected(application, 'Autism').text[0].question.includes('Autism'));

// Someone returning to an application left half done: continue or start again, and what was entered earlier is shown.
for (const [text, want] of [['Continue my application', 'continue'], ['yes please', 'continue'], ['Discard & start again', 'again'], ['discard it', 'again'], ['Start again', 'again'], ['start over', 'again'], ['no', 'again'], ['banana', null]]) {
  check('resume: ' + text, readResume(application, text) === want);
}
check('resume: the offer has Continue and Start again', buildResumeOffer(application, demo.saved).cards[0].buttons.map((b) => b.label).join() === 'Continue my application,Discard & start again');
const summary = buildResumeSummary(application, eligibility, demo.saved, reviewRows);
check('resume: shows the UAE PASS details and who the application is for', summary.cards[0].groups.map((g) => g.key).join() === 'uaepass,who' && summary.cards[0].groups[1].rows.some((r) => r.value === 'Myself'));
check('resume: the saved application is missing the documents, so they are asked next', nextStep('self', { ...demo.saved.data }, new Set()) === 'photo');

// Eligibility is not a test: the card is for citizens and residents with an accredited report, found out as the application goes.
check('citizenship and residency are not asked: no such question exists', !application.who.status);
const given = readProfile(demo.landing.upfront.text);
check('details up front: the Emirates ID, email and mobile are found in the message', given.eid === '784-1998-1234567-1' && given.email === 'hamdan@example.com' && given.mobile === '050 123 4567');
check('details up front: a message without them is not read as details', !readProfile('I want to apply for myself').eid);
const upSign = buildUpfrontSignIn(application, { id: 'x', tool: null, text: [], cards: [{ type: 'uaepass', action: { label: 'Sign in with UAE PASS', event: 'uaepass' } }] });
check('details up front: UAE PASS is asked first, to check the details', upSign.cards[0].type === 'uaepass' && upSign.cards[0].description === application.upfront.signIn.description && upSign.text.length === 1 && !upSign.text[0].primary && upSign.text[0].lead.startsWith('Thank you') && upSign.text[0].lead.includes('sign in with UAE PASS'));
check('not eligible: a private clinic report is not accredited', new RegExp(application.reading.notAccredited, 'i').test('private-clinic-report.pdf') && !new RegExp(application.reading.notAccredited, 'i').test('rashid-hospital-report.pdf'));
for (const reason of ['noReport', 'notAccredited']) {
  const m = buildNotEligible(application, reason, { type: 'support' });
  check('not eligible: ' + reason, m.text[0].alert.body.startsWith(application.notEligible.reasons[reason]) && m.cards[0].type === 'support' && m.cards[1].buttons.length === 2);
}

// The page of one application (src/lib/caseDetails.js): steps follow the status, the email is masked, kept file names are shown.
const caseRow = (status, details) => ({ number: 'POD-1', appliedFor: 'self', appliedOn: '22 October 2026', status, details });
const asCase = (r) => buildCase(r, application, caseView);
const rowsOf = (c) => Object.fromEntries(c.sections.flatMap((g) => g.rows.map(([label, value]) => [label, value])));
check('case: under review has three steps, the last in progress', asCase(caseRow('review')).steps.map((s) => s.state).join() === 'done,done,current');
check('case: approved has four steps, all done', asCase(caseRow('approved')).steps.map((s) => s.state).join() === 'done,done,done,done');
check('case: a draft has one step in progress; a rejected application ends with Rejected', asCase(caseRow('draft')).steps.map((s) => s.state).join() === 'current' && asCase(caseRow('rejected')).steps.map((s) => s.title).pop() === 'Rejected' && asCase(caseRow('rejected')).steps.every((s) => s.state === 'done'));
const asked = asCase(caseRow('documents'));
check('case: requested missing info shows the review paused, then the request for the applicant', asked.steps.map((s) => `${s.title}:${s.state}`).join() === 'Draft created:done,Submitted successfully:done,Review paused:current,Requested missing info:alert');
check('case: the request in the discussion has a row to upload the document it asks for (no Edit application button); the submission does not', caseView.discussion.action === 'Take action' && caseView.discussion.upload.submit === 'Submit' && caseView.discussion.upload.cancel === undefined && asked.discussion[0].documents.length === 1 && asked.discussion[0].documents[0].label === 'Personal photograph' && !asked.discussion[0].cta && !asked.discussion[1].documents);
// One colour per meaning in the tags (the list's pills and the discussion's chips); the progress steps keep their own look.
check('tones: the discussion chips use the colours of the same words in the list', caseView.discussion.items.missingInfo.tone === account.statuses.documents[1] && caseView.discussion.items.submitted.tone === account.statuses.approved[1]);
// The "Requested missing info" scenario of the chat's status check: the flow with a branch, the reviewer's comment, the upload box.
const missing = buildStatusReply(statusCheck, 'POD-1042', { missingInfo: true }).cards[0];
check('status (requested missing info): one branch out of Submitted: the review is paused, the request is active, the decision follows', missing.flow.before.map((n) => n.label).join() === 'Eligibility check,Submitted' && missing.flow.branches.map((b) => `${b.label}:${b.state}`).join() === 'Review in progress:paused,Requested missing info:current' && missing.flow.after[0].label === 'Decision');
check('status (requested missing info): one bubble: the reviewer\'s message, one named document row (an Upload button on each) for each document asked, and only View all applications (secondary); no separate Upload CTA, no email line, no "Check another number"', missing.intro.startsWith('Below is the missing information request') && Boolean(missing.comment.text) && missing.items.map((it) => it.label).join() === 'Medical report,Emirates ID' && missing.items.every((it) => it.hint && it.upload.button === 'Upload' && it.upload.types.length > 0) && !missing.upload && missing.mira.note === undefined && missing.mira.ask === undefined && Boolean(missing.account) && missing.pill === 'Requested missing info');
check('status (requested missing info): one document asked, one row', buildStatusReply({ ...statusCheck, missingInfo: { ...statusCheck.missingInfo, documents: statusCheck.missingInfo.documents.slice(0, 1) } }, 'POD-1042', { missingInfo: true }).cards[0].items.length === 1);
check('status (other scenarios): the usual steps, no branch', !buildStatusReply(statusCheck, 'POD-1042').cards[0].flow);
const usual = buildStatusReply(statusCheck, 'POD-1042').cards[0];
check('status: two buttons, View details (primary, to that application\'s page) and View all applications (secondary, to the list), and no "Check another number"', usual.details.icon === 'fileView' && usual.account.icon === 'list' && usual.details.label === 'View details' && usual.details.href === '/account/POD-1043' && usual.account.label === 'View all applications' && usual.account.href === '/account' && usual.mira.ask === undefined && missing.details.label === 'View details' && missing.details.href === '/account/POD-1042');
check('status: View details opens the first application of the list for a normal check, and the one with the reviewer\'s request (Requested missing info) in that scenario; both exist', listApplications(account)[0].number === statusCheck.card.details.number && account.rows.find((r) => r.number === statusCheck.missingInfo.number)?.status === 'documents' && usual.details.href.endsWith(listApplications(account)[0].number) && missing.details.href.endsWith(statusCheck.missingInfo.number));
check('status: no "you will get an email and SMS" line when the status is checked (either variation)', !buildStatusReply(statusCheck, 'POD-1042').cards[0].mira.note && !buildStatusReply(statusCheck, 'POD-1042').cards[0].emailNote);
check('status (requested missing info): Mira confirms the documents sent', buildMissingInfoReceived(statusCheck, 2).text[0].lead === 'Thank you. I have received your 2 documents.' && buildMissingInfoReceived(statusCheck, 1).text[0].lead.includes('your document'));
check('case: dates are short', asCase(caseRow('review')).steps[0].note === '22 Oct 2026');
check('case: the email is masked', rowsOf(asCase(caseRow('review'))).Email === 'h***@example.com');
check('case: under review shows only "Application Submitted"; documents requested shows the request first, then the submission (latest first)', asCase(caseRow('review')).discussion.map((m) => m.chip).join() === 'Application Submitted' && asCase(caseRow('documents')).discussion.map((m) => m.chip).join() === 'Requested Missing Info,Application Submitted' && asCase(caseRow('documents')).discussion[0].time === '2h ago' && asCase(caseRow('documents')).discussion[1].time === '22 Oct 2026');
// The list is static: what was submitted in the chat (or damaged data in storage) does not change it.
const memory = {};
globalThis.localStorage = { getItem: (k) => memory[k] ?? null, setItem: (k, v) => { memory[k] = v; } };
memory['mofam.submitted'] = JSON.stringify([{ number: 'POD-7777', appliedFor: 'self', appliedOn: '20 October 2026', status: 'received' }]);
const listed = listApplications(account);
check('list: static: five rows, the first is the only new one', listed.length === 5 && listed[0].isNew && listed.slice(1).every((r) => !r.isNew) && listed[0].number === account.newRow.number);
check('list: an application submitted in the chat does not change the list', !listed.some((r) => r.number === 'POD-7777'));
check('list: the first two are POD card applications, for myself then for someone else', listed[0].service === 'pod' && listed[0].appliedFor === 'self' && listed[1].service === 'pod' && listed[1].appliedFor === 'other');
delete globalThis.localStorage;
// The Submission column shows only what the application asks, in the groups of its review; the complete sample (POD-1042) also shows the optional and employment answers.
const plain = asCase(caseRow('review'));
check('case: a plain application shows the applicant, request and disability groups only', plain.sections.map((g) => g.key).join() === 'applicant,request,disability');
check('case: nothing the application does not ask (language, contact channel) is shown', !JSON.stringify(plain.sections).match(/language|channel/i));
const minimum = asCase({ ...caseRow('review'), number: 'POD-1043' });
check('case: the bare minimum application (POD-1043) gave the required answers only', minimum.sections.map((g) => g.key).join() === 'applicant,request,disability');
const full = asCase({ ...caseRow('review'), number: 'POD-1042', appliedFor: 'other' });
check('case: the complete application (POD-1042, for someone else) gave every answer, optional ones too', full.sections.map((g) => g.key).join() === 'applicant,cardholder,request,disability,optional,work' && rowsOf(full).Employer === 'Dubai Municipality' && rowsOf(full)['Job title'] === 'Administrative officer' && rowsOf(full)['Alternative mobile number'] === '+971 55 987 6543' && rowsOf(full)['Cardholder Emirates ID'] === '784-2015-7654321-0');
check('case: someone else adds the cardholder group', asCase({ ...caseRow('review'), appliedFor: 'other' }).sections.some((g) => g.key === 'cardholder'));
check('case: the answers kept with an application are the ones shown', rowsOf(asCase(caseRow('review', { data: { emirate: 'Fujairah', address: 'Street 9', disability: 'Hearing' } }))).Emirate === 'Fujairah');
check('case: the other statuses have no discussion', ['draft', 'approved', 'rejected'].every((s) => asCase(caseRow(s)).discussion.length === 0));
check('case: kept file names and sizes are shown', asCase(caseRow('review', { documents: { report: { name: 'a.pdf', size: 2048 } } })).documents[0].meta === 'a.pdf · 2 KB');

console.log(bad ? `\n${bad} unexpected` : '\nall as expected');
process.exit(bad ? 1 : 0);
