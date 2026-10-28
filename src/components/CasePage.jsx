import { useEffect, useRef, useState } from 'react';
import { account } from '../content/account.en.js';
import { application } from '../content/application.en.js';
import { caseView } from '../content/case.en.js';
import { listApplications } from '../lib/account.js';
import { buildCase } from '../lib/caseDetails.js';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion.js';
import { ChatIcon } from './assistant/ChatIcon.jsx';
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

// The action under a reviewer's request: the document row(s), then Submit. Nothing is sent when a file is chosen: Submit sends (simulated),
// and is possible once every document is in; a chosen file is taken back with its delete icon. APPROX: nothing is sent or kept.
function ActionBlock({ documents, text, label }) {
  const [files, setFiles] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const ready = documents.every((d) => files[d.id]);
  return (
    <div className="case-action">
      <p className="case-action__label">{label}</p>
      {documents.map((d) => (
        <UploadRow key={d.id} doc={d} text={text} file={files[d.id] ?? null} locked={submitted} onFile={(f) => setFiles((prev) => ({ ...prev, [d.id]: f }))} />
      ))}
      {submitted ? (
        <p className="case-action__done" role="status">
          {text.submitted}
        </p>
      ) : (
        <div className="case-action__buttons">
          <button type="button" className="case-btn case-btn--primary" disabled={!ready} onClick={() => setSubmitted(true)}>
            {text.submit}
          </button>
        </div>
      )}
    </div>
  );
}

// A document the reviewer asked for: the icon, the name and format, and an Upload button. Choosing a file shows the rotating loader with
// the percentage (a simulated upload, as in the chat: nothing is sent), then the file name and a delete icon to remove it and upload again.
function UploadRow({ doc, text, file, locked, onFile }) {
  const reduced = usePrefersReducedMotion();
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const pick = (f) => {
    if (!f || busy || file) return;
    if (!doc.types.includes(f.type)) {
      setError(text.errors.type.replace('{types}', doc.typeNames));
      return;
    }
    if (f.size > text.maxMb * 1024 * 1024) {
      setError(text.errors.size);
      return;
    }
    setError('');
    if (reduced) {
      onFile(f);
      return;
    }
    const t0 = Date.now();
    setPct(0);
    setBusy(true);
    timer.current = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / text.ms) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(timer.current);
        setBusy(false);
        onFile(f);
      }
    }, 50);
  };

  return (
    <div className="case-up">
      <span className="case-up__box">
        <Icon file={doc.id === 'photo' ? 'case-icon-image.svg' : 'case-icon-file.svg'} className="case-icon--18" />
      </span>
      <span className="case-up__text">
        <span className="case-up__title">{doc.label}</span>
        <span className="case-up__hint">
          {file ? (
            <>
              <ChatIcon name="checkCircle" size={16} />
              <span className="case-up__name">{file.name}</span>
            </>
          ) : busy ? (
            text.uploading
          ) : (
            doc.hint
          )}
        </span>
        {error && (
          <span className="case-up__error" role="alert">
            {error}
          </span>
        )}
      </span>
      <span className="case-up__action">
        {busy ? (
          <>
            <span className="case-up__pct" aria-hidden="true">
              {pct}%
            </span>
            <span className="case-up__spin" role="progressbar" aria-label={text.uploading} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} />
          </>
        ) : file ? (
          !locked && (
            <button
              type="button"
              className="case-up__remove"
              aria-label={`${text.remove} ${doc.label}`}
              title={text.remove}
              onClick={() => {
                onFile(null);
                setError('');
              }}
            >
              <ChatIcon name="trash" size={20} />
            </button>
          )
        ) : (
          <>
            <input ref={inputRef} className="visually-hidden" type="file" accept={doc.accept} tabIndex={-1} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            <button type="button" className="case-up__button" onClick={() => inputRef.current?.click()}>
              {text.button}
            </button>
          </>
        )}
      </span>
    </div>
  );
}

// The page of one application: the row of "My applications" that was opened, by its number.
export function CasePage({ number }) {
  const v = caseView;
  const profile = application.signIn.profile;
  const row = listApplications(account).find((r) => r.number === number);
  const c = row && buildCase(row, application, v);

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
                    {i > 0 && <span className={`case-connector${c.steps[i].state !== 'done' ? ' is-last' : ''}`} aria-hidden="true" />}
                    <div className={`case-step is-${s.state}`} aria-current={i === c.steps.length - 1 && s.state !== 'done' ? 'step' : undefined}>
                      {s.state === 'alert' ? <span className="case-mark" aria-hidden="true" /> : <Icon file={s.state === 'done' ? 'case-step-done.svg' : 'case-step-current.svg'} className="case-icon--16" />}
                      <span className="case-step__text">
                        <span className="case-step__title">{s.title}</span>
                        <span className="case-step__note">{s.note}</span>
                      </span>
                      <span className="visually-hidden">{s.state === 'done' ? v.progress.done : s.state === 'alert' ? v.progress.alert : v.progress.current}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="case-card case-overview">
              <div className="case-col case-col--details">
                <h2 className="case-heading">{v.submission.title}</h2>
                <div className="case-grid">
                  {c.sections.map((g) => (
                    <div className="case-group" key={g.key}>
                      <h3 className="case-group__title">{g.title}</h3>
                      <Rows rows={g.rows} />
                    </div>
                  ))}
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
                  {c.discussion.length === 0 && <span className="case-talk__none">{v.discussion.none}</span>}
                </div>
                {c.discussion.length > 0 && (
                  <div className="case-talk__list">
                    {c.discussion.map((m) => (
                      <div className="case-comment" key={m.id}>
                        <div className="case-comment__top">
                          <span className={`case-chip tone--${m.tone}`}>
                            <span className="case-chip__dot" aria-hidden="true" />
                            {m.chip}
                          </span>
                          <span className="case-comment__time">{m.time}</span>
                        </div>
                        {m.text && <p className="case-comment__text">{m.text}</p>}
                        {m.by ? (
                          <div className="case-person">
                            <span className="case-person__avatar">
                              <Icon file="case-icon-user.svg" className="case-icon--16" />
                            </span>
                            <span className="case-person__name">{m.by}</span>
                          </div>
                        ) : (
                          <div className="case-person">
                            <span className="case-person__initials">{c.initials}</span>
                            <span className="case-person__text">
                              <span className="case-person__name">{c.applicantName}</span>
                              <span className="case-person__role">{m.role}</span>
                            </span>
                          </div>
                        )}
                        {m.documents && <ActionBlock documents={m.documents} text={v.discussion.upload} label={v.discussion.action} />}
                      </div>
                    ))}
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
