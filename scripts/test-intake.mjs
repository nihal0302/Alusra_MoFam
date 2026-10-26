// Checks that "everything in one message" is read correctly: what the keyword reader pulls out of a message,
// how files are sorted, and what Mira does next (result, or ask for what is missing).
// `npm run intake:test`  (exits 1 if an expectation fails)
import { eligibility } from '../src/content/eligibility.en.js';
import { intake } from '../src/content/intake.en.js';
import { buildIntake, classifyFile, extractFacts, placeFiles } from '../src/lib/intake.js';
import { nextStep } from '../src/lib/eligibility.js';

let bad = 0;
const check = (label, ok, extra = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? `  ${extra}` : ''}`);
};
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

const facts = [
  ['I am an Emirati citizen applying for myself. I have a medical report from a government hospital.', { who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }],
  ['I want to apply for my son. We are Emirati and we have a psychological report from Rashid Hospital.', { who: 'other', status: 'citizen', report: 'yes', accredited: 'yes' }],
  ['My daughter has autism. We are residents of Dubai and the report is from a private clinic.', { who: 'other', status: 'resident', report: 'yes', accredited: 'no' }],
  ['I have a disability. I am a resident and I have a medical report attached.', { who: 'self', status: 'resident', report: 'yes' }],
  ['I am Emirati but I do not have a medical report yet.', { status: 'citizen', report: 'no' }],
  ['I want to apply for the card for myself, I am an Emirati', { who: 'self', status: 'citizen' }],
  ['We are on a visit visa, just visitors', { status: 'neither' }],
  ['I am not a citizen but I have residency in the UAE', { status: 'resident' }],
  ['not sure if I am a citizen, but the report is from a government hospital', { who: 'self', status: 'unsure', report: 'yes', accredited: 'yes' }],
  ['My son has a report from a hospital abroad', { who: 'other', report: 'yes', accredited: 'no' }],
  ['It is for my mother, she is an Emirati citizen', { who: 'other', status: 'citizen' }],
  ['I am applying on behalf of my brother', { who: 'other' }],
  ['This is for someone else, they have a report from a government hospital', { who: 'other', report: 'yes', accredited: 'yes' }],
  ['yes', {}],
  ['Dubai', {}],
  ['What documents do I need for the marriage grant?', {}],
  ['how much is the pod card', {}],
  ['Fatima Al Ketbi', {}],
];
for (const [text, want] of facts) {
  const got = extractFacts(text);
  check(`facts: ${text.slice(0, 74)}`, same(got, want), same(got, want) ? '' : `got ${JSON.stringify(got)} wanted ${JSON.stringify(want)}`);
}

const f = (name, type, size = 120000) => ({ name, type, size, url: `blob:${name}`, file: {} });
check('a picture is the photograph', classifyFile(f('me.jpg', 'image/jpeg')) === 'photo');
check('a PDF is the report', classifyFile(f('doctor.pdf', 'application/pdf')) === 'report');
check('a picture named like a report is the report', classifyFile(f('medical-report.png', 'image/png')) === 'report');

const both = placeFiles({}, [f('photo.jpg', 'image/jpeg'), f('report.pdf', 'application/pdf')]);
check('two files fill both slots', both.docs.photo?.name === 'photo.jpg' && both.docs.report?.name === 'report.pdf' && both.notes.length === 0);
const twoPhotos = placeFiles({}, [f('a.jpg', 'image/jpeg'), f('b.jpg', 'image/jpeg')]);
check('a second picture in one message is set aside', twoPhotos.docs.photo.name === 'a.jpg' && twoPhotos.notes[0]?.type === 'extra');
const replaced = placeFiles(both.docs, [f('new.jpg', 'image/jpeg')]);
check('a newer photo replaces the old one and says so', replaced.docs.photo.name === 'new.jpg' && replaced.notes[0]?.type === 'replaced');

const run = (answers, docs, extra = {}) => buildIntake({ eligibility, copy: intake, answers, docs, notes: [], hadText: true, fileCount: 2, ...extra });

// Scenario: everything in one go
const complete = run({ who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }, both.docs);
check('complete: goes straight to the result', complete.complete && complete.kind === 'eligible' && complete.scenario.cards.map((c) => c.type).join() === 'intake,result');
check('complete: no follow-up question', complete.scenario.then === undefined);
check('complete: checklist shows the received files', complete.scenario.cards[1].items.some((i) => i.text.includes('photo.jpg')) && complete.scenario.cards[1].items.some((i) => i.text.includes('report.pdf')));

// Scenario: some details missing
const partial = run({ who: 'other', report: 'yes' }, { photo: both.docs.photo });
check('partial: no "What I understood" card, and the next question follows', !partial.complete && partial.scenario.then === 'continueIntake' && partial.scenario.cards.length === 0);
check('partial: the next question is the first one missing', nextStep({ who: 'other', report: 'yes' }) === 'status');
const said = partial.scenario.text[0].primary;
check('partial: says what has been noted so far', said === 'I have noted that you are applying on behalf of someone else and that there is a medical or psychological report.', said);
check('partial: one answer at a time still gets no card', run({ who: 'self' }, {}).scenario.cards.length === 0 && run({ who: 'self', status: 'citizen' }, {}).scenario.cards.length === 0 && run({ who: 'self', status: 'citizen', report: 'yes' }, {}).scenario.cards.length === 0);
check('the card comes once all four are in, and lists only the documents attached', run({ who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }, { photo: both.docs.photo }).scenario.cards[0].docs.map((d) => d.id).join() === 'photo');
check('no documents sent: the card has no documents section', run({ who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }, {}).scenario.cards[0].docs.length === 0);

// Not eligible and unsure outcomes are still results
check('complete but not eligible: result card', run({ who: 'self', status: 'neither' }, both.docs).kind === 'notEligible');
check('complete with a "not sure": result card', run({ who: 'self', status: 'citizen', report: 'unsure', accredited: 'yes' }, both.docs).kind === 'unsure');

// Files sent after the result do not repeat it
const shown = complete.resultFor;
const later = run({ who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }, both.docs, { resultShownFor: shown, hadText: false, fileCount: 1 });
check('later file: updates the documents, no second result', later.scenario.cards.length === 1 && later.scenario.id === 'intake:docs');

// Files only
const filesOnly = buildIntake({ eligibility, copy: intake, answers: {}, docs: { photo: both.docs.photo }, notes: [], hadText: false, fileCount: 1 });
check('files only: thanks, and asks for the details', !filesOnly.complete && filesOnly.scenario.then === 'continueIntake' && filesOnly.scenario.text[0].lead === intake.leads.file);

console.log(bad ? `\n${bad} failed` : '\nall as expected');
process.exit(bad ? 1 : 0);
