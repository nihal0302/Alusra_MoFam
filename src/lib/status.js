// Checking an application's status: read an application ID from what was typed or spoken, then build Mira's reply.
// Canned data only. A real service would be called with the ID; here the last digit picks one of three sample stages.

// "POD-1042", "pod 1042", "POD1042" (as spoken or typed), or just the four digits.
export function parseApplicationId(text) {
  const m = text.match(/\bPOD[\s-]*(\d{4})\b/i) ?? text.match(/^\s*(\d{4})\s*$/);
  return m ? `POD-${m[1]}` : null;
}

export function buildStatusReply(copy, id) {
  const stage = Number(id.slice(-1)) % copy.stages.length;
  const done = 2 + stage; // the eligibility check and the submission are always complete
  const steps = copy.steps.map((label, i) => {
    const state = i < done ? 'done' : i === done ? 'current' : 'pending';
    return { label, state, stateLabel: copy.states[state] };
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
        emailNote: copy.card.emailNote,
        spoken: title,
        steps,
      },
    ],
  };
}
