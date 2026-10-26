// Eligibility flow logic. Pure functions over the copy in content/eligibility.en.js, so a real
// service can replace evaluate() later. Questions are adaptive: the path depends on the answers.

const SUBJECTS = {
  self: { Are: 'Are you', Do: 'Do you', Your: 'Your', you: 'you' },
  other: { Are: 'Is the person', Do: 'Does the person', Your: 'Their', you: 'they' },
};

export const fill = (str, who, extra = {}) => {
  const tokens = { ...SUBJECTS[who ?? 'self'], ...extra };
  return str.replace(/\{(\w+)\}/g, (_, k) => tokens[k] ?? '');
};

// Which questions apply, given the answers so far (unanswered ones are assumed to be needed).
export function pathOf(answers) {
  const path = ['who', 'status'];
  if (answers.status === 'neither') return path;
  path.push('report');
  if (answers.report === 'no') return path;
  path.push('accredited');
  return path;
}

export const nextStep = (answers) => pathOf(answers).find((q) => answers[q] === undefined) ?? 'review';

// Changing an answer can shorten the path; drop answers that no longer apply.
export function purge(answers) {
  const keep = new Set(pathOf(answers));
  return Object.fromEntries(Object.entries(answers).filter(([k]) => keep.has(k)));
}

export function parseAnswer(question, text) {
  const t = text.toLowerCase();
  // "Not sure" wins over "sure"/"no" inside the same phrase.
  const ordered = [...question.options].sort((a, b) => (b.value === 'unsure') - (a.value === 'unsure'));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Longer keys match as word prefixes ("residents"); short ones ("no", "son") need the whole word.
  const hit = (k) => new RegExp('\\b' + esc(k) + (k.length <= 3 ? 's?\\b' : '')).test(t);
  return ordered.find((o) => o.match.some(hit));
}

export function reviewRows(copy, answers) {
  return pathOf(answers).map((qid) => {
    const q = copy.questions[qid];
    const opt = q.options.find((o) => o.value === answers[qid]);
    return { qid, label: q.label, answer: opt?.answer ?? opt?.label ?? '' };
  });
}

// Hard failures beat "not sure"; anything unconfirmed gets its own checklist.
// Returns what the result screen shows, so a real service can return the same shape.
export function evaluate(copy, answers) {
  const res = copy.results;
  const who = answers.who ?? 'self';
  const path = pathOf(answers);

  const failed = ['status', 'report', 'accredited'].find(
    (q) => path.includes(q) && (answers[q] === 'neither' || answers[q] === 'no'),
  );
  if (failed) {
    const n = res.notEligible;
    return {
      kind: 'notEligible',
      tone: 'info',
      title: n.title,
      subtitle: fill(n.reasons[failed], who),
      listLabel: res.listLabel.notEligible,
      items: n.steps[failed],
      summary: { lead: n.lead },
    };
  }

  const unsure = path.filter((q) => answers[q] === 'unsure');
  if (unsure.length) {
    const u = res.unsure;
    return {
      kind: 'unsure',
      tone: 'info',
      title: u.title,
      subtitle: u.subtitle,
      listLabel: res.listLabel.unsure,
      items: unsure.map((q) => u.confirm[q]),
      summary: { lead: 'A few details still need to be confirmed.' },
    };
  }

  const e = res.eligible;
  return {
    kind: 'eligible',
    tone: 'success',
    title: e.title,
    subtitle: fill(e.subtitle, who),
    listLabel: res.listLabel.eligible,
    items: who === 'other' ? [...e.items, e.otherItem] : e.items,
    summary: { lead: 'Good news. The check is complete.' },
  };
}

// ---- Chat turns: each returns a scenario the message component can play ------------------------

export function buildQuestion(copy, qid, answers, { changing = false } = {}) {
  const q = copy.questions[qid];
  const path = pathOf(answers);
  const text = fill(q.text, answers.who);
  return {
    id: `q:${qid}`,
    tool: null,
    text: [{ lead: changing ? undefined : q.lead, question: text }],
    cards: [
      {
        type: 'question',
        qid,
        label: text,
        hint: copy.hint,
        step: Math.max(1, path.indexOf(qid) + 1),
        total: path.length,
        progress: copy.question,
        options: q.options,
        spoken: `Choices: ${q.options.map((o) => o.label).join(', ')}.`,
      },
    ],
  };
}

export function buildReview(copy, answers) {
  const r = copy.review;
  return {
    id: 'review',
    tool: null,
    text: [{ lead: r.lead, question: r.text }],
    cards: [
      {
        type: 'review',
        title: r.title,
        changeLabel: r.changeLabel,
        note: r.note,
        confirm: { label: r.confirm, event: 'confirm' },
        rows: reviewRows(copy, answers),
      },
    ],
  };
}

export function buildResult(copy, answers) {
  const result = evaluate(copy, answers);
  const res = copy.results;
  const actions =
    result.kind === 'eligible'
      ? [
          { label: res.eligible.actions.later, event: 'later', variant: 'outline' },
          { label: res.eligible.actions.apply, event: 'apply', variant: 'primary' },
        ]
      : [
          { label: res.otherActions.again, event: 'restartCheck', variant: 'text', icon: 'refresh' },
        ];
  return {
    kind: result.kind,
    scenario: {
      id: `result:${result.kind}`,
      tool: null,
      text: [{ lead: result.summary.lead, primary: copy.results.intro }],
      cards: [
        {
          type: 'result',
          tone: result.tone,
          title: result.title,
          subtitle: result.subtitle,
          listLabel: result.listLabel,
          items: result.items,
          metaLabel: res.metaLabel,
          // An eligible result asks what to do next inside the card, just above its buttons.
          ...(result.kind === 'eligible' ? { next: res.eligible.next } : {}),
          actions,
          links: result.kind === 'eligible' ? [] : res.links,
        },
      ],
    },
  };
}
