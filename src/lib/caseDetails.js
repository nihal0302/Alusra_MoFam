// What the page of one application shows, built from a row of "My applications" (see CasePage.jsx and src/content/case.en.js).
// Pure functions: a real service would return the same shapes.
import { formatSize } from './application.js';

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

// `row` is a line of "My applications" ({ number, applicant, appliedFor, appliedOn, status, details? }); `profile` the signed-in person
// (the UAE PASS rows); `view` the copy (caseView). Returns the three blocks of the page.
export function buildCase(row, profile, view) {
  const p = Object.fromEntries(profile.rows.map((r) => [r.id, r.value]));
  const s = view.submission;
  const applicant = row.applicant ?? p.name;
  const date = shortDate(row.appliedOn);

  const ids = view.progress.byStatus[row.status] ?? view.progress.byStatus.review;
  const steps = ids.map((id, i) => {
    const last = i === ids.length - 1;
    const unfinished = !['approved', 'rejected'].includes(row.status);
    const state = last && unfinished ? 'current' : 'done';
    return { id, title: view.progress.steps[id].title, state, note: state === 'current' ? view.progress.steps[id].current : date };
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
    applicant: [
      [s.labels.name, applicant, true],
      [s.labels.eid, p.eid, true],
      [s.labels.dob, p.dob, true],
      [s.labels.gender, p.gender],
      [s.labels.emirate, row.details?.emirate ?? s.sampleEmirate],
      [s.labels.appliedFor, s.appliedFor[row.appliedFor === 'other' ? 'other' : 'self']],
    ],
    contact: [
      [s.labels.mobile, p.mobile],
      [s.labels.email, maskEmail(p.email)],
      [s.labels.language, s.language],
      [s.labels.channel, s.channel],
    ],
    documents,
    discussion: view.discussion.statuses.includes(row.status),
    initials: initials(applicant),
    applicantName: applicant,
  };
}
