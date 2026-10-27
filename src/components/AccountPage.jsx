import { home } from '../content/home.en.js';
import { account } from '../content/account.en.js';
import { readSubmitted } from '../lib/account.js';
import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import './AccountPage.css';

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

// The page the chat's "View my applications" button opens: a table of applications, each with an arrow to its own page (not built).
export function AccountPage() {
  const a = account;
  const fresh = readSubmitted().map((s) => ({ ...s, fresh: true }));
  const rows = [...fresh, ...a.rows];
  return (
    <>
      <Navbar content={home.nav} />
      <main className="account">
        <div className="container">
          <p className="account__crumb">
            <a href="/">{a.crumbs.home}</a> / {a.crumbs.here}
          </p>
          <h1 className="account__title">{a.title}</h1>
          <p className="account__sub">{a.subtitle}</p>
          <p className="account__count">{a.summary.replace('{count}', rows.length)}</p>

          {rows.length === 0 ? (
            <p className="account__empty">{a.empty}</p>
          ) : (
            <div className="account__scroll">
              <table className="account__table" aria-label={a.tableLabel}>
                <thead>
                  <tr>
                    {['number', 'applicant', 'appliedFor', 'service', 'appliedOn', 'status'].map((k) => (
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
                      <tr key={r.number} className={r.fresh ? 'is-new' : undefined}>
                        <td data-label={a.columns.number}>
                          <b className="account__number">
                            {r.fresh && <span className="visually-hidden">{a.newLabel} </span>}
                            {r.number}
                          </b>
                        </td>
                        <td data-label={a.columns.applicant}>{r.applicant ?? a.applicant}</td>
                        <td data-label={a.columns.appliedFor}>{r.appliedFor === 'other' ? a.forOther : a.forSelf}</td>
                        <td data-label={a.columns.service}>{a.services[r.service ?? 'pod']}</td>
                        <td data-label={a.columns.appliedOn}>{r.appliedOn}</td>
                        <td data-label={a.columns.status}>
                          <span className={`account__pill is-${tone}`}>{statusLabel}</span>
                        </td>
                        <td className="account__go-cell">
                          {/* the application's own page is not built: the arrow does not go anywhere yet */}
                          <a className="account__go" href="#" onClick={(e) => e.preventDefault()} aria-label={a.open.replace('{number}', r.number)}>
                            <Arrow />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer content={home.footer} />
    </>
  );
}
