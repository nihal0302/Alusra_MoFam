import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { NoorAvatar } from './NoorAvatar.jsx';
import { LinkButton } from './ActionCard.jsx';
import { MiraCard } from './MiraCards.jsx';
import alertMark from '../../assets/noor/alert.png'; // the red circle with an exclamation mark, as supplied
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

const THANKS_MS = 3500; // how long the thank-you line after a rating stays
const THINK_MS = 1800; // APPROX: the team's prototype thinks for 3–4 seconds; shortened here so a test conversation moves along
const stamp = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const Chevron = () => (
  <svg className="noor-fold__chev" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// The title and its line of body copy, with the alert mark beside them as tall as the two together (it follows the text if it wraps).
function Alert({ title, body }) {
  const text = useRef(null);
  const [size, setSize] = useState(52);
  useLayoutEffect(() => {
    const el = text.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const fit = () => setSize(Math.min(el.offsetHeight || 52, 72)); // as tall as the text, but not huge if the title wraps
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="noor-sec noor-alert">
      <img className="noor-alert__mark" src={alertMark} alt="" width={size} height={size} style={{ inlineSize: size, blockSize: size }} draggable={false} />
      <div ref={text}>
        <h3 className="noor-ask__q">{title}</h3>
        <p className="noor-ask__text">{body}</p>
      </div>
    </div>
  );
}

// One Mira turn in Variation 2, drawn as the Mira card of the team's POD Assistant prototype: a "Mira is thinking" line, then a
// single card whose sections come in one after another. The parts of a reply become sections:
//   ack      what Mira understood or cannot do (an icon and a line)
//   ask      what the person is asked to do next: the question, its numbered list and the lines that help to answer it
//   answer   an answer of the reply (lead line, then the body copy)
//   example  a fold that opens to an example answer
// followed by the cards of the reply (details, documents, contacts, buttons…), set as further sections of the same card.
// The eligibility result (the "What I understood" card and the result card) is drawn as the prototype draws it: the result
// header, "Your answers" with Change, the documents to prepare, the next question and its buttons.
// Stages: thinking → done. The reply is announced once through the panel's live region (see Assistant.jsx).
export function MiraMessage({ msgId, queued = false, scenario, avatar, name, head, labels, copy, chosen, tray = false, feedback, rating, onRate, latest = false, onStage, onAction }) {
  const reduced = usePrefersReducedMotion();
  // A reply that comes right behind another reply that is still being prepared waits for it (one avatar, one "thinking" at a time)
  // and then appears straight away.
  const [stage, setStage] = useState(reduced ? 'done' : queued ? 'queued' : 'thinking');
  const [line, setLine] = useState(0);
  const [time] = useState(stamp);
  const onStageRef = useRef(onStage);
  onStageRef.current = onStage;

  const kind = scenario.tool || scenario.think === 'search' ? 'search' : 'default';
  const lines = copy.thinking[kind] ?? copy.thinking.default;

  useEffect(() => {
    if (stage === 'queued') return;
    onStageRef.current?.(stage, scenario);
  }, [stage, scenario]);

  useEffect(() => {
    if (stage === 'queued' && !queued) setStage('done');
  }, [stage, queued]);

  useEffect(() => {
    if (reduced) setStage('done');
  }, [reduced]);

  useEffect(() => {
    if (stage !== 'thinking') return undefined;
    const second = setTimeout(() => setLine(1), THINK_MS / 2);
    const done = setTimeout(() => setStage('done'), THINK_MS);
    return () => {
      clearTimeout(second);
      clearTimeout(done);
    };
  }, [stage]);

  // The line after a rating shows for a few seconds, then leaves upwards.
  const [thanksState, setThanksState] = useState('none'); // none | in | out
  useEffect(() => {
    if (!rating) {
      setThanksState('none');
      return undefined;
    }
    setThanksState('in');
    const out = setTimeout(() => setThanksState('out'), THANKS_MS);
    const gone = setTimeout(() => setThanksState('none'), THANKS_MS + 450);
    return () => {
      clearTimeout(out);
      clearTimeout(gone);
    };
  }, [rating]);

  const locked = chosen !== undefined;
  const submitted = scenario.cards.some((c) => c.type === 'submitted' && c.mira);
  const result = scenario.cards.find((c) => c.type === 'result');
  const intake = result ? scenario.cards.find((c) => c.type === 'intake') : null;
  // Cards marked `before` (the UAE PASS details) sit between the acknowledgement and the question.
  const firstAsk = scenario.text.findIndex((b) => b.question);
  const beforeCards = firstAsk >= 0 ? scenario.cards.filter((c) => c.before) : [];

  const list = (items) => (
    <ol className="noor-ask__list">
      {items.map((it) => (
        <li key={it.text ?? it} data-n={it.n}>
          <span>{it.text ?? it}</span>
        </li>
      ))}
    </ol>
  );

  const textSections = () => {
    const out = [];
    if (submitted || result || scenario.cards.some((c) => c.type === 'status' && c.mira)) return out; // cards with no words above them, as in the prototype
    scenario.text.forEach((b, i) => {
      if (b.alert) {
        // "You are not eligible…": the red alert mark beside the title and its body copy, centred on them
        out.push(
          <Alert key={`alert${i}`} title={b.alert.title} body={b.alert.body} />,
        );
        return;
      }
      if (b.question) {
        const ack = b.primary ?? b.ack;
        if (ack) {
          out.push(
            <div className="noor-sec noor-sec--ack" key={`ack${i}`}>
              <ChatIcon name={b.ackIcon ?? 'info'} size={16} />
              <p>{ack}</p>
            </div>,
          );
        }
        if (i === firstAsk) beforeCards.forEach((card, k) => out.push(<MiraCard key={`before${k}`} card={card} index={0} onAction={onAction} chosen={chosen} tray={tray} />));
        out.push(
          <div className={`noor-sec noor-sec--ask${b.joined ? ' is-joined' : ''}`} key={`ask${i}`}>
            {b.lead && <p className="noor-ask__lead">{b.lead}</p>}
            {b.intro && <p className="noor-ask__text">{b.intro}</p>}
            <h3 className="noor-ask__q">
              {b.question}
              {b.tag && <span className="noor-ask__tag"> {b.tag}</span>}
            </h3>
            {b.items?.length > 0 && list(b.items)}
            {b.how && <p className={b.plainHow ? 'noor-ask__text noor-ask__after' : 'noor-ask__helper'}>{b.how}</p>}
            {b.note && <p className="noor-ask__helper">{b.note}</p>}
          </div>,
        );
        if (b.example) {
          out.push(
            <div className="noor-sec noor-sec--ex" key={`ex${i}`}>
              <details>
                <summary>
                  <ChatIcon name="info" size={15} />
                  {copy.example}
                  <Chevron />
                </summary>
                <p>{b.example}</p>
              </details>
            </div>,
          );
        }
        return;
      }
      if (result) {
        // Above the result the reply is one line of acknowledgement.
        const ack = [b.lead, b.primary ?? b.ack].filter(Boolean).join(' ');
        if (ack) {
          out.push(
            <div className="noor-sec noor-sec--ack" key={`ack${i}`}>
              <ChatIcon name="info" size={16} />
              <p>{ack}</p>
            </div>,
          );
        }
        return;
      }
      out.push(
        <div className="noor-sec noor-sec--ask" key={`a${i}`}>
          {b.lead && <p className="noor-ask__lead">{b.lead}</p>}
          {(b.primary ?? b.ack) && <p className="noor-ask__text">{b.primary ?? b.ack}</p>}
          {b.items?.length > 0 && list(b.items)}
          {b.secondary && <p className="noor-ask__text">{b.secondary}</p>}
          {b.note && <p className="noor-ask__helper">{b.note}</p>}
        </div>,
      );
    });
    return out;
  };

  const resultSections = () => {
    const c = result;
    const m = c.mira ?? {};
    const out = [];
    out.push(
      <div className="noor-sec" key="result">
        <div className={`noor-result is-${c.tone}`}>
          <span className="noor-result__ic">
            <ChatIcon name={c.tone === 'success' ? 'check' : 'info'} size={18} />
          </span>
          <div>
            <h3>{m.title ?? c.title}</h3>
            <p>{m.subtitle ?? c.subtitle}</p>
          </div>
        </div>
      </div>,
    );
    if (intake) {
      out.push(
        <div className="noor-sec" key="answers">
          <details className="noor-fold" open>
            <summary>
              {copy.answers}
              <Chevron />
            </summary>
            <dl className="noor-rows">
              {intake.rows
                .filter((r) => r.value)
                .map((r) => (
                  <div className="noor-row" key={r.qid}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                    <button
                      type="button"
                      className="noor-lnk"
                      disabled={locked}
                      aria-label={`${intake.changeLabel}: ${r.label}, currently ${r.value}`}
                      onClick={() => onAction?.('change', { qid: r.qid, label: r.label })}
                    >
                      {intake.changeLabel}
                    </button>
                  </div>
                ))}
            </dl>
          </details>
        </div>,
      );
    }
    if (m.reasons) {
      out.push(
        <div className="noor-sec" key="why">
          <p className="noor-subh">{m.listLabel}</p>
          <ul className="noor-why">
            {m.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>,
      );
    }
    if (!m.reasons) out.push(
      <div className="noor-sec" key="needs">
        <p className="noor-subh">{m.listLabel ?? c.listLabel}</p>
        <ul className="noor-needs">
          {c.items.map((it) => (
            <li className="noor-need" key={it.title}>
              <span className="noor-need__ic">
                <ChatIcon name={it.icon} size={18} />
              </span>
              <span>
                <b>{it.title}</b>
                {/^Received/.test(it.text) ? (
                  // a document that has arrived: a green tick before "Received · name", so it does not look like it still has to be uploaded
                  <span className="noor-need__got">
                    <span className="noor-need__tick">
                      <ChatIcon name="check" size={11} weight={2.6} />
                    </span>
                    {it.text}
                  </span>
                ) : (
                  <span>{m.itemTexts?.[it.icon] ? m.itemTexts[it.icon] : it.text}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>,
    );
    const next = m.next ?? c.next;
    if (next) {
      out.push(
        <div className="noor-sec noor-sec--ask" key="next">
          <h3 className="noor-ask__q">{next.question}</h3>
          {next.hint && <p className="noor-ask__helper">{next.hint}</p>}
        </div>,
      );
    }
    const buttons = Array.isArray(m.actions) ? m.actions : [...c.actions.filter((a) => a.variant !== 'primary'), ...c.actions.filter((a) => a.variant === 'primary')];
    if (!tray && (buttons.length || (!m.reasons && c.links.length))) {
      out.push(
        <div className="noor-sec noor-sec--actions" key="actions" style={{ '--n': buttons.length + (m.reasons ? 0 : c.links.length) }}>
          {(m.reasons ? [] : c.links).map((l) => (
            <LinkButton key={l.href} link={l} />
          ))}
          {buttons.map((a) => (
            <button key={a.event} type="button" className={`noor-btn${a.variant === 'primary' ? '' : ' noor-btn--outline'}`} disabled={locked} onClick={() => onAction?.(a.event, a.event === 'say' ? a.label : { ...a, label: (!Array.isArray(m.actions) && m.actions?.[a.event]) || a.label })}>
              {a.icon && <ChatIcon name={a.icon} size={16} />}
              {(!Array.isArray(m.actions) && m.actions?.[a.event]) || a.label}
            </button>
          ))}
        </div>,
      );
    }
    return out;
  };

  const rest = scenario.cards.filter((c) => !beforeCards.includes(c) && !(result && (c === result || c === intake)) && !(submitted && c.type === 'suggestions'));
  const thanks = rating === 'up' ? feedback.thanksUp : rating === 'down' ? feedback.thanksDown : '';

  if (stage === 'queued') return null;

  return (
    <div className="noor-msg noor-msg--noor noor-turn" data-msg={msgId}>
      {stage === 'thinking' ? (
        <div className="noor-think" role="status" aria-hidden="true">
          <span className="noor-think__av">
            <NoorAvatar src={avatar} size={28} />
          </span>
          <span className="noor-think__tx">
            <b>{copy.thinking.title}</b>
            <span>{lines[line] ?? lines[0]}…</span>
          </span>
        </div>
      ) : (
        <>
          {head && (
            <div className="noor-turn__head">
              <NoorAvatar src={avatar} size={24} />
              <b>{name}</b>
              <span>{time}</span>
            </div>
          )}
          <div className="noor-block">
            <span className="visually-hidden">{labels.noorSaid}</span>
            {textSections()}
            {result && resultSections()}
            {rest.map((card, i) => (
              <MiraCard key={i} card={card} index={i} onAction={onAction} chosen={chosen} tray={tray} />
            ))}
          </div>
          {onRate && (
            <div className={`noor-fb${rating ? ' is-rated' : ''}${latest ? ' is-latest' : ''}`} role="group" aria-label={feedback.label}>
              <button type="button" className={`noor-fb__btn${rating === 'up' ? ' is-on' : ''}`} aria-pressed={rating === 'up'} aria-label={feedback.up} title={feedback.up} onClick={() => onRate(rating === 'up' ? null : 'up')}>
                <ChatIcon name="thumbUp" size={18} />
              </button>
              <button type="button" className={`noor-fb__btn${rating === 'down' ? ' is-on' : ''}`} aria-pressed={rating === 'down'} aria-label={feedback.down} title={feedback.down} onClick={() => onRate(rating === 'down' ? null : 'down')}>
                <ChatIcon name="thumbDown" size={18} />
              </button>
              {thanks && thanksState !== 'none' && (
                <span className={`noor-fb__thanks${thanksState === 'out' ? ' is-out' : ''}`} role="status">
                  {thanks}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
