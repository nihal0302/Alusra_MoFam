// Runs sample questions through the knowledge search and prints what Mira would answer.
// `npm run knowledge:test`  (exits 1 if an expectation fails). Expectation: a service slug, a topic id, or "none".
import site from '../src/content/knowledge/site.json' with { type: 'json' };
import { createKnowledge } from '../src/lib/knowledge.js';
import { knowledgeCopy, resolutionEntries, serviceMeta, topics } from '../src/content/knowledge.en.js';
import { fallback, fallbackGap } from '../src/content/assistant.en.js';

const kb = createKnowledge({
  services: site.services,
  serviceMeta,
  topics,
  extraTopics: resolutionEntries,
  copy: knowledgeCopy,
  extras: { eligibilityCard: { type: 'eligibility' } },
});

// [question, expected id (service:<slug> | topic id | smalltalk id | none), expected intents (optional)]
const cases = [
  ['What documents do I need for the marriage grant?', 'marriage-grant', ['documents']],
  ['How much is the marriage grant?', 'marriage-grant'],
  ['Am I eligible for the marriage grant?', 'marriage-grant', ['eligibility']],
  ['what is the maximum salary for the marriage grant', 'marriage-grant'],
  ['how long does the marriage grant take', 'marriage-grant', ['time']],
  ['I lost my POD card', 'pod-card-replacement'],
  ['my disability card is damaged, how do I replace it', 'pod-card-replacement'],
  ['how much does it cost to replace a lost card', 'pod-card-replacement', ['fees']],
  ['what is the People of Determination card', 'determination-card'],
  ['documents needed for pod card', 'determination-card', ['documents']],
  ['how do I get a disability card', 'determination-card'],
  ['who can apply for the pod card', 'determination-card'],
  ['can I change my disability type', 'disability-type-change'],
  ['update the type of disability in my record', 'disability-type-change'],
  ['register my child in early intervention', 'early-intervention-centers-registration'],
  ['my child has a developmental delay, where can I enrol him', 'early-intervention-centers-registration'],
  ['how do I register in a rehabilitation center', 'pod-care-rehab-centers-registration'],
  ['what is the age limit for care and rehabilitation centers', 'pod-care-rehab-centers-registration'],
  ['mass wedding', 'mass-wedding-participation'],
  ['how can I participate in the mass wedding', 'mass-wedding-participation'],
  ['I need a to whom it may concern certificate', 'to-whom-it-may-concern-certificate'],
  ['certificate showing my marriage grant status', 'to-whom-it-may-concern-certificate'],
  ['how do I get a license for a family counselling centre', 'family-counseling-centers-licensing'],
  ['requirements for opening a matchmaking service', 'family-counseling-centers-licensing'],
  ['renew my family counseling center license', 'family-counseling-centers-license-renewal'],
  ['how much does it cost to renew a counselling centre licence', 'family-counseling-centers-license-renewal', ['fees']],
  ['advertise my family counseling center', 'family-counseling-centers-ad-publication'],
  ['fees for publishing an advertisement', 'family-counseling-centers-ad-publication', ['fees']],
  ['license for a non-governmental rehabilitation institution', 'non-government-pod-institutions-licensing'],
  ['how do I open a private center for people of determination', 'non-government-pod-institutions-licensing'],
  ['renew institution license', 'non-government-pod-institutions-license-renewal'],
  ['what services do you offer', 'services-list'],
  ['what can you help me with', 'services-list'],
  ['what is the ministry of family', 'about'],
  ['when was the ministry established', 'established'],
  ['who is the minister of family', 'minister'],
  ['what is the ministry vision', 'vision'],
  ['what are your working hours', 'hours'],
  ['are you open on saturday', 'hours'],
  ['what is your phone number', 'contact'],
  ['how can I contact the ministry', 'contact'],
  ['where is the ministry located', 'contact'],
  ['how do I apply for a job', 'careers'],
  ['are there any vacancies', 'careers'],
  ['how can a journalist contact you', 'media'],
  ['where are the rehabilitation centers', 'centers'],
  ['is there a center in Fujairah', 'centers'],
  ['when does registration close', 'registration-period'],
  ['what is the registration deadline', 'registration-period'],
  ['how do I report child abuse', 'child-at-risk'],
  ['a child is in danger, who do I call', 'child-at-risk'],
  ['what is the minimum age for social media in the UAE', 'social-media-resolution'],
  ['which platforms does the social media law cover', 'social-media-faq-9'],
  ['how will age verification work', 'social-media-faq-14'],
  ['will platforms be fined', 'social-media-faq-11'],
  ['what does the ministry do for the elderly', 'elderly'],
  ['services for newlyweds', 'families'],
  ['support for children', 'children'],
  ['what is the latest news', 'news-latest'],
  ['hello', 'greeting'],
  ['thanks', 'thanks'],
  ['who are you', 'who'],
  ['what is the weather in dubai today', 'none'],
  ['who won the football match last night', 'none'],
  ['what is the capital of france', 'none'],
  ['tell me a joke', 'none'],
  ['how do I renew my driving licence', 'none'],
  ['asdf qwer', 'none'],
];

let bad = 0;
for (const [q, want, wantIntents] of cases) {
  const r = kb.answer(q);
  const got = !r ? 'none' : r.kind === 'service' ? r.serviceId : r.scenario.id.replace('kb:', '');
  const intentsOk = !wantIntents || (r?.intents && wantIntents.every((i) => r.intents.includes(i)));
  const ok = got === want && intentsOk;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${q.padEnd(66)} -> ${got}${r?.intents ? ` [${r.intents.join(',')}]` : ''}${ok ? '' : `   (wanted ${want}${wantIntents ? ' ' + wantIntents : ''})`}`);
}

// Follow-ups use the service we were just talking about.
const first = kb.answer('tell me about the marriage grant');
for (const q of ['and the fees?', 'what documents do I need?', 'how long does it take', 'who can apply?']) {
  const r = kb.answer(q, { service: first.serviceId });
  const ok = r?.serviceId === 'marriage-grant';
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} follow-up: ${q.padEnd(54)} -> ${r?.serviceId ?? 'none'} [${r?.intents?.join(',') ?? ''}]`);
}

// A message nothing can answer gets one of two replies: off topic or gibberish (what Mira can help with), or about the Ministry
// but not in the published information (the support team). The same rule as replyFor in Assistant.jsx.
const gaps = [
  ['I want to order a pizza', 'off'],
  ['asdfgh qwerty', 'off'],
  ['what is the weather today', 'off'],
  ['Does the ministry offer scholarships for university students?', 'gap'],
];
for (const [q, want] of gaps) {
  const got = kb.answer(q) !== null ? 'answered' : fallbackGap.related.test(q) ? 'gap' : 'off';
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} fallback: ${q.padEnd(58)} -> ${got}`);
}
const shape = (s) => s.text.some((b) => b.ack && b.question) && s.cards.some((x) => x.type === 'actions');
const shapeOk = shape(fallback) && shape(fallbackGap) && fallbackGap.cards.some((x) => x.type === 'support');
if (!shapeOk) bad++;
console.log(`${shapeOk ? 'ok  ' : 'FAIL'} both fallback replies carry an acknowledgement, a question and buttons (the gap one also the contacts)`);

const total = cases.length + 4 + gaps.length + 1;
console.log(`\n${total - bad}/${total} as expected`);
process.exit(bad ? 1 : 0);
