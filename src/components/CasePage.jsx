import { account } from '../content/account.en.js';
import { application } from '../content/application.en.js';
import { caseView } from '../content/case.en.js';
import { listApplications } from '../lib/account.js';
import { buildCase } from '../lib/caseDetails.js';
import { AppHeader, Icon } from './AppHeader.jsx';
import './CasePage.css';

function Rows({ rows }) {
  return rows.map(([label, value, strong]) => (
    <div className="case-row" key={label}>
      <span className="case-row__label">{label}</span>
      <span className={`case-row__value${strong ? ' is-strong' : ''}`}>{value}</span>
    </div>
  ));
}

// The page of one application: the row of "My applications" that was opened, by its number.
export function CasePage({ number }) {
  const v = caseView;
  const profile = application.signIn.profile;
  const row = listApplications(account).find((r) => r.number === number);
  const c = row && buildCase(row, profile, v);

  return (
    <div className="case-page">
      <AppHeader first={profile.first} />
      <main className="case-main">
        <div className="case-top">
          <a className="case-back" href="/account" aria-label={v.backLabel}>
            <Icon file="case-arrow-back.svg" className="case-icon--24" />
            <span>{v.back}</span>
          </a>
          <h1 className="case-title">{(c ? v.title : v.notFound.title).replace('{number}', number)}</h1>
        </div>

        {!c ? (
          <section className="case-card case-card--empty">
            <p>{v.notFound.text}</p>
            <a className="case-back" href="/account">
              <Icon file="case-arrow-back.svg" className="case-icon--24" />
              <span>{v.notFound.back}</span>
            </a>
          </section>
        ) : (
          <>
            <section className="case-card case-progress" aria-labelledby="case-progress-title">
              <h2 id="case-progress-title" className="case-card__title">
                {v.progress.title}
              </h2>
              <ol className="case-steps">
                {c.steps.map((s, i) => (
                  <li className="case-step-item" key={s.id}>
                    {i > 0 && <span className={`case-connector${c.steps[i].state === 'current' ? ' is-last' : ''}`} aria-hidden="true" />}
                    <div className={`case-step is-${s.state}`} aria-current={s.state === 'current' ? 'step' : undefined}>
                      <Icon file={s.state === 'done' ? 'case-step-done.svg' : 'case-step-current.svg'} className="case-icon--16" />
                      <span className="case-step__text">
                        <span className="case-step__title">{s.title}</span>
                        <span className="case-step__note">{s.note}</span>
                      </span>
                      <span className="visually-hidden">{s.state === 'done' ? v.progress.done : v.progress.current}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="case-card case-overview">
              <div className="case-col case-col--details">
                <h2 className="case-heading">{v.submission.title}</h2>
                <div className="case-grid">
                  <div className="case-group">
                    <h3 className="case-group__title">{v.submission.applicant}</h3>
                    <Rows rows={c.applicant} />
                  </div>
                  <div className="case-group">
                    <h3 className="case-group__title">{v.submission.contact}</h3>
                    <Rows rows={c.contact} />
                  </div>
                </div>
              </div>

              <div className="case-col case-col--docs">
                <h2 className="case-heading">{v.documents.title}</h2>
                {c.documents.map((d) => (
                  // APPROX: the whole card will open the document; it does not yet (it only looks as if it will)
                  <div className="case-doc" key={d.key}>
                    <span className="case-doc__box">
                      <Icon file={d.key === 'report' ? 'case-icon-file.svg' : 'case-icon-image.svg'} className="case-icon--18" />
                    </span>
                    <span className="case-doc__text">
                      <span className="case-doc__title">{d.title}</span>
                      <span className="case-doc__meta">{d.meta}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="case-col case-col--talk">
                <div className="case-talk__head">
                  <h2 className="case-heading">{v.discussion.title}</h2>
                  {!c.discussion && <span className="case-talk__none">{v.discussion.none}</span>}
                </div>
                {c.discussion && (
                  <div className="case-talk__list">
                    <div className="case-comment">
                      <div className="case-comment__top">
                        <span className="case-chip case-chip--info">
                          <Icon file="case-dot-blue.svg" className="case-icon--5" />
                          {v.discussion.resubmitted.chip}
                        </span>
                        <span className="case-comment__time">{v.discussion.resubmitted.time}</span>
                      </div>
                      <div className="case-person">
                        <span className="case-person__initials">{c.initials}</span>
                        <span className="case-person__text">
                          <span className="case-person__name">{c.applicantName}</span>
                          <span className="case-person__role">{v.discussion.resubmitted.role}</span>
                        </span>
                      </div>
                    </div>
                    <div className="case-comment">
                      <div className="case-comment__top">
                        <span className="case-chip case-chip--warning">
                          <Icon file="case-dot-amber.svg" className="case-icon--5" />
                          {v.discussion.missingInfo.chip}
                        </span>
                        <span className="case-comment__time">{v.discussion.missingInfo.time}</span>
                      </div>
                      <p className="case-comment__text">{v.discussion.missingInfo.text}</p>
                      <div className="case-person">
                        <span className="case-person__avatar">
                          <Icon file="case-icon-user.svg" className="case-icon--16" />
                        </span>
                        <span className="case-person__name">{v.discussion.missingInfo.by}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
