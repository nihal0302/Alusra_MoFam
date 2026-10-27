import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatIcon } from './ChatIcon.jsx';
import { UaePassButton } from './UaePassButton.jsx';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';
import { UaePassLogo } from './UaePassLogo.jsx';
import { SuccessCheck } from './SuccessCheck.jsx';
import { InfoMark } from './InfoMark.jsx';

const ARC_R = 15;
const ARC_LEN = 2 * Math.PI * ARC_R;
const FETCH_STEP_MS = 420;

// Filling arc: the count is adaptive, so the ring fills toward the current estimate.
function Arc({ step, total }) {
  const to = ARC_LEN * (1 - step / total);
  return (
    <svg className="noor-arc" viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
      <circle className="noor-arc__track" cx="18" cy="18" r={ARC_R} />
      <circle className="noor-arc__fill" cx="18" cy="18" r={ARC_R} style={{ '--arc-full': ARC_LEN, '--arc-to': to }} />
      <text x="18" y="22" textAnchor="middle" className="noor-arc__n">
        {step}
      </text>
    </svg>
  );
}

// The simulated UAE PASS approval, as in the team's prototype: a window over the conversation, which is blurred behind it, with the
// steps ticked off one by one. It closes when the wait is over; the message that opened it stays in the chat.
function SigningCard({ card }) {
  const anchor = useRef(null);
  const [host, setHost] = useState(null);
  useEffect(() => {
    setHost(anchor.current?.closest('.noor-stage') ?? null);
  }, []);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.min(card.ms, Date.now() - t0)), 250);
    return () => clearInterval(id);
  }, [card.ms]);
  const per = card.ms / card.steps.length;
  const active = Math.min(card.steps.length - 1, Math.floor(elapsed / per));
  const finished = elapsed >= card.ms;
  return (
    <>
      <span ref={anchor} hidden />
      {host &&
        !finished &&
        createPortal(
          <div className="noor-modal" role="dialog" aria-modal="true" aria-label={card.title}>
    <section className="noor-card noor-signing noor-signing--modal">
      <div className="noor-card__body">
        <div className="noor-card__headrow">
          <h3 className="noor-card__title">{card.title}</h3>
          <UaePassLogo />
        </div>
        <ul className="noor-signing__steps">
          {card.steps.map((s, i) => {
            const state = finished || i < active ? 'done' : i === active ? 'active' : 'todo';
            return (
              <li key={s} className={`is-${state}`} aria-current={state === 'active' ? 'step' : undefined}>
                <span className="noor-signing__state" aria-hidden="true">
                  {state === 'done' ? <ChatIcon name="check" size={12} /> : state === 'active' ? <span className="noor-spinner" /> : null}
                </span>
                {s}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="noor-fetch__note noor-signing__note">
        <ChatIcon name="shield" size={14} />
        {finished ? card.done : card.note}
      </p>
    </section>
          </div>,
          host,
        )}
    </>
  );
}

// The simulated reading of the documents (the files are not read; this only shows the wait). One line at a time: a spinner and what
// is being done; when it is done the spinner becomes a tick, and the line moves up and fades away while the next one comes up from
// below. The last line, "Document scan completed", stays.
function ReadingCard({ card, style }) {
  const reduced = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.min(card.ms, Date.now() - t0)), 80);
    return () => clearInterval(id);
  }, [card.ms]);
  const slot = card.ms / (card.steps.length + 1); // each step, and the last line, get an equal time
  const index = Math.min(card.steps.length, Math.floor(elapsed / slot));
  const within = elapsed - index * slot;
  const last = index >= card.steps.length;
  // the spinner for the first 65% of a step, then the tick, then (from 85%) the line leaves
  const state = last ? 'done' : within < slot * 0.65 ? 'active' : 'done';
  const leaving = !last && within >= slot * 0.85 && !reduced;
  const text = last ? card.done : card.steps[index];
  return (
    <section className="noor-card noor-reading" style={style} aria-label={card.title}>
      <div className="noor-card__body">
        <div className="noor-reading__stage" role="status" aria-live="polite">
          <div key={index} className={`noor-reading__row is-${state}${last ? ' is-last' : ''}${leaving ? ' is-leaving' : ''}`}>
            <span className="noor-reading__ic" aria-hidden="true">
              {state === 'done' ? <ChatIcon name="check" size={12} /> : <span className="noor-spinner" />}
            </span>
            <span className="noor-reading__text">{text}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Small "i" that reveals extra detail on hover, keyboard focus or tap; Escape or a second tap closes it.
function InfoTip({ text, label }) {
  const [open, setOpen] = useState(false);
  const id = useRef(`noor-tip-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <span className={`noor-tip${open ? ' is-open' : ''}`} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="noor-tip__btn"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        <ChatIcon name="info" size={16} />
      </button>
      <span className="noor-tip__pop" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}

// A small "Copy" button beside a contact detail; it says "Copied" for a moment.
function CopyText({ value, copy, copied }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const click = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard can be blocked; the detail is still on screen */
    }
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" className="noor-support__copy" onClick={click}>
      {done ? copied : copy}
    </button>
  );
}

export function LinkButton({ link, solid }) {
  const external = link.href.startsWith('http') || Boolean(link.newTab); // opens in a new tab, so the chat stays where it is
  return (
    <a
      className={`noor-btn${solid ? '' : ' noor-btn--outline'}`}
      href={link.href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.href.startsWith('tel:') && <ChatIcon name="phone" size={16} />}
      {link.label}
      {external && <ChatIcon name="arrowUpRight" size={14} />}
      {external && <span className="visually-hidden"> (opens in a new tab)</span>}
    </a>
  );
}

function Ticks({ items, delay }) {
  return (
    <ul className="noor-ticks">
      {items.map((t) => (
        <li key={t} style={{ '--tick-delay': `${delay}ms` }}>
          <span className="noor-ticks__mark" aria-hidden="true">
            <ChatIcon name="check" size={11} />
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

// ---- The documents step (Variation 2): a row for each document, like a file list ---------------------------------------------------
// Left: a thumbnail (the picture, or a document icon). Middle: the document's name and what it needs, or the file that is in.
// Right: an "Upload" button; while the file "uploads" a small spinner; when it is in, a delete icon. Nothing is said to Mira until
// both documents are in (the card tells the hook as each one arrives; the hook answers when it has both).
const UPLOAD_MS = 1200; // the simulated upload; nothing leaves the device
function DocRow({ item, locked, onStore, onRemove }) {
  const reduced = usePrefersReducedMotion();
  const u = item.upload;
  const [file, setFile] = useState(item.file); // { name, type, url } when a document is in
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0); // how far the simulated upload has got, 0 to 100
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);

  const pick = (f) => {
    if (!f || locked || busy || file) return;
    if (!u.types.includes(f.type)) {
      setError(u.errors.type.replace('{types}', u.typeNames));
      return;
    }
    if (f.size > u.maxMb * 1024 * 1024) {
      setError(u.errors.size);
      return;
    }
    setError('');
    const finish = () => {
      setFile({ name: f.name, type: f.type, url: URL.createObjectURL(f) });
      setBusy(false);
      onStore(f);
    };
    if (reduced) {
      finish();
      return;
    }
    const t0 = Date.now();
    setPct(0);
    setBusy(true);
    timer.current = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - t0) / UPLOAD_MS) * 100));
      setPct(p);
      if (p >= 100) {
        clearInterval(timer.current);
        finish();
      }
    }, 50);
  };

  const remove = () => {
    if (file?.url && file.url !== item.file?.url) URL.revokeObjectURL(file.url);
    setFile(null);
    setError('');
    onRemove();
  };

  return (
    <div
      className={`noor-docrow${drag ? ' is-drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!file && !busy) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        pick(e.dataTransfer.files?.[0]);
      }}
    >
      <span className="noor-docrow__thumb" aria-hidden="true">
        {file?.type?.startsWith('image/') && file.url ? <img src={file.url} alt="" /> : <ChatIcon name="file" size={26} weight={1.4} />}
      </span>
      <span className="noor-docrow__text">
        <span className="noor-docrow__label">{item.label}</span>
        <span className="noor-docrow__sub">
          {file ? (
            <>
              <ChatIcon name="checkCircle" size={18} />
              <span className="noor-docrow__name">{file.name}</span>
            </>
          ) : busy ? (
            'Uploading…'
          ) : (
            item.hintEmpty
          )}
        </span>
        {error && (
          <span className="noor-up__error" role="alert">
            {error}
          </span>
        )}
      </span>
      <span className="noor-docrow__action">
        {busy ? (
          <>
            <span className="noor-docrow__pct" aria-hidden="true">
              {pct}%
            </span>
            <span className="noor-docrow__spin" role="progressbar" aria-label="Uploading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} />
          </>
        ) : file ? (
          !locked && (
            <button type="button" className="noor-docrow__remove" aria-label={`${u.remove} ${item.label}`} title={u.remove} onClick={remove}>
              <ChatIcon name="trash" size={20} />
            </button>
          )
        ) : (
          <>
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept={u.accept}
              tabIndex={-1}
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" className="noor-btn noor-btn--outline" disabled={locked} onClick={() => inputRef.current?.click()}>
              <ChatIcon name="upload" size={16} />
              {u.button}
            </button>
          </>
        )}
      </span>
    </div>
  );
}

// ---- Questions that do not depend on each other, all in one box: each has its own line and its own chips ----------------------
function ChoiceSetCard({ card, style, onAction, locked }) {
  const [picked, setPicked] = useState({});
  const pick = (field, value) => {
    if (locked) return;
    setPicked((p) => ({ ...p, [field]: value }));
    onAction?.('choiceSet', { group: card.group, field, value });
  };
  return (
    <section className="noor-card" style={style}>
      <div className="noor-card__body">
        {card.sections.map((s) => (
          <div className="noor-card__section" key={s.field}>
            <p className="noor-card__prompt">{s.question}</p>
            <div className="noor-suggest noor-suggest--tight" role="group" aria-label={s.question}>
              {s.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={`noor-suggest__btn${picked[s.field] === o ? ' is-selected' : ''}`}
                  disabled={locked}
                  aria-pressed={picked[s.field] === o}
                  onClick={() => pick(s.field, o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---- Upload: choose or drop a file; type and size are checked here, on the device -----------
function UploadCard({ card, style, onAction, chosen }) {
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const uploaded = chosen && typeof chosen === 'object' ? chosen : null;
  const locked = chosen !== undefined;

  const pick = (file) => {
    if (!file || locked) return;
    if (!card.types.includes(file.type)) {
      setError(card.errors.type.replace('{types}', card.typeNames));
      return;
    }
    if (file.size > card.maxMb * 1024 * 1024) {
      setError(card.errors.size);
      return;
    }
    setError('');
    onAction?.('upload', { field: card.field, file });
  };

  return (
    <section className="noor-card noor-up" style={style} aria-label={card.title}>
      <div className="noor-card__body">
        <h3 className="noor-card__title">{card.title}</h3>
        <p className="noor-card__text">{card.hint}</p>
      </div>
      {uploaded ? (
        <div className="noor-up__done">
          <span className="noor-up__thumb" aria-hidden="true">
            {uploaded.type.startsWith('image/') ? <img src={uploaded.url} alt="" /> : <ChatIcon name="file" size={22} />}
          </span>
          <span className="noor-up__meta">
            <span className="noor-up__name">{uploaded.name}</span>
            <span className="noor-up__size">Uploaded</span>
          </span>
          <span className="noor-up__ok" aria-hidden="true">
            <ChatIcon name="check" size={12} />
          </span>
        </div>
      ) : (
        <div
          className={`noor-up__drop${drag ? ' is-drag' : ''}`}
          onClick={(e) => e.target === e.currentTarget && !locked && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept={card.accept}
            tabIndex={-1}
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <span className="noor-up__badge" aria-hidden="true">
            <ChatIcon name={card.icon ?? 'upload'} size={28} weight={1.5} />
          </span>
          <p className="noor-up__headline">{drag ? card.dropActive : card.dropTitle}</p>
          <span className="noor-up__or">{card.drop}</span>
          <button type="button" className="noor-btn" disabled={locked} onClick={() => inputRef.current?.click()}>
            <ChatIcon name="upload" size={16} />
            {card.button}
          </button>
          {error && (
            <p className="noor-up__error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

// ---- Submitted: the application number counts up, then the tracker ---------------------------
function SubmittedCard({ card, style }) {
  const reduced = usePrefersReducedMotion();
  const target = Number(card.reference.split('-')[1]);
  const [n, setN] = useState(reduced ? target : 0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reduced) return undefined;
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start - 500) / 1100);
      if (t >= 0) setN(Math.round(target * (1 - (1 - t) ** 3)));
      if (t >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [reduced, target]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the number is still on screen */
    }
  };

  return (
    <section className="noor-card noor-sub" style={style} aria-label={card.title}>
      <div className="noor-sub__top">
        <SuccessCheck className="noor-done__check" />
        <p className="noor-sub__label noor-sub__label--number">{card.numberLabel}</p>
        <div className="noor-sub__head">
          <h3 className="noor-sub__ref" aria-label={`${card.title}: ${card.reference}`}>
            POD-{String(n).padStart(4, '0')}
          </h3>
          <span className="noor-sub__after">
            <button
              type="button"
              className={`noor-sub__copy${copied ? ' is-copied' : ''}`}
              onClick={copy}
              aria-label={`${card.copy}: ${card.reference}`}
              title={copied ? card.copied : card.copy}
            >
              <ChatIcon name={copied ? 'check' : 'copy'} size={16} />
            </button>
            <span className="noor-sub__copied" aria-hidden="true">
              {copied ? card.copied : ''}
            </span>
            <span className="visually-hidden" role="status">
              {copied ? card.copied : ''}
            </span>
          </span>
        </div>
      </div>
      <div className="noor-sub__next">
        <p className="noor-done__label">{card.trackerTitle}</p>
        <ol className="noor-steps">
          {card.steps.map((s, i) => (
            <li
              key={s.label}
              className={`noor-steps__item is-${s.state}`}
              style={{ '--tick-delay': `${700 + i * 90}ms` }}
            >
              <span className="noor-steps__mark" aria-hidden="true">
                {s.state === 'done' && <ChatIcon name="check" size={12} />}
              </span>
              <span className="noor-steps__label">{s.label}</span>
              <span className="noor-steps__state">{s.stateLabel ?? (s.state === 'done' ? 'Done' : 'Pending')}</span>
            </li>
          ))}
        </ol>
      </div>
      {card.emailNote && (
        <p className="noor-sub__email">
          <span>{card.emailNote}</span>
        </p>
      )}
    </section>
  );
}

// Cards under a Mira bubble. `chosen` is set once the user has acted on a card, which locks it.
// Non-POD services are guidance + link out only; nothing here submits anything without a confirm.
export function ActionCard({ card, index = 0, onAction, chosen, tray = false }) {
  const style = { '--card-delay': `${index * 80}ms` };
  const locked = chosen !== undefined;

  if (card.type === 'eligibility') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-card__text">{card.description}</p>
        </div>
        <div className="noor-card__foot">
          <span className="noor-card__note">{card.note}</span>
          {!tray && (
            <button
              type="button"
              className="noor-btn"
              disabled={locked}
              onClick={() => onAction?.(card.action.event, card.action)}
            >
              {card.action.label}
            </button>
          )}
        </div>
      </section>
    );
  }

  // One tap answers, just like typing or speaking the same thing.
  if (card.type === 'question') {
    if (tray) return null; // the options sit above the message box, so the reply stays one message
    return (
      <section className="noor-card noor-q" style={style} aria-label={card.label}>
        <div className="noor-q__head">
          <Arc step={card.step} total={card.total} />
          <div>
            <p className="noor-q__progress">
              {card.progress.replace('{step}', card.step).replace('{total}', card.total)}
            </p>
            <p className="noor-q__hint">{card.hint}</p>
          </div>
        </div>
        {!tray && (
        <div className="noor-opts" role="group" aria-label={card.label}>
          {card.options.map((o, i) => {
            const isChosen = chosen === o.value;
            return (
              <button
                key={o.value}
                type="button"
                className={`noor-optcard${isChosen ? ' is-selected' : ''}${locked && !isChosen ? ' is-dim' : ''}`}
                style={{ '--i': i }}
                aria-pressed={locked ? isChosen : undefined}
                disabled={locked}
                onClick={() => onAction?.('answer', { qid: card.qid, value: o.value, label: o.answer ?? o.label })}
              >
                <span className="noor-optcard__icon" aria-hidden="true">
                  <ChatIcon name={o.icon} size={22} />
                </span>
                <span className="noor-optcard__text">
                  <span className="noor-optcard__title">{o.label}</span>
                  <span className="noor-optcard__hint">{o.hint}</span>
                </span>
                <span className="noor-optcard__check" aria-hidden="true">
                  <ChatIcon name="check" size={11} />
                </span>
              </button>
            );
          })}
        </div>
        )}
      </section>
    );
  }

  // What Mira understood from a message with details and files: each detail, with Change where she found one,
  // then the documents received. Anything missing says so, and is asked for next.
  if (card.type === 'intake') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-rev__group">{card.detailsLabel}</p>
          <dl className="noor-rev">
            {card.rows.map((r) => (
              <div className={`noor-rev__row${r.value ? '' : ' is-missing'}`} key={r.qid}>
                <dt>{r.label}</dt>
                <dd>{r.value ?? card.missing}</dd>
                {r.value && (
                  <button
                    type="button"
                    className="noor-link-btn"
                    disabled={locked}
                    aria-label={`${card.changeLabel}: ${r.label}, currently ${r.value}`}
                    onClick={() => onAction?.('change', { qid: r.qid, label: r.label })}
                  >
                    {card.changeLabel}
                  </button>
                )}
              </div>
            ))}
          </dl>
          {card.docs.length > 0 && (
            <>
              <p className="noor-rev__group">{card.docsLabel}</p>
              <dl className="noor-rev">
                {card.docs.map((d) => (
                  <div className={`noor-rev__row${d.value ? '' : ' is-missing'}`} key={d.id}>
                    <dt>{d.label}</dt>
                    <dd>{d.value ?? card.notAttached}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
        {/* The note is about the person's files, so it appears only when a file has been attached. */}
        {card.docs.length > 0 && card.note && (
          <div className="noor-card__foot">
            <span className="noor-card__note">{card.note}</span>
          </div>
        )}
      </section>
    );
  }

  if (card.type === 'review') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <dl className="noor-rev">
            {card.rows.map((r) => (
              <div className="noor-rev__row" key={r.qid}>
                <dt>{r.label}</dt>
                <dd>{r.answer}</dd>
                <button
                  type="button"
                  className="noor-link-btn"
                  disabled={locked}
                  aria-label={`${card.changeLabel}: ${r.label}, currently ${r.answer}`}
                  onClick={() => onAction?.('change', { qid: r.qid, label: r.label })}
                >
                  {card.changeLabel}
                </button>
              </div>
            ))}
          </dl>
        </div>
        <div className="noor-card__foot">
          <span className="noor-card__note">{card.note}</span>
          {!tray && (
            <button
              type="button"
              className="noor-btn"
              disabled={locked}
              onClick={() => onAction?.(card.confirm.event, card.confirm)}
            >
              {card.confirm.label}
            </button>
          )}
        </div>
      </section>
    );
  }

  // Outcome screen: compact header, checklist, then one tidy action row.
  if (card.type === 'result') {
    const primary = card.actions.find((a) => a.variant === 'primary');
    const quiet = card.actions.filter((a) => a.variant === 'text');
    const outlined = card.actions.filter((a) => a.variant === 'outline');
    const act = (a, cls) => (
      <button
        key={a.event}
        type="button"
        className={`noor-btn ${cls}`}
        disabled={locked}
        onClick={() => onAction?.(a.event, a)}
      >
        {a.icon && <ChatIcon name={a.icon} size={16} />}
        {a.label}
      </button>
    );
    return (
      <section className={`noor-card noor-done is-${card.tone}${tray ? ' is-tray' : ''}`} style={style} aria-label={card.title}>
        <div className="noor-done__top">
          <span className="noor-done__halo" aria-hidden="true" />
          {card.tone === 'success' ? (
            <SuccessCheck className="noor-done__check" />
          ) : (
            <InfoMark className="noor-done__check" />
          )}
          <h3 className="noor-done__title">{card.title}</h3>
          <p className="noor-done__sub">{card.subtitle}</p>
        </div>
        <div className="noor-done__list">
          <ul aria-label={card.listLabel}>
            {card.items.map((it, i) => (
              <li key={it.title} style={{ '--i': i }}>
                <span className="noor-done__icon" aria-hidden="true">
                  <ChatIcon name={it.icon} size={22} />
                </span>
                <span className="noor-done__copy">
                  <span className="noor-done__item">
                    {it.title}
                    {it.meta && <InfoTip text={it.meta} label={card.metaLabel} />}
                  </span>
                  <span className="noor-done__text">{it.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {card.next && (
          <div className="noor-done__next">
            <p className="noor-done__ask">{card.next.question}</p>
            {card.next.hint && <p className="noor-done__hint">{card.next.hint}</p>}
          </div>
        )}
        {!tray && (quiet.length > 0 || outlined.length > 0 || primary || card.links.length > 0) && (
          <div className="noor-done__foot">
            <div className="noor-done__quiet">{quiet.map((a) => act(a, 'noor-btn--text'))}</div>
            <div className="noor-done__main">
              {/* Same order as the success card: secondary first, the main action last on the right */}
              {[...card.links].reverse().map((l, i) => (
                <LinkButton key={l.href} link={l} solid={i === card.links.length - 1} />
              ))}
              {outlined.map((a) => act(a, 'noor-btn--outline'))}
              {primary && act(primary, '')}
            </div>
          </div>
        )}
      </section>
    );
  }

  // The official-style UAE PASS button, black on the white card (guidelines: light backgrounds).
  if (card.type === 'uaepass') {
    return (
      <section className="noor-card noor-pass" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-card__text">{card.description}</p>
        </div>
        {!tray && (
          <div className="noor-pass__cta">
            <UaePassButton
              label={card.action.label}
              disabled={locked}
              onClick={() => onAction?.(card.action.event, card.action)}
            />
          </div>
        )}
      </section>
    );
  }

  // Details arriving from UAE PASS, one row at a time.
  if (card.type === 'signing') return <SigningCard card={card} />;

  if (card.type === 'reading') return <ReadingCard card={card} style={style} />;

  if (card.type === 'fetch') {
    const total = card.rows.length * FETCH_STEP_MS;
    return (
      <section className="noor-card noor-fetch" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <div className="noor-card__headrow">
            <h3 className="noor-card__title">{card.title}</h3>
            <UaePassLogo />
          </div>
          <ul className="noor-fetch__rows">
            {card.rows.map((r, i) => (
              <li key={r.id} style={{ '--d': `${i * FETCH_STEP_MS + 250}ms` }}>
                <span className="noor-fetch__state" aria-hidden="true">
                  <span className="noor-spinner" />
                  <span className="noor-fetch__tick">
                    <ChatIcon name="check" size={11} />
                  </span>
                </span>
                <span className="noor-fetch__label">{r.label}</span>
                <span className="noor-fetch__value">{r.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="noor-fetch__note" style={{ '--d': `${total + 300}ms` }}>
          <ChatIcon name="shield" size={14} />
          {card.note}
        </p>
      </section>
    );
  }

  // Buttons that go with a question: answer by voice instead of typing, and skip an optional question.
  if (card.type === 'voice') {
    if (tray) return null; // they sit above the message box instead
    return (
      <div className="noor-voice-row" style={style}>
        {card.label && (
          <button type="button" className="noor-btn noor-btn--outline" disabled={locked} onClick={() => onAction?.('startVoice', {})}>
            <ChatIcon name="mic" size={16} />
            {card.label}
          </button>
        )}
        {card.skip && (
          <button type="button" className="noor-btn noor-btn--outline" disabled={locked} onClick={() => onAction?.('skip', { group: card.group, label: card.skip })}>
            {card.skip}
          </button>
        )}
      </div>
    );
  }

  // The eligibility questions, numbered, to be answered together in one message (typed or spoken).
  if (card.type === 'batch') {
    return (
      <section className="noor-card noor-batch" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <ol className="noor-batch__list">
            {card.items.map((it) => (
              <li key={it.n} value={it.n}>
                {it.text}
              </li>
            ))}
          </ol>
          <p className="noor-batch__example">
            <strong>{card.exampleLabel}</strong> {card.example}
          </p>
        </div>
      </section>
    );
  }

  // Details from UAE PASS, kept out of the way: a single line that opens the full list.
  if (card.type === 'details') {
    return (
      <section className="noor-card noor-det" style={style} aria-label={card.title}>
        <details open={card.open}>
          <summary className="noor-det__sum">
            <span>{card.title}</span>
            <UaePassLogo className="noor-det__logo" />
          </summary>
          <dl className="noor-det__rows">
            {card.rows.map((r) => (
              <div key={r.id}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="noor-det__note">{card.note}</p>
        </details>
      </section>
    );
  }

  // Which of the two documents have arrived. The files themselves are attached to the chat.
  if (card.type === 'docs') {
    return (
      <div className="noor-docrows" style={style} role="group" aria-label={card.title}>
        {card.items.map((it) => (
          <DocRow key={it.id} item={it} locked={locked} onStore={(file) => onAction?.('docStore', { field: it.id, file })} onRemove={() => onAction?.('docRemove', { field: it.id })} />
        ))}
      </div>
    );
  }

  if (card.type === 'choiceSet') {
    if (tray) return null; // the choices sit above the message box instead
    return <ChoiceSetCard card={card} style={style} onAction={onAction} locked={locked} />;
  }

  if (card.type === 'choices') {
    if (tray) return null; // the choices sit above the message box instead
    const chips = (options, label) => (
      <div className="noor-suggest noor-suggest--tight" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`noor-suggest__btn${chosen === o ? ' is-selected' : ''}`}
            disabled={locked}
            aria-pressed={locked ? chosen === o : undefined}
            onClick={() => onAction?.('choice', { field: card.field, value: o })}
          >
            {o}
          </button>
        ))}
      </div>
    );
    return (
      <section className="noor-card" style={style} aria-label={card.label}>
        <div className="noor-card__body">
          {card.prompt && <p className="noor-card__prompt">{card.prompt}</p>}
          {chips(card.options, card.label)}
          {/* An answer that is not one of the list but a different kind of answer (e.g. "Multiple") has its own line under a divider. */}
          {card.extra && (
            <div className="noor-card__extra">
              <p className="noor-card__prompt">{card.extra.prompt}</p>
              {chips(card.extra.options, card.extra.prompt)}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (card.type === 'upload') return <UploadCard card={card} style={style} onAction={onAction} chosen={chosen} />;

  // Review before submitting: grouped, spacious; only the answers you gave can be changed.
  if (card.type === 'appReview') {
    return (
      <section className="noor-card noor-arev" style={style} aria-label={card.title}>
        {card.groups.map((g) => (
          <div className="noor-arev__group" key={g.title}>
            <h3 className="noor-arev__title">{g.title}</h3>
            <dl>
              {g.rows.map((r) => (
                <div className="noor-arev__row" key={r.id}>
                  <dt>{r.label}</dt>
                  <dd>
                    <span className="noor-arev__value">{r.value}</span>
                  </dd>
                  {r.source === 'uaepass' && (
                    <span className="noor-arev__tag">
                      <ChatIcon name="shield" size={12} />
                      {card.fromUaePass}
                    </span>
                  )}
                  {r.field && (
                    <button
                      type="button"
                      className="noor-link-btn"
                      disabled={locked}
                      aria-label={`${card.change}: ${r.label}, currently ${r.value}`}
                      onClick={() => onAction?.('editField', { field: r.field })}
                    >
                      {card.change}
                    </button>
                  )}
                </div>
              ))}
            </dl>
          </div>
        ))}
        <div className="noor-arev__foot">
          <p className="noor-arev__consent">{card.consent}</p>
          {!tray && (
            <button
              type="button"
              className="noor-btn noor-btn--wide"
              disabled={locked}
              onClick={() => onAction?.(card.submit.event, card.submit)}
            >
              {card.submit.label}
            </button>
          )}
          {card.note && <p className="noor-done__note">{card.note}</p>}
        </div>
      </section>
    );
  }

  // What was entered earlier, shown again when someone comes back to an application (no Change here: the next question follows).
  if (card.type === 'saved') {
    return (
      <section className="noor-card noor-arev" style={style} aria-label={card.spoken}>
        {card.groups.map((g) => (
          <div className="noor-arev__group" key={g.key}>
            <h3 className="noor-arev__title">{g.title}</h3>
            <dl>
              {g.rows.map((r) => (
                <div className="noor-arev__row" key={r.id}>
                  <dt>{r.label}</dt>
                  <dd>
                    <span className="noor-arev__value">{r.value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    );
  }

  if (card.type === 'submitted') return <SubmittedCard card={card} style={style} />;

  if (card.type === 'list') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          {card.ordered ? (
            <ol className="noor-list noor-list--ordered">
              {card.items.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          ) : (
            <Ticks items={card.items} delay={index * 80 + 200} />
          )}
        </div>
      </section>
    );
  }

  if (card.type === 'suggestions') {
    if (tray) return null; // the suggestions sit above the message box instead
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <div className="noor-suggest">
            {card.items.map((t) => (
              <button key={t} type="button" className="noor-suggest__btn" onClick={() => onAction?.('ask', t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (card.type === 'support') {
    return (
      <section className="noor-card noor-support" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          {card.title && <h3 className="noor-card__title">{card.title}</h3>}
          {card.rows.map((r) => (
            <div className="noor-support__row" key={r.label}>
              <ChatIcon name={r.icon} size={18} />
              <div className="noor-support__text">
                <small>{r.label}</small>
                <b>{r.value}</b>
              </div>
              <CopyText value={r.value} copy={card.copy} copied={card.copied} />
            </div>
          ))}
          {card.hours && <p className="noor-support__hours">{card.hours}</p>}
        </div>
      </section>
    );
  }

  if (card.type === 'actions') {
    if (tray) return null; // the buttons sit above the message box instead
    return (
      <section className="noor-card noor-actions" style={{ ...style, '--n': card.buttons.length }} aria-label={card.title}>
        {card.buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            className={`noor-btn${b.variant === 'primary' ? '' : ' noor-btn--outline'}`}
            disabled={locked}
            onClick={() => onAction?.('say', b.label)}
          >
            {b.label}
          </button>
        ))}
      </section>
    );
  }

  if (card.type === 'link') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-card__text">{card.description}</p>
        </div>
        {!tray && (
          <div className="noor-card__foot noor-card__foot--links">
            {card.links.map((l) => (
              <LinkButton key={l.href} link={l} />
            ))}
          </div>
        )}
      </section>
    );
  }

  if (card.type === 'status') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-card__text">{card.summary}</p>
          {card.meta && (
            <dl className="noor-status__meta">
              {card.meta.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <ol className="noor-steps">
            {card.steps.map((s, i) => (
              <li
                key={s.label}
                className={`noor-steps__item is-${s.state}`}
                style={{ '--tick-delay': `${index * 80 + 200 + i * 80}ms` }}
              >
                <span className="noor-steps__mark" aria-hidden="true">
                  {s.state === 'done' && <ChatIcon name="check" size={12} />}
                </span>
                <span className="noor-steps__label">{s.label}</span>
                <span className="noor-steps__state">{s.stateLabel ?? (s.state === 'done' ? 'Done' : 'Pending')}</span>
              </li>
            ))}
          </ol>
        </div>
        {card.emailNote && (
          <p className="noor-sub__email">
            <span>{card.emailNote}</span>
          </p>
        )}
        {card.account && !tray && (
          <div className="noor-card__foot noor-card__foot--links">
            <LinkButton link={card.account} solid />
          </div>
        )}
      </section>
    );
  }
  return null;
}
