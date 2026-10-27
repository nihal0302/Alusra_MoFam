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
