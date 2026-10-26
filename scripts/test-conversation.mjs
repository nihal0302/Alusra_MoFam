// Checks how Variation 2 reads free-text answers: the grouped application questions (delivery, disability, optional details,
// employment and education), single fields changed from the review, which group comes next, and the four eligibility questions
// answered in one message.
// `npm run conversation:test`  (exits 1 if an expectation fails)
import { application } from '../src/content/application.en.js';
import { eligibility } from '../src/content/eligibility.en.js';
import {
  findDate,
  findEid,
  findPhone,
  matchOption,
  nextGroup,
  parseNo,
  parseSkip,
  parseYes,
  readBatch,
  readEditField,
  readGroup,
  readSingle,
  readYesNo,
} from '../src/lib/conversation.js';

const conv = application.conv;
let bad = 0;
const check = (label, ok, extra = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? `  ${extra}` : ''}`);
};
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
const self = { who: 'self', conv };
const child = { who: 'child', conv };

// ---- Groups: what one message tells us
const groups = [
  ['cardholder', '784-2012-1234567-1, born 15 May 2012', child, {}, { cardholderEid: '784-2012-1234567-1', cardholderDob: '15 May 2012' }],
  ['cardholder', 'his Emirates ID is 784201212345671', child, {}, { cardholderEid: '784-2012-1234567-1' }],
  ['cardholder', 'born 03/09/2013', child, {}, { cardholderDob: '3 September 2013' }],
  ['delivery', 'Dubai, Villa 12, Street 5, Al Barsha 1', self, {}, { emirate: 'Dubai', address: 'Dubai, Villa 12, Street 5, Al Barsha 1' }],
  ['delivery', 'Please deliver it to Sharjah, Al Nahda, Building 7', self, {}, { emirate: 'Sharjah', address: 'Sharjah, Al Nahda, Building 7' }],
  ['delivery', 'Dubai', self, {}, { emirate: 'Dubai' }],
  ['delivery', 'I live in Abu Dhabi', self, {}, { emirate: 'Abu Dhabi' }],
  ['delivery', 'Villa 12, Al Khalidiya', self, { emirate: 'Abu Dhabi' }, { address: 'Villa 12, Al Khalidiya' }],
  ['delivery', 'How long does delivery take?', self, {}, {}],
  ['delivery', 'RAK, near the clock tower', self, {}, { emirate: 'Ras Al Khaimah', address: 'RAK, near the clock tower' }],
  ['disability', 'Autism', self, {}, { disability: 'Autism' }],
  ['disability', 'she is deaf-blind', child, {}, { disability: 'Hearing-Visual' }],
  ['disability', 'hearing and visual', self, {}, { disability: 'Hearing-Visual' }],
  ['disability', 'hearing impairment', self, {}, { disability: 'Hearing' }],
  ['disability', 'he has ADHD', child, {}, { disability: 'ADHD' }],
  ['disability', 'dyslexia', child, {}, { disability: 'Specific learning disorder' }],
  ['disability', 'not sure', self, {}, {}],
  ['extras', '050 111 2222, expires 20 March 2030', self, {}, { altMobile: '+971 50 111 2222', eidExpiry: '20 March 2030' }],
  ['extras', '050 111 2222, expires 20 March 2030', child, {}, { altMobile: '+971 50 111 2222' }],
  ['extras', 'skip', self, {}, {}],
  ['employment', 'He is a student', child, {}, { employmentStatus: 'Student' }],
  ['employment', 'self-employed', self, {}, { employmentStatus: 'Self-employed' }],
  ['employment', 'I am not employed', self, {}, { employmentStatus: 'Not employed' }],
  ['workplace', 'Private sector, Al Noor Trading, accountant', self, {}, { workSector: 'Private', employer: 'Al Noor Trading', jobTitle: 'accountant' }],
  ['workplace', 'I work in the government sector at Dubai Municipality as an engineer', self, {}, { workSector: 'Government', employer: 'Dubai Municipality', jobTitle: 'engineer' }],
  ['education', 'Secondary, in Sharjah', child, {}, { educationLevel: 'Secondary', institutionLocation: 'Sharjah' }],
  ['education', 'Higher education, bachelor’s degree, in Dubai', self, { employmentStatus: 'Employed' }, { educationLevel: 'Higher education', academicDegree: 'Bachelor’s degree', institutionLocation: 'Dubai' }],
  ['education', 'primary school abroad', child, {}, { educationLevel: 'Primary', institutionLocation: 'Outside the UAE' }],
  ['support', 'Support yes, shadow teacher no', child, {}, { specialSupport: 'Yes', shadowTeacher: 'No' }],
  ['support', 'yes and yes', child, {}, { specialSupport: 'Yes', shadowTeacher: 'Yes' }],
  ['support', 'no', child, {}, { specialSupport: 'No', shadowTeacher: 'No' }],
  ['support', 'he has a shadow teacher but no special support', child, {}, { specialSupport: 'No', shadowTeacher: 'Yes' }],
];
for (const [id, text, ctx, have, want] of groups) {
  const got = readGroup(id, text, have, ctx);
  check(`${id}: ${text}`, same(got, want), same(got, want) ? '' : `got ${JSON.stringify(got)} wanted ${JSON.stringify(want)}`);
}

// ---- One field changed (from Change, or "change my …")
const singles = [
  ['emirate', 'change my emirate to Sharjah', 'Sharjah'],
  ['address', 'change the delivery address to Villa 5, Al Nahda, Sharjah', 'Villa 5, Al Nahda, Sharjah'],
  ['deliveryMobile', 'use 055 123 4567 for delivery', '+971 55 123 4567'],
  ['disability', 'it is Physical', 'Physical'],
  ['employer', 'the employer is Al Noor Trading', 'Al Noor Trading'],
  ['jobTitle', 'Senior accountant', 'Senior accountant'],
  ['eidExpiry', '2030-03-20', '20 March 2030'],
  ['specialSupport', 'No', 'No'],
];
for (const [field, text, want] of singles) {
  const got = readSingle(field, text, self);
  check(`single ${field}: ${text}`, got === want, got === want ? '' : `got ${JSON.stringify(got)} wanted ${JSON.stringify(want)}`);
}

const fieldOf = [
  ['change my emirate to Sharjah', 'emirate'],
  ['change my alternative number to 050 111 2222', 'altMobile'],
  ['change my delivery number to 055 123 4567', 'deliveryMobile'],
  ['update the delivery address', 'address'],
  ['the disability type is wrong', 'disability'],
  ['I want to change my photo', 'photo'],
  ['the report is wrong', 'report'],
  ['change the employer', 'employer'],
  ['hello there', null],
];
for (const [text, want] of fieldOf) check(`edit field: ${text}`, readEditField(text) === want, `got ${readEditField(text)}`);

// ---- Which group is next
const fillAll = { emirate: 'Dubai', address: 'x', disability: 'Autism', photo: {}, report: {} };
check('next: self starts with delivery', nextGroup('self', {}, new Set()) === 'delivery');
check('next: child starts with the cardholder', nextGroup('child', {}, new Set()) === 'cardholder');
check('next: then delivery', nextGroup('child', { cardholderEid: 'x' }, new Set()) === 'delivery');
check('next: then disability', nextGroup('self', { emirate: 'Dubai', address: 'x' }, new Set()) === 'disability');
check('next: then documents', nextGroup('self', { emirate: 'Dubai', address: 'x', disability: 'Autism' }, new Set()) === 'documents');
check('next: then the optional extras', nextGroup('self', fillAll, new Set()) === 'extras');
check('next: then employment', nextGroup('self', fillAll, new Set(['extras'])) === 'employment');
check('next: skipping employment ends it', nextGroup('self', fillAll, new Set(['extras', 'employment'])) === null);
check('next: employed asks about the workplace', nextGroup('self', { ...fillAll, employmentStatus: 'Employed' }, new Set(['extras', 'employment'])) === 'workplace');
check('next: then education', nextGroup('self', { ...fillAll, employmentStatus: 'Employed' }, new Set(['extras', 'employment', 'workplace'])) === 'education');
check('next: a student adult asks about support', nextGroup('self', { ...fillAll, employmentStatus: 'Student' }, new Set(['extras', 'employment', 'education'])) === 'support');
check('next: an employed adult does not', nextGroup('self', { ...fillAll, employmentStatus: 'Employed' }, new Set(['extras', 'employment', 'workplace', 'education'])) === null);
check('next: a child always does (once employment was answered)', nextGroup('child', { ...fillAll, cardholderEid: 'x', employmentStatus: 'Not employed' }, new Set(['extras', 'employment', 'education'])) === 'support');

// ---- The small readers
check('eid: dashes and spaces', findEid('ID 784 2012 1234567 1')?.value === '784-2012-1234567-1');
check('eid: a phone number is not one', findEid('call +971 50 765 4321') === null);
check('date: 15th of May 2012', findDate('on the 15th of May 2012')?.display === '15 May 2012');
check('date: not a street', findDate('Villa 12, Street 5, 2012 Road') === null);
check('phone: local UAE number', findPhone('call 0507654321')?.value === '+971 50 765 4321');
check('phone: a date is not a number', findPhone('born 15 05 1998') === null);
check('option: longest match wins', matchOption('hearing and visual', conv.options.disability) === 'Hearing-Visual');
check('yes/no: negative first', readYesNo('there is no shadow teacher') === 'No');
check('yes: "Yes, submit it"', parseYes('Yes, submit it'));
check('yes: not "yesterday"', !parseYes('yesterday I moved'));
check('no: "not yet"', parseNo('not yet'));
check('skip: "skip"', parseSkip('skip'));
check('skip: "nothing else"', parseSkip('nothing else'));
check('skip: not "skills"', !parseSkip('skills training'));

// ---- The four eligibility questions answered in one message
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
