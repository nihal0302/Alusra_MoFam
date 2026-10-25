// Canned "brain" for Mira. Same shape a real service would return (a scenario object),
// so swapping in a backend means replacing this function with an async call.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function resolveScenario(text, scenarios, fallback) {
  const t = text.toLowerCase();
  // Match at word starts so "lost" doesn't fire inside "almost".
  return scenarios.find((s) => s.match.some((k) => new RegExp('\\b' + escape(k)).test(t))) ?? fallback;
}
