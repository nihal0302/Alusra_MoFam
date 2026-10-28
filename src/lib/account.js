// What the "My applications" page shows besides its sample rows: the applications just submitted in the chat. They are remembered in
// this browser only (localStorage), so the page, opened in another tab, can show them. Nothing is sent anywhere.
const KEY = 'mofam.submitted';

export function readSubmitted() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((s) => s && typeof s.number === 'string') : []; // anything else left in storage is ignored
  } catch {
    return [];
  }
}

export function saveSubmitted(entry) {
  try {
    localStorage.setItem(KEY, JSON.stringify([entry, ...readSubmitted()].slice(0, 20)));
  } catch {
    /* storage can be blocked; the chat carries on */
  }
}

// The applications the list shows: static (see account.en.js), the new one first. What was just submitted in the chat is remembered
// above (`saveSubmitted`) but is not added to the list, so the page always shows the same five applications.
export function listApplications(account) {
  return [{ ...account.newRow, isNew: true }, ...account.rows.map((r) => ({ ...r, isNew: false }))];
}
