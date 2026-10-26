// Checks how Variation 2 reads a free-text answer to the application questions: emirate, emergency contact and number
// in one message, local UAE numbers, and that questions or stray words are not taken as a name.
// `npm run conversation:test`  (exits 1 if an expectation fails)
import { application } from '../src/content/application.en.js';
import { eligibility } from '../src/content/eligibility.en.js';
import { findPhone, parseNo, parseYes, readBatch, readDetails, readEditTarget } from '../src/lib/conversation.js';

const options = application.steps.emirate.options;
let bad = 0;
const check = (label, ok, extra = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? `  ${extra}` : ''}`);
};
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

const reads = [
  ['Dubai, my sister Sara Al Ketbi, 050 765 4321', {}, { emirate: 'Dubai', emergencyName: 'Sara Al Ketbi', emergencyPhone: '+971 50 765 4321' }],
  ['I live in Sharjah and my emergency contact is Omar Khan, +971501234567', {}, { emirate: 'Sharjah', emergencyName: 'Omar Khan', emergencyPhone: '+971 50 123 4567' }],
  ['abu dhabi - fatima al ketbi - 00971507654321', {}, { emirate: 'Abu Dhabi', emergencyName: 'Fatima Al Ketbi', emergencyPhone: '+971 50 765 4321' }],
  ['RAK', {}, { emirate: 'Ras Al Khaimah' }],
  ['Dubai', {}, { emirate: 'Dubai' }],
  ['050 765 4321', {}, { emergencyPhone: '+971 50 765 4321' }],
  ['Abu Bakr Al Mansoori', {}, { emergencyName: 'Abu Bakr Al Mansoori' }],
  ['How long does it take?', {}, {}],
  ['yes', {}, {}],
  ['I am not sure', {}, {}],
  ['Dubai, 12345', {}, { emirate: 'Dubai' }],
  // a name is only read while one is missing
  ['Dubai and Maryam Ali', { emergencyName: 'Sara Al Ketbi' }, { emirate: 'Dubai' }],
];
for (const [text, have, want] of reads) {
  const got = readDetails(text, options, have);
  check(`reads: ${text}`, same(got, want), same(got, want) ? '' : `got ${JSON.stringify(got)} wanted ${JSON.stringify(want)}`);
}

// Changes: a new value replaces the old one
check('change: number', same(readDetails('change my emergency number to +971 50 111 2222', options, { emergencyPhone: 'x', emergencyName: 'y', emirate: 'Dubai' }, true), { emergencyPhone: '+971 50 111 2222' }));
check('change: emirate', same(readDetails('change my emirate to Sharjah', options, { emirate: 'Dubai', emergencyName: 'y', emergencyPhone: 'x' }, true), { emirate: 'Sharjah' }));
check('change: contact name', same(readDetails('make the contact Omar Khan', options, { emirate: 'Dubai', emergencyName: 'y', emergencyPhone: 'x' }, true), { emergencyName: 'Omar Khan' }));

check('phone: local UAE number', findPhone('call 0507654321')?.value === '+971 50 765 4321');
check('phone: a date is not a number', findPhone('born 15 05 1998') === null);
check('yes: "Yes, submit it"', parseYes('Yes, submit it'));
check('yes: "yes please"', parseYes('yes please'));
check('yes: not "yesterday"', !parseYes('yesterday I moved'));
check('no: "not yet"', parseNo('not yet'));
check('target: photo', readEditTarget('I want to change my photo') === 'photo');
check('target: report', readEditTarget('the report is wrong') === 'report');
check('target: none', readEditTarget('change my emirate to Sharjah') === null);


// The four eligibility questions answered in one message
const ALL = ['who', 'status', 'report', 'accredited'];
const batches = [
  ['1. Myself 2. Emirati citizen 3. Yes 4. Yes, a government hospital', ALL, { who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }],
  ['1) myself\n2) legal resident\n3) no', ALL, { who: 'self', status: 'resident', report: 'no' }],
  ['Myself, Emirati citizen, yes, yes', ALL, { who: 'self', status: 'citizen', report: 'yes', accredited: 'yes' }],
  ["It's for my son, we are Emirati citizens, we have a report from a government hospital", ALL, { who: 'child', status: 'citizen', report: 'yes', accredited: 'yes' }],
  ['3. Yes 4. a private clinic', ['report', 'accredited'], { report: 'yes', accredited: 'no' }],
  ['1. yes 2. yes', ['report', 'accredited'], { report: 'yes', accredited: 'yes' }],
  ['yes, yes', ['report', 'accredited'], { report: 'yes', accredited: 'yes' }],
  ['no', ['report'], { report: 'no' }],
  ['not sure', ['report'], { report: 'unsure' }],
  ['2. Emirati citizen', ALL, { status: 'citizen' }],
  ['blah blah', ALL, {}],
];
for (const [text, qids, want] of batches) {
  const got = readBatch(text, qids, eligibility);
  check(`batch: ${text.replace(/\n/g, ' / ')}`, same(got, want), same(got, want) ? '' : `got ${JSON.stringify(got)} wanted ${JSON.stringify(want)}`);
}

console.log(bad ? `\n${bad} failed` : '\nall as expected');
process.exit(bad ? 1 : 0);
