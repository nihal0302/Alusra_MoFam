import { account } from '../content/account.en.js';
import { application } from '../content/application.en.js';
import { listApplications } from '../lib/account.js';
import { AppHeader, Icon } from './AppHeader.jsx';
import './AccountPage.css';

const caseHref = (number) => `/account/${encodeURIComponent(number)}`;

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// "My applications": the applications made with the signed-in account, a new one first. A row (or its number, or its arrow) opens the
// application's own page.
export function AccountPage() {
  const a = account;
  const rows = listApplications(a);
  return (
    <div className="account-page">
      <AppHeader first={application.signIn.profile.first} />
      <main className="account">
        <a className="account__back" href="/">
          <Icon file="case-arrow-back.svg" className="case-icon--24" />
          <span>{a.back}</span>
        </a>
        <div className="account__head">
          <div>
            <h1 className="account__title">{a.title}</h1>
            <p className="account__sub">{a.subtitle}</p>
          </div>
          <p className="account__count">{a.count}</p>
        </div>

        <div className="account__card">
          <div className="account__scroll">
            <table className="account__table" aria-label={a.tableLabel}>
              <thead>
                <tr>
                  {['number', 'service', 'applicant', 'appliedFor', 'appliedOn', 'status'].map((k) => (
                    <th key={k} scope="col">
                      {a.columns[k]}
                    </th>
                  ))}
                  <th scope="col">
                    <span className="visually-hidden">{a.columns.open}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const [statusLabel, tone] = a.statuses[r.status];
                  return (
                    <tr key={r.number} className={r.isNew ? 'is-new' : undefined} onClick={() => window.location.assign(caseHref(r.number))}>
                      <td data-label={a.columns.number}>
                        <a className="account__number" href={caseHref(r.number)}>
                          {r.number}
                        </a>
                        {r.isNew && <span className="account__new">{a.newLabel}</span>}
                      </td>
                      <td data-label={a.columns.service} className="account__service">
                        {a.services[r.service ?? 'pod']}
                      </td>
                      <td data-label={a.columns.applicant}>{r.applicant ?? a.applicant}</td>
                      <td data-label={a.columns.appliedFor}>{r.appliedFor === 'other' ? a.forOther : a.forSelf}</td>
                      <td data-label={a.columns.appliedOn} className="account__date">
                        {r.appliedOn}
                      </td>
                      <td data-label={a.columns.status}>
                        <span className={`account__pill is-${tone}`}>{statusLabel}</span>
                      </td>
                      <td className="account__go-cell">
                        <a className="account__go" href={caseHref(r.number)} aria-label={a.open.replace('{number}', r.number)}>
                          <Arrow />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
