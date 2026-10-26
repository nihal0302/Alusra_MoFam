// "Use the microphone or type" is said once, in the first reply that carries it, and not repeated after that. In the copy the
// part of a sentence that is only that reminder is wrapped in ‹mic› … ‹/mic› (so "Please provide it‹mic› using the microphone or
// by typing‹/mic›." reads in full the first time and as "Please provide it." afterwards). A line that is nothing but the reminder
// disappears altogether. The markers survive fill() because they are not {words}.
const MARKED = /‹mic›([\s\S]*?)‹\/mic›/g;
const HAS = /‹mic›/;

const TEXT_FIELDS = ['lead', 'primary', 'secondary', 'question', 'how', 'note', 'example'];

const resolveString = (s, show) => s.replace(MARKED, show ? '$1' : '').replace(/\s+([.,])/g, '$1').trim();

// Returns { scenario, had }: the scenario with the markers resolved (a copy; the copy in the content is never changed), and
// whether it carried the reminder at all. `show` keeps the reminder; otherwise it is left out.
export function resolveHints(scenario, show) {
  const blocks = scenario.text ?? [];
  const cards = scenario.cards ?? [];
  const carries =
    blocks.some((b) => TEXT_FIELDS.some((k) => typeof b[k] === 'string' && HAS.test(b[k]))) || cards.some((c) => typeof c.hint === 'string' && HAS.test(c.hint));
  if (!carries) return { scenario, had: false };
  const text = blocks.map((b) => {
    const next = { ...b };
    for (const k of TEXT_FIELDS) {
      if (typeof b[k] !== 'string') continue;
      const v = resolveString(b[k], show);
      if (v) next[k] = v;
      else delete next[k];
    }
    return next;
  });
  const fixedCards = cards.map((c) => (typeof c.hint === 'string' && HAS.test(c.hint) ? { ...c, hint: resolveString(c.hint, show) } : c));
  return { scenario: { ...scenario, text, cards: fixedCards }, had: true };
}
