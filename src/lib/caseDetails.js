// What the page of one application shows, built from a row of "My applications" (see CasePage.jsx and src/content/case.en.js).
// Pure functions: a real service would return the same shapes.
import { formatSize } from './application.js';
import { reviewGroups } from './conversation.js';

// '22 October 2026' -> '22 Oct 2026'
export const shortDate = (text) => (text ?? '').replace(/^(\d{1,2}) (\p{L}{3})\p{L}* (\d{4})$/u, '$1 $2 $3');

// 'hamdan@example.com' -> 'h***@example.com'
export const maskEmail = (email) => {
  const [name = '', domain = ''] = String(email ?? '').split('@');
  return domain ? `${name.slice(0, 1)}***@${domain}` : email ?? '';
};

// 'Hamdan Al Ketbi' -> 'HA'
export const initials = (name) =>
  String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// What the person gave when applying: the answers kept with the application (`details.data`) or, for a sample application, the sample
// answers. Shown in the groups of the application's own review, without the documents (they have their own column).
function submission(row, app, view) {
  const s = view.submission.sample;
  const who = row.appliedFor === 'other' ? 'other' : 'self';
  const groups = s.include[row.number] ?? ['required', ...(who === 'other' ? ['cardholder'] : [])];
  const data = row.details?.data ?? Object.assign({}, ...groups.map((k) => s[k]));
  return reviewGroups(app, { who, data })
    .filter((g) => g.key !== 'docs')
    .map((g) => ({
      key: g.key,
      title: g.title,
      rows: g.rows.map((r) => [r.label, r.id === 'email' ? maskEmail(r.value) : r.value, r.id === 'name' || r.id === 'eid']),
    }));
}

// `row` is a line of "My applications" ({ number, applicant, appliedFor, appliedOn, status, details? }); `app` the application content (the
// signed-in person's UAE PASS details and the review's groups); `view` the copy (caseView). Returns the blocks of the page.
export function buildCase(row, app, view) {
  const p = Object.fromEntries(app.signIn.profile.rows.map((r) => [r.id, r.value]));
  const applicant = row.applicant ?? p.name;
  const date = shortDate(row.appliedOn);

  const ids = view.progress.byStatus[row.status] ?? view.progress.byStatus.review;
  const steps = ids.map((id, i) => {
    const def = view.progress.steps[id];
    const last = i === ids.length - 1;
    const unfinished = row.status !== 'completed';
    const state = def.state ?? (last && unfinished ? 'current' : 'done');
    return { id, title: def.title, state, note: state === 'done' ? date : def.current };
  });

  const file = (key) => {
    const kept = row.details?.documents?.[key];
    return kept?.name ? { name: kept.name, size: kept.size ? formatSize(kept.size) : '' } : view.documents.sample[key];
  };
  const documents = ['report', 'photo'].map((key) => {
    const f = file(key);
    return { key, title: view.documents[key], meta: [f.name, f.size].filter(Boolean).join(' · ') };
  });

  return {
    number: row.number,
    steps,
    sections: submission(row, app, view),
    documents,
    // the comments, latest first; the latest says how long ago, an older one the day it was made
    discussion: (view.discussion.byStatus[row.status] ?? []).map((id, i) => ({ id, ...view.discussion.items[id], time: i === 0 ? view.discussion.latest : date })),
    initials: initials(applicant),
    applicantName: applicant,
  };
}
