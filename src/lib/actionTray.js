// The buttons of a reply, collected in the order they read, so they can sit outside the reply (in a strip above the
// message box) instead of inside it. One list per reply; the matching cards hide the same controls when the strip is used.
//
//   kind     what it is
//   button   a plain button (variant: primary | secondary | quiet)
//   option   an answer to a question (taps the same as typing or speaking it)
//   chip     a suggested question or a short choice
//   link     a link out (opens in a new tab, or calls)
//   uaepass  the UAE PASS sign-in button
export function trayItems(scenario) {
  const items = [];
  for (const card of scenario.cards ?? []) {
    switch (card.type) {
      case 'eligibility':
        items.push({ kind: 'button', variant: 'primary', label: card.action.label, event: card.action.event, payload: card.action });
        break;
      case 'question':
        for (const o of card.options) {
          items.push({ kind: 'option', label: o.label, hint: o.hint, event: 'answer', payload: { qid: card.qid, value: o.value, label: o.answer ?? o.label } });
        }
        break;
      case 'review':
        items.push({ kind: 'button', variant: 'primary', label: card.confirm.label, event: card.confirm.event, payload: card.confirm });
        break;
      case 'result':
        for (const a of card.actions.filter((x) => x.variant === 'text')) items.push({ kind: 'button', variant: 'quiet', label: a.label, icon: a.icon, event: a.event, payload: a });
        for (const l of card.links) items.push({ kind: 'link', link: l });
        for (const a of card.actions.filter((x) => x.variant === 'outline')) items.push({ kind: 'button', variant: 'secondary', label: a.label, event: a.event, payload: a });
        for (const a of card.actions.filter((x) => x.variant === 'primary')) items.push({ kind: 'button', variant: 'primary', label: a.label, event: a.event, payload: a });
        break;
      case 'uaepass':
        items.push({ kind: 'uaepass', label: card.action.label, event: card.action.event, payload: card.action });
        break;
      case 'voice':
        if (card.label) items.push({ kind: 'button', variant: 'secondary', icon: 'mic', label: card.label, event: 'startVoice', payload: {} });
        if (card.skip) items.push({ kind: 'button', variant: 'quiet', label: card.skip, event: 'skip', payload: { group: card.group, label: card.skip } });
        break;
      case 'batch':
        items.push({ kind: 'button', variant: 'secondary', icon: 'mic', label: card.voice, event: 'startVoice', payload: {} });
        break;
      case 'docs':
        items.push({ kind: 'button', variant: 'secondary', icon: 'attach', label: card.button, event: 'pickFiles', payload: {} });
        break;
      case 'choices':
        for (const o of card.options) items.push({ kind: 'chip', label: o, event: 'choice', payload: { field: card.field, value: o } });
        break;
      case 'appReview':
        items.push({ kind: 'button', variant: 'primary', label: card.submit.label, event: card.submit.event, payload: card.submit });
        break;
      case 'suggestions':
        for (const t of card.items) items.push({ kind: 'chip', label: t, event: 'ask', payload: t });
        break;
      case 'link':
        for (const l of card.links) items.push({ kind: 'link', link: l });
        break;
      default:
    }
  }
  return items;
}
