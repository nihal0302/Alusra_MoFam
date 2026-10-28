// Checking an application's status: read an application ID from what was typed or spoken, then build Mira's reply.
// Canned data only. A real service would be called with the ID; here the last digit picks one of three sample stages.

// "POD-1042", "pod 1042", "POD1042" (as spoken or typed), or just the four digits.
export function parseApplicationId(text) {
  const m = text.match(/\bPOD[\s-]*(\d{4})\b/i) ?? text.match(/^\s*(\d{4})\s*$/);
  return m ? `POD-${m[1]}` : null;
}

// The reply for the "Requested missing info" scenario, one bubble: the status, the stages with the branch (V2 draws `flow`; V1 lists
// `steps`), what the reviewer asked, and the row to upload the additional document. No "you will get an email and SMS" line.
function buildMissingInfoReply(copy, id) {
  const m = copy.missingInfo;
  const a = m.ask;
  const title = copy.card.title.replace('{id}', id);
  const f = m.flow;
  const steps = [
    ...f.before.map((n) => ({ label: n.label, state: 'done', stateLabel: n.text })),
    ...f.branches.map((n) => ({ label: n.label, state: 'pending', stateLabel: n.text })),
    ...f.after.map((n) => ({ label: n.label, state: 'pending', stateLabel: n.text })),
  ];
  return {
    id: `status:${id}`,
    tool: copy.tool,
    text: [{ lead: copy.reply.lead }],
    cards: [
      {
        type: 'status',
        title,
        summary: m.summary,
        pill: m.pill,
        steps,
        flow: f,
        intro: m.intro,
        comment: m.comment,
        // one row for each document the message asks for, with its name (the same shape as the application's document rows)
        items: m.documents.map((d) => ({
          id: d.id,
          label: d.name,
          hint: d.hint,
          hintEmpty: d.hint,
          done: false,
          file: null,
          upload: { accept: a.box.accept, types: a.box.types, typeNames: a.box.typeNames, maxMb: a.box.maxMb, errors: a.box.errors, button: a.box.button, remove: a.box.remove },
        })),
        account: copy.card.account,
        details: { ...copy.card.details, href: copy.card.details.href.replace('{number}', m.number) }, // the application with the reviewer's request
        mira: { ...copy.mira, note: undefined }, // no email line
        spoken: `${title}. ${m.pill}. ${m.summary} ${m.intro} ${m.comment.text}`,
      },
    ],
  };
}

// Mira's answer once the documents are sent.
export function buildMissingInfoReceived(copy, count) {
  const r = copy.missingInfo.received;
  const what = count === 1 ? r.one : r.many.replace('{n}', count);
  return { id: 'status:received', tool: null, text: [{ lead: r.lead.replace('{what}', what), primary: count === 1 ? r.primaryOne : r.primary }], cards: [] };
}

export function buildStatusReply(copy, id, { missingInfo = false } = {}) {
  if (missingInfo) return buildMissingInfoReply(copy, id);
  const stage = Number(id.slice(-1)) % copy.stages.length;
  const done = 2 + stage; // the eligibility check and the submission are always complete
  const steps = copy.steps.map((label, i) => {
    const state = i < done ? 'done' : i === done ? 'current' : 'pending';
    return { label, state, stateLabel: (state === 'current' && copy.currentText?.[label]) || copy.states[state] };
  });
  const title = copy.card.title.replace('{id}', id);
  // Sample data: it was submitted a few days ago, at a fixed time of day.
  const submitted = new Date();
  submitted.setDate(submitted.getDate() - (2 + stage));
  submitted.setHours(10, 42, 0, 0);
  const when = `${submitted.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ${submitted.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(am|pm)/i, (m) => ` ${m.trim().toUpperCase()}`)}`;
  return {
    id: `status:${id}`,
    tool: copy.tool,
    text: [
      {
        lead: copy.reply.lead,
        primary: copy.reply.primary.replace('{id}', id).replace('{stage}', copy.steps[done]),
        secondary: `${copy.stages[stage]} ${copy.reply.sample}`,
      },
    ],
    cards: [
      {
        type: 'status',
        title,
        summary: copy.card.summary.replace('{done}', done).replace('{total}', copy.steps.length),
        meta: [{ label: copy.card.submittedLabel, value: when }],
        account: copy.card.account,
        details: { ...copy.card.details, href: copy.card.details.href.replace('{number}', copy.card.details.number) }, // the first application of the list
        mira: copy.mira,
        spoken: title,
        steps,
      },
    ],
  };
}
