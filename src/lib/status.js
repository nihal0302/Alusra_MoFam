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
        spoken: title,
        steps,
      },
    ],
  };
}
