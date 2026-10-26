import { useEffect, useRef, useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { UaePassButton } from './UaePassButton.jsx';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';
import { formatSize } from '../../lib/application.js';
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

// The simulated UAE PASS approval: a progress bar over the whole wait, with the current step highlighted.
function SigningCard({ card, style }) {
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
    <section className="noor-card noor-signing" style={style} aria-label={card.title}>
      <div className="noor-card__body">
        <h3 className="noor-card__title">{card.title}</h3>
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

function LinkButton({ link, solid }) {
  const external = link.href.startsWith('http');
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
            <span className="noor-up__size">{formatSize(uploaded.size)} · Uploaded</span>
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
        <div className="noor-sub__head">
          <h3 className="noor-sub__ref" aria-label={`${card.title}: ${card.reference}`}>
            POD-{String(n).padStart(4, '0')}
          </h3>
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
        </div>
        <p className="noor-sub__label">{card.body}</p>
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
    </section>
  );
}

// Cards under a Mira bubble. `chosen` is set once the user has acted on a card, which locks it.
// Non-POD services are guidance + link out only; nothing here submits anything without a confirm.
export function ActionCard({ card, index = 0, onAction, chosen }) {
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
          <button
            type="button"
            className="noor-btn"
            disabled={locked}
            onClick={() => onAction?.(card.action.event, card.action)}
          >
            {card.action.label}
          </button>
        </div>
      </section>
    );
  }

  // One tap answers, just like typing or speaking the same thing.
  if (card.type === 'question') {
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
          <p className="noor-rev__group">{card.docsLabel}</p>
          <dl className="noor-rev">
            {card.docs.map((d) => (
              <div className={`noor-rev__row${d.value ? '' : ' is-missing'}`} key={d.id}>
                <dt>{d.label}</dt>
                <dd>{d.value ?? card.notAttached}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="noor-card__foot">
          <span className="noor-card__note">{card.note}</span>
        </div>
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
          <button
            type="button"
            className="noor-btn"
            disabled={locked}
            onClick={() => onAction?.(card.confirm.event, card.confirm)}
          >
            {card.confirm.label}
          </button>
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
      <section className={`noor-card noor-done is-${card.tone}`} style={style} aria-label={card.title}>
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
        <div className="noor-pass__cta">
          <UaePassButton
            label={card.action.label}
            disabled={locked}
            onClick={() => onAction?.(card.action.event, card.action)}
          />
        </div>
      </section>
    );
  }

  // Details arriving from UAE PASS, one row at a time.
  if (card.type === 'signing') return <SigningCard card={card} style={style} />;

  if (card.type === 'fetch') {
    const total = card.rows.length * FETCH_STEP_MS;
    return (
      <section className="noor-card noor-fetch" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
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

  if (card.type === 'choices') {
    return (
      <section className="noor-card" style={style} aria-label={card.label}>
        <div className="noor-card__body">
          <div className="noor-suggest noor-suggest--tight" role="group" aria-label={card.label}>
            {card.options.map((o) => (
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
          <button
            type="button"
            className="noor-btn noor-btn--wide"
            disabled={locked}
            onClick={() => onAction?.(card.submit.event, card.submit)}
          >
            {card.submit.label}
          </button>
          <p className="noor-done__note">{card.note}</p>
        </div>
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

  if (card.type === 'link') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-card__text">{card.description}</p>
        </div>
        <div className="noor-card__foot noor-card__foot--links">
          {card.links.map((l) => (
            <LinkButton key={l.href} link={l} />
          ))}
        </div>
      </section>
    );
  }

  if (card.type === 'status') {
    return (
      <section className="noor-card" style={style} aria-label={card.title}>
        <div className="noor-card__body">
          <h3 className="noor-card__title">{card.title}</h3>
          <p className="noor-card__text">{card.summary}</p>
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
      </section>
    );
  }
  return null;
}
