// Thumbs up / thumbs down on Mira's replies. There is no backend: each rating is kept in memory and in this browser's
// localStorage ("mofam.feedback"), one entry per reply (rating again to change it, or tap the same thumb to take it back).
// `recordFeedback` is the one place a real service would be called; the shape of an entry is what that service would receive.
//
//   { at, rating: 'up' | 'down', variant, conversation, messageId, replyId, reply }
//     conversation: which conversation in this visit (it goes up each time a new one is started)
//     replyId: the id of the reply's script (e.g. "app:emirate", "result:eligible") so replies can be grouped
//     reply: the first part of what Mira said, so a rating can be read without the chat
const KEY = 'mofam.feedback';
const MAX = 500;
let memory = [];

const load = () => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) memory = JSON.parse(raw);
  } catch {
    /* storage can be blocked; memory still works for this visit */
  }
};
const save = () => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory.slice(-MAX)));
  } catch {
    /* ignored */
  }
};

// rating null removes the rating of that reply
export function recordFeedback({ rating, variant, conversation, messageId, replyId, reply }) {
  if (!memory.length) load();
  memory = memory.filter((e) => !(e.variant === variant && e.conversation === conversation && e.messageId === messageId));
  if (rating) memory.push({ at: new Date().toISOString(), rating, variant, conversation, messageId, replyId, reply });
  save();
  return memory.slice();
}

export const readFeedback = () => {
  if (!memory.length) load();
  return memory.slice();
};
