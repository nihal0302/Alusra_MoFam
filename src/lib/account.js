// What the "My applications" page shows besides its sample rows: the applications just submitted in the chat. They are remembered in
// this browser only (localStorage), so the page, opened in another tab, can show them. Nothing is sent anywhere.
const KEY = 'mofam.submitted';

export function readSubmitted() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
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

// The applications the list shows: one new one first, then the earlier ones. The new one is the application just submitted in the chat
// when there is one (the latest), otherwise the sample new application of the content, so the list always has the same number of rows.
export function listApplications(account) {
  const [latest] = readSubmitted();
  return [{ ...(latest ?? account.newRow), isNew: true }, ...account.rows.map((r) => ({ ...r, isNew: false }))];
}
