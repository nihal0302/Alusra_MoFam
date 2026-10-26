// Searches Mira's knowledge base (src/content/knowledge.en.js) and turns the best match into a reply in the same
// shape the scripted scenarios use. No model and no network: the same question always gets the same answer.
//
//   1. Greetings and thanks get a short reply.
//   2. A question that names one of the Ministry's services ("marriage grant documents") is answered from that
//      service's page: terms, documents, fees, times, how to apply, plus a link card to the page.
//   3. Anything else is matched against the general entries (about, contacts, hours, news, ...).
//   4. A follow-up with no service named ("and the fees?") uses the service we were just talking about.

const STOP = new Set(
  ('a an the of for to in on at is are was were be been being do does did can could would should will shall may might i me my mine we us our you your yours it its ' +
    'and or but if with about from as by this that these those please tell want need know how what who whom when where which any there have has had get got ' +
    'am so just also very much many some more than then them they he she his her him not no yes ok okay hi hello hey kindly like would ' +
    'let lets give show find say said ask asking asked').split(' '),
);

// Words that mean the same thing in a question, folded to one form before matching.
const SYN = {
  cost: 'fee', costs: 'fee', price: 'fee', prices: 'fee', charge: 'fee', charges: 'fee', fees: 'fee', payment: 'fee', pay: 'fee',
  paperwork: 'document', papers: 'document', paper: 'document', docs: 'document', doc: 'document', documents: 'document',
  eligible: 'eligib', eligibility: 'eligib', qualify: 'eligib', qualifies: 'eligib', entitled: 'eligib',
  requirement: 'condition', requirements: 'condition', criteria: 'condition', conditions: 'condition', terms: 'condition', prerequisites: 'condition',
  application: 'apply', applications: 'apply', applying: 'apply', applied: 'apply', applicant: 'apply', applicants: 'apply',
  registration: 'register', registering: 'register', registered: 'register', enrol: 'register', enroll: 'register', enrolment: 'register', enrollment: 'register',
  renewal: 'renew', renewing: 'renew', renewed: 'renew', renews: 'renew',
  counselling: 'counseling', counsellor: 'counseling', counselor: 'counseling', counseling: 'counseling',
  centre: 'center', centres: 'center', centers: 'center',
  advertisement: 'advert', advertisements: 'advert', advertising: 'advert', advertise: 'advert', adverts: 'advert', ad: 'advert', ads: 'advert',
  disabled: 'disability', disabilities: 'disability', handicapped: 'disability', pod: 'pod', pods: 'pod',
  wedding: 'wedding', weddings: 'wedding', marry: 'marriage', married: 'marriage', marrying: 'marriage', marriages: 'marriage',
  licence: 'license', licences: 'license', licensed: 'license', licensing: 'license', licenses: 'license',
  rehab: 'rehabilitation', kids: 'child', kid: 'child', children: 'child', childs: 'child', son: 'child', daughter: 'child',
  elders: 'elderly', seniors: 'elderly', senior: 'elderly', jobs: 'job', vacancies: 'vacancy', careers: 'career',
  lasts: 'last', takes: 'take', hours: 'hour', timings: 'timing', times: 'time', days: 'day', duration: 'time',
  authority: 'authority', ministries: 'ministry', replacing: 'replace', replaced: 'replace', replacement: 'replace', replacements: 'replace',
  damage: 'damaged', stolen: 'lost', missing: 'lost', misplaced: 'lost',
  twitter: 'x', abusing: 'abuse', abused: 'abuse', abusive: 'abuse', beaten: 'abuse', hurting: 'abuse', hurt: 'abuse', harmed: 'abuse', violent: 'violence',
};

const fin = (w) => (w.length > 4 && w.endsWith('e') ? w.slice(0, -1) : w);

export function stem(raw) {
  let w = raw.toLowerCase().replace(/['’]s?$/, '');
  if (SYN[w]) return fin(SYN[w]);
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && /(s|x|z|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) w = w.slice(0, -1);
  return fin(SYN[w] ?? w);
}

const words = (text) => text.toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, ' ').split(' ').filter(Boolean);
const allStems = (text) => words(text).map(stem);
const contentStems = (text) => words(text).filter((w) => !STOP.has(w)).map(stem);

// Which kind of thing is being asked. More than one can apply ("documents and fees").
const INTENTS = [
  ['fees', /\b(fees?|cost|costs|price|prices|how much|pay|payment|charge|charges|free|aed|dirhams?|expensive)\b/i],
  ['time', /\b(how long|how many (days|hours|minutes|weeks)|processing|delivery|deliver|duration|how soon|how fast|turnaround|waiting|when will (i|it|my)|ready in|takes? (long|how)|time (does|do|will|is|it))\b/i],
  ['documents', /\b(documents?|docs?|papers?|paperwork|required|attach|upload|bring|what do i need|what (do|should) i (need|bring|submit|provide|prepare)|need to (provide|submit|prepare|bring|have)|checklist|certificates? (needed|required))\b/i],
  ['eligibility', /\b(eligib\w*|qualif\w*|who can|who is|who may|who should|conditions?|terms|criteria|requirements?|entitled|allowed|permitted|age limit|minimum age|maximum age|how old|can i|can my|can he|can she|am i|is he|is she|do i qualify|prerequisites?|salary|income|nationality|citizens?|residents?|expats?|foreigners?|non[- ]emiratis?|groom|bride|limit|maximum|minimum)\b/i],
  ['apply', /\b(apply|application|applying|register|registration|sign up|submit|portal|how (do|can|to) (i|we)|how to|where (do|can) i|start|link|enrol\w*)\b/i],
  ['location', /\b(where|locations?|address|nearest|near me|branch(es)?|map)\b/i],
  ['overview', /\b(what is|what's|what are|what does|about|explain|describe|meaning|mean|tell me|details|information|info|benefits?|offer|overview|purpose|include)\b/i],
];
// Words that only say what kind of thing is asked. A question made of nothing else ("and the fees?") is a follow-up.
const INTENT_STEMS = new Set(
  ('fees cost price pay documents required requirements eligible apply application register time long take days processing delivery much age conditions terms criteria free charge paperwork attach upload bring submit start qualify old many long soon fast ready').split(' ').map(stem),
);
// Things that belong to other agencies or to general knowledge: never answered from the Ministry's pages.
const OTHER_AGENCIES = /\b(driving|driver'?s?|vehicle|traffic|passport|visa|trade licen[sc]e|vat|tax|weather|football|cricket|recipe|bitcoin|stock market)\b/i;
const INTENT_ORDER = ['overview', 'eligibility', 'documents', 'fees', 'time', 'apply'];

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = (list, text) => list[hash(text.toLowerCase().trim()) % list.length];
const sentence = (s) => (/[.!?”"]$/.test(s) ? s : `${s}.`);
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n))}…`);

export function createKnowledge({ services, serviceMeta, topics, extraTopics = [], copy, extras = {} }) {
  // ---- services ---------------------------------------------------------------------------
  const signals = Object.entries(serviceMeta).map(([id, m]) => ({
    id,
    signals: m.signals.map((s) => ({ w: s.w, all: s.all.map(stem) })),
  }));
  const bySlug = Object.fromEntries(services.map((s) => [s.slug, s]));

  function detectService(stems) {
    const have = new Set(stems);
    let best = null;
    for (const s of signals) {
      const hits = s.signals.filter((g) => g.all.every((t) => have.has(t))).map((g) => g.w).sort((a, b) => b - a);
      if (!hits.length) continue;
      const score = hits[0] + 0.25 * hits.slice(1).reduce((n, w) => n + w, 0);
      if (!best || score > best.score) best = { id: s.id, score };
    }
    return best;
  }

  // ---- general topics -----------------------------------------------------------------------
  const entries = [...topics, ...extraTopics].map((t) => {
    const field = (arr) => arr.flatMap(contentStems);
    return {
      t,
      kw: new Set(field(t.keywords ?? [])),
      title: new Set(contentStems(t.title)),
      q: (t.questions ?? []).map((q) => new Set(contentStems(q))),
      qAll: new Set((t.questions ?? []).flatMap(contentStems)),
      body: new Set(contentStems(`${t.primary} ${t.secondary ?? ''} ${(t.items?.list ?? []).join(' ')}`)),
    };
  });
  const df = new Map();
  for (const e of entries) {
    const seen = new Set([...e.kw, ...e.title, ...e.qAll, ...e.body]);
    for (const w of seen) df.set(w, (df.get(w) ?? 0) + 1);
  }
  const idf = (w) => (df.has(w) ? Math.log(1 + entries.length / df.get(w)) : Math.log(1 + entries.length)); // unknown words count against a match

  function searchTopics(stems) {
    const q = [...new Set(stems)];
    if (!q.length) return null;
    const denom = q.reduce((n, w) => n + idf(w), 0) * 3;
    let best = null;
    for (const e of entries) {
      let score = 0;
      for (const w of q) {
        const weight = e.kw.has(w) ? 3 : e.title.has(w) ? 2.6 : e.qAll.has(w) ? 2.2 : e.body.has(w) ? 1 : 0;
        score += idf(w) * weight;
      }
      const coverage = score / denom;
      const sim = Math.max(0, ...e.q.map((set) => {
        const inter = q.filter((w) => set.has(w)).length;
        return inter / (new Set([...q, ...set]).size || 1);
      }));
      const total = 0.65 * coverage + 0.35 * sim;
      if (!best || total > best.score) best = { entry: e.t, score: total, coverage, sim };
    }
    return best;
  }

  // ---- building replies -------------------------------------------------------------------
  const linkCard = (title, description, links) => ({ type: 'link', title, description, links });
  const tool = (done) => ({ working: copy.tool.working, done: `Source · ${clip(done, 44)}` });

  function topicScenario(hit, text) {
    const t = hit.entry;
    const cards = [];
    if (t.items) cards.push({ type: 'list', title: t.items.title, items: t.items.list });
    if (t.links?.length) cards.push(linkCard(t.title, t.linkNote ?? 'Read more on the Ministry website.', t.links));
    const block = { lead: t.lead ?? pick(copy.leads, text), primary: t.primary };
    if (t.secondary) block.secondary = t.secondary;
    return { id: `kb:${t.id}`, tool: tool(t.title), text: [block], cards };
  }

  const feeOf = (svc) => (/fees?:/i.test(svc.fees) ? svc.fees.split(/fees?:/i).pop().trim() : svc.fees);
  const isFree = (f) => /^free/i.test(f);

  function serviceScenario(id, intentsAsked, text) {
    const svc = bySlug[id];
    const meta = serviceMeta[id];
    const asked = INTENT_ORDER.filter((i) => intentsAsked.includes(i));
    const order = asked.length ? asked.slice(0, 3) : ['overview'];
    const blocks = [];
    const cards = [];
    const add = (primary, secondary) => blocks.push(secondary ? { primary, secondary } : { primary });
    const fee = feeOf(svc);
    const feeExtra = svc.extra.find((e) => /fees/i.test(e.title));

    for (const intent of order) {
      if (intent === 'overview') {
        add(sentence(svc.description), svc.audience ? `Who it is for: ${sentence(svc.audience)}` : undefined);
        const defs = svc.extra.find((e) => /definition/i.test(e.title));
        if (defs) cards.push({ type: 'list', title: 'Services covered', items: defs.items });
      } else if (intent === 'eligibility') {
        if (svc.terms.length) {
          add(`These are the terms and conditions for ${meta.short}.`);
          cards.push({ type: 'list', ordered: true, title: 'Terms and conditions', items: svc.terms });
          const more = svc.extra.find((e) => /requirements?/i.test(e.title));
          if (more) cards.push({ type: 'list', ordered: true, title: more.title.replace(/:+$/, ''), items: more.items });
        } else add(`The service page does not list specific conditions for ${meta.short}.`);
        if (meta.card && extras.eligibilityCard && !cards.includes(extras.eligibilityCard)) cards.push(extras.eligibilityCard);
      } else if (intent === 'documents') {
        if (svc.documents.length) {
          add(`These are the documents required for ${meta.short}.`);
          cards.push({ type: 'list', title: 'Required documents', items: svc.documents });
        } else add(`The service page does not list any required documents for ${meta.short}.`);
      } else if (intent === 'fees') {
        if (feeExtra) {
          add(`The fees for ${meta.short} depend on the type of advertisement.`);
          cards.push({ type: 'list', title: feeExtra.title.replace(/:+$/, ''), items: feeExtra.items });
        } else if (!fee) add(`The service page does not state a fee for ${meta.short}.`);
        else if (isFree(fee)) add(`${meta.short.charAt(0).toUpperCase()}${meta.short.slice(1)} is free of charge.`);
        else add(`The fee for ${meta.short} is ${fee}.`);
      } else if (intent === 'time') {
        const p = svc.processing && svc.processing.toLowerCase();
        const d = svc.delivery && svc.delivery.toLowerCase();
        const parts = [];
        if (p) parts.push(`Applying online takes about ${p}.`);
        if (d) parts.push(d === 'immediately' ? 'The service is delivered immediately.' : `The service is then delivered within ${d}.`);
        add(parts.join(' ') || `The service page does not state a time for ${meta.short}.`);
      } else if (intent === 'apply') {
        if (meta.inChat && extras.eligibilityCard) {
          // Applying for the card happens here: a short eligibility check first, then the application itself.
          add(copy.applyInChat.primary, copy.applyInChat.secondary);
          if (!cards.includes(extras.eligibilityCard)) cards.push(extras.eligibilityCard);
        } else {
          add(`You can apply online through the Ministry’s e-services portal${svc.processing ? `, which takes about ${svc.processing.toLowerCase()}` : ''}.`, 'The terms and required documents are on the service page.');
        }
      }
    }
    blocks[0] = { lead: pick(copy.leads, text), ...blocks[0] };

    const applyFirst = order[0] === 'apply';
    const links = [
      { label: copy.viewService, href: svc.url },
      ...(svc.applyUrl && !meta.inChat ? [{ label: copy.applyOnline, href: svc.applyUrl }] : []),
    ];
    if (applyFirst) links.reverse();
    // Someone who only asked how to apply for the card stays in the chat: the eligibility check is the one next step.
    const stayInChat = meta.inChat && order.every((i) => i === 'apply');
    if (!stayInChat) cards.push(linkCard(svc.title, clip(svc.description, 150), links));

    // Quick follow-ups: the questions not asked yet, short enough to tap.
    const more = [
      ['eligibility', 'Who can apply?'],
      ['documents', 'What documents do I need?'],
      ['fees', 'How much does it cost?'],
      ['time', 'How long does it take?'],
    ].filter(([i]) => !order.includes(i)).slice(0, 3).map(([, label]) => label);
    if (meta.followUps && more.length && !stayInChat) cards.push({ type: 'suggestions', title: copy.suggestionsTitle, items: more });

    return { id: `kb:${id}`, tool: tool(svc.title), text: blocks, cards };
  }

  function clarifyScenario(text) {
    return {
      id: 'kb:clarify',
      tool: null,
      text: [{ lead: pick(copy.leads, text), question: copy.clarify.primary }],
      cards: [{ type: 'suggestions', title: copy.clarify.title, items: copy.clarify.items }],
    };
  }

  // ---- public ----------------------------------------------------------------------------
  // ctx.service: the service we were just discussing (for follow-ups). Returns null when nothing fits.
  function answer(raw, ctx = {}) {
    const text = raw.trim();
    if (!text) return null;

    const small = copy.smalltalk.find((s) => s.test.test(text));
    if (small) return { kind: 'smalltalk', strength: 1, serviceId: null, scenario: { id: `kb:${small.id}`, tool: null, text: [{ lead: small.lead, primary: small.primary }], cards: [] } };

    const stems = allStems(text);
    const content = contentStems(text);
    const intents = INTENTS.filter(([, re]) => re.test(text)).map(([name]) => name);
    const svc = detectService(stems);
    const topic = searchTopics(content);
    if (!svc && OTHER_AGENCIES.test(text)) return null;
    const topicStrong = topic && topic.score >= 0.5;

    // "Where are the rehabilitation centers?" asks for places, not for the registration service.
    if (svc && intents.includes('location') && topic?.entry.id === 'centers' && topic.score >= 0.34) {
      return { kind: 'topic', strength: 2, serviceId: null, scenario: topicScenario(topic, text) };
    }
    // "and the fees?" / "who can apply?" with no service named: stay on the one we were just discussing.
    const askedSomething = INTENT_ORDER.some((i) => intents.includes(i));
    const intentOnly = askedSomething && content.every((w) => INTENT_STEMS.has(w));
    if (!svc && ctx.service && askedSomething && content.length <= 5 && (intentOnly || !(topic && topic.score >= 0.34))) {
      return { kind: 'service', strength: 2, serviceId: ctx.service, intents, scenario: serviceScenario(ctx.service, intents, text) };
    }
    if (!svc && !ctx.service && intentOnly) return { kind: 'clarify', strength: 1, serviceId: null, scenario: clarifyScenario(text) };
    if (svc && (svc.score >= 3 || !topicStrong)) {
      return { kind: 'service', strength: svc.score >= 3 ? 2 : 1, serviceId: svc.id, intents, scenario: serviceScenario(svc.id, intents, text) };
    }
    if (topicStrong) return { kind: 'topic', strength: 2, serviceId: null, scenario: topicScenario(topic, text) };

    if (topic && topic.score >= 0.34) return { kind: 'topic', strength: 1, serviceId: null, scenario: topicScenario(topic, text) };
    return null;
  }

  return { answer, debug: { detectService, searchTopics, intents: (t) => INTENTS.filter(([, re]) => re.test(t)).map(([n]) => n) } };
}
