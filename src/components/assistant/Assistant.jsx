import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon.jsx';
import { ImageSlot } from '../ImageSlot.jsx';
import { NoorAvatar } from './NoorAvatar.jsx';
import { NoorMessage } from './NoorMessage.jsx';
import { resolveScenario } from '../../lib/noor.js';
import { buildQuestion, buildResult, buildReview, nextStep, parseAnswer, purge } from '../../lib/eligibility.js';
import { useApplication } from './useApplication.js';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';
import './Assistant.css';
import './EligibilityFlow.css';

let nextId = 1;
const LEAVE_MS = 200; // welcome → conversation
const CLOSE_MS = 180; // panel back into the launcher
const FOLLOW_MS = 350; // pause before the first question follows its intro

// What a screen reader hears once a reply has finished: the words, then the card titles.
function spokenReply(scenario) {
  const words = scenario.text.flatMap((b) => [b.lead, b.primary, b.secondary]).filter(Boolean).join(' ');
  const cards = scenario.cards
    .map((c) => c.spoken ?? [c.title, c.items?.map((i) => i.title ?? i).join('. ')].filter(Boolean).join('. '))
    .filter(Boolean)
    .join(' ');
  return cards ? `${words} ${cards}` : words;
}

// Which of the three stepper steps is done / active / still to come, for each stage of the journey.
function stepState(stage, i) {
  const current = { check: 0, checkDone: 0, docs: 1, review: 2, complete: 3 }[stage];
  if (stage === 'checkDone') return i === 0 ? 'done' : 'todo';
  if (i < current) return 'done';
  return i === current ? 'active' : 'todo';
}

export function Assistant({ content }) {
  const { persona, ui, topics, voice, scenarios, fallback, afterCheck, eligibility, application } = content;
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [stage, setStage] = useState(null); // stepper: null | check | checkDone | docs | review | complete
  const [awaiting, setAwaiting] = useState(false); // a question is waiting for an answer

  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const innerRef = useRef(null);
  const timers = useRef([]);
  const wasOpen = useRef(false);
  const followed = useRef(new Set());
  const pinned = useRef(true); // stay at the bottom unless the reader scrolled up
  // Eligibility flow state: answers so far, and which question card is waiting for an answer.
  const flowRef = useRef({ answers: {}, awaiting: null });

  const started = messages.length > 0;
  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };
  const focusInput = () => later(() => inputRef.current?.focus(), 30);

  // Focus moves in on open and returns to the launcher on close.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
    if (wasOpen.current) launcherRef.current?.focus();
  }, [open]);

  // Keep the newest content in view as a reply grows, unless the reader scrolled up to look back.
  // (Measured on scroll, not on growth: a tall card can push the bottom far past any fixed margin.)
  useEffect(() => {
    const log = logRef.current;
    const inner = innerRef.current;
    if (!log || !inner) return undefined;
    let lastSet = -1;
    const onScroll = () => {
      // Our own scroll-to-bottom also fires this event, possibly after the content has grown
      // again; only a scroll position we didn't set counts as the reader moving.
      if (Math.abs(log.scrollTop - lastSet) < 1) return;
      pinned.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    };
    const toBottom = () => {
      if (!pinned.current) return;
      log.scrollTop = log.scrollHeight;
      lastSet = log.scrollTop;
    };
    log.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(toBottom);
    ro.observe(inner);
    toBottom();
    return () => {
      log.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [started, open, stage]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const pushUser = (text, thumb) => {
    pinned.current = true; // sending always jumps to the latest
    setMessages((m) => [...m, { id: nextId++, role: 'user', text, thumb }]);
  };
  const pushNoor = (scenario) => {
    const id = nextId++;
    setBusy(true);
    setMessages((m) => [...m, { id, role: 'noor', scenario }]);
    return id;
  };
  const lock = (msgId, value) =>
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, chosen: value } : x)));
  const setWaiting = (value) => {
    flowRef.current.awaiting = value;
    setAwaiting(Boolean(value));
  };

  // The application itself (UAE PASS, questions, uploads, review, submit) lives in its own hook.
  const app = useApplication(application, { pushUser, pushNoor, lock, setStage });

  // ---- Eligibility flow (in the conversation) ---------------------------------------------
  const askNext = (answers) => {
    const step = nextStep(answers);
    if (step === 'review') {
      setWaiting(null);
      pushNoor(buildReview(eligibility, answers));
      return;
    }
    const msgId = pushNoor(buildQuestion(eligibility, step, answers));
    setWaiting({ msgId, qid: step });
  };

  const startEligibility = () => {
    flowRef.current = { answers: {}, awaiting: null };
    setStage('check');
    // Starting the application opens the roomier layout (the button is hidden on phones, which are full screen already).
    if (window.innerWidth > 520 && !expanded) {
      setExpanded(true);
      setAnnouncement(ui.announce.expanded);
    }
    askNext({});
  };

  const answer = (msgId, qid, value, shown) => {
    lock(msgId, value);
    const answers = purge({ ...flowRef.current.answers, [qid]: value });
    flowRef.current.answers = answers;
    pushUser(shown);
    askNext(answers);
  };

  const change = (msgId, qid, label) => {
    lock(msgId, 'changing');
    pushUser(`${eligibility.review.changeLabel}: ${label}`);
    const id = pushNoor(buildQuestion(eligibility, qid, flowRef.current.answers, { changing: true }));
    setWaiting({ msgId: id, qid });
  };

  const onAction = (event, payload, msgId) => {
    if (busy) return;
    if (app.handle(event, payload, msgId)) return;
    switch (event) {
      case 'startCheck':
      case 'restartCheck':
        lock(msgId, 'started');
        pushUser(payload.label);
        startEligibility();
        break;
      case 'answer':
        answer(msgId, payload.qid, payload.value, payload.label);
        break;
      case 'change':
        change(msgId, payload.qid, payload.label);
        break;
      case 'confirm': {
        lock(msgId, 'confirmed');
        pushUser(payload.label);
        setWaiting(null);
        const { kind, scenario } = buildResult(eligibility, flowRef.current.answers);
        setStage(kind === 'eligible' ? 'checkDone' : 'check');
        pushNoor(scenario);
        break;
      }
      case 'reviewAnswers':
        lock(msgId, 'review');
        pushUser(payload.label);
        setStage('check');
        pushNoor(buildReview(eligibility, flowRef.current.answers));
        break;
      case 'later':
        lock(msgId, 'later');
        pushUser(payload.label);
        pushNoor(afterCheck.later);
        break;
      case 'apply':
        lock(msgId, 'apply');
        pushUser(payload.label);
        pushNoor(afterCheck.apply);
        break;
      case 'ask':
        send(payload);
        break;
      default:
    }
  };

  // ---- Sending ---------------------------------------------------------------------------
  // The first message lets the welcome screen leave before the conversation takes over.
  const begin = (fn) => {
    if (started || reduced) {
      fn();
      return;
    }
    setLeaving(true);
    later(() => {
      fn();
      setLeaving(false);
    }, LEAVE_MS);
  };

  const send = useCallback(
    (raw) => {
      const text = raw.trim();
      if (!text || busy || leaving) return;
      setDraft('');
      const waiting = flowRef.current.awaiting;
      // A typed or spoken answer to the open question counts the same as tapping an option.
      const option = waiting ? parseAnswer(eligibility.questions[waiting.qid], text) : null;
      const scenario = resolveScenario(text, scenarios, fallback);
      begin(() => {
        if (app.handleText(text, { known: scenario !== fallback })) return;
        if (option) {
          answer(waiting.msgId, waiting.qid, option.value, text);
          return;
        }
        pushUser(text);
        pushNoor(scenario);
      });
      focusInput();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, leaving, started, reduced, scenarios, fallback],
  );

  const onStage = (st, scenario, msgId) => {
    setThinking(st === 'thinking' || st === 'tool');
    if (st === 'thinking') setAnnouncement(ui.announce.thinking);
    if (st === 'done') {
      setBusy(false);
      setAnnouncement(spokenReply(scenario));
      if (scenario.then === 'startEligibility' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        later(startEligibility, reduced ? 0 : FOLLOW_MS);
      }
      if (scenario.then === 'afterSignIn' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        // Let the details finish arriving before the first question.
        later(app.next, reduced ? 0 : application.signIn.profile.rows.length * 420 + 1400);
      }
    }
  };

  // ---- Voice (simulated) -----------------------------------------------------------------
  const stopListening = () => {
    setListening(false);
    const waiting = flowRef.current.awaiting;
    send(app.voiceSample ?? (waiting ? eligibility.questions[waiting.qid].voiceSample : voice.transcript));
  };

  const startListening = () => {
    if (busy || listening || leaving) return;
    setListening(true);
    later(stopListening, voice.listeningMs);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    flowRef.current = { answers: {}, awaiting: null };
    followed.current = new Set();
    app.reset();
    setStage(null);
    setAwaiting(false);
    setListening(false);
    setMessages([]);
    setBusy(false);
    setThinking(false);
    setDraft('');
    setAnnouncement('');
    focusInput();
  };

  const close = () => {
    timers.current.forEach(clearTimeout);
    setListening(false);
    if (reduced) {
      setOpen(false);
      return;
    }
    setClosing(true);
    later(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_MS);
  };

  const toggleExpanded = () => {
    setAnnouncement(expanded ? ui.announce.collapsed : ui.announce.expanded);
    setExpanded(!expanded);
  };

  const avatarState = listening ? 'listening' : thinking ? 'thinking' : 'idle';
  const pose = started ? persona.poses.selection : persona.poses.greeting;
  const blocked = busy || leaving;
  const placeholder = app.awaiting?.placeholder ?? (awaiting ? ui.input.answer : started ? ui.input.conversation : ui.input.welcome);

  return (
    <div className="noor">
      <button
        ref={launcherRef}
        type="button"
        className="noor-launcher"
        aria-label={ui.launcher.label}
        aria-haspopup="dialog"
        aria-expanded={open}
        hidden={open}
        onClick={() => setOpen(true)}
      >
        <NoorAvatar src={persona.avatar} size={48} />
        <span className="noor-launcher__text">
          <span className="noor-launcher__title">{ui.launcher.title}</span>
          <span className="noor-launcher__sub">{ui.launcher.subtitle}</span>
        </span>
      </button>

      {open && (
        <div className={`noor-shell${expanded ? ' is-expanded' : ''}${closing ? ' is-closing' : ''}`}>
          <div className="noor-pose" aria-hidden="true">
            <ImageSlot file={pose} decorative fit="contain" />
          </div>
          <div
            className="noor-panel"
            role="dialog"
            aria-label={ui.panelLabel}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
            }}
          >
            <div className="visually-hidden" aria-live="polite" aria-atomic="true">
              {announcement}
            </div>

            <header className="noor-header">
              <NoorAvatar src={persona.avatar} size={44} state={avatarState} />
              <div className="noor-header__text">
                <p className="noor-header__name">{persona.name}</p>
                <p className="noor-header__sub">{persona.subtitle}</p>
              </div>
              <button
                type="button"
                className="noor-icon-btn noor-expand"
                aria-label={expanded ? ui.actions.collapse : ui.actions.expand}
                aria-expanded={expanded}
                onClick={toggleExpanded}
              >
                <Icon name={expanded ? 'collapse' : 'expand'} size={16} />
              </button>
              {started ? (
                <button type="button" className="noor-icon-btn" aria-label={ui.actions.restart} onClick={restart}>
                  <Icon name="refresh" size={16} />
                </button>
              ) : (
                <button type="button" className="noor-icon-btn" aria-label={ui.actions.minimize} onClick={close}>
                  <Icon name="minus" size={16} />
                </button>
              )}
              <button type="button" className="noor-icon-btn" aria-label={ui.actions.close} onClick={close}>
                <Icon name="close" size={16} />
              </button>
            </header>

            {stage && (
              <nav className="noor-strip" aria-label={eligibility.stepsLabel}>
                <ol className="noor-stepper">
                  {eligibility.steps.map((label, i) => {
                    const state = stepState(stage, i);
                    return (
                      <li key={label} className={`is-${state}`} aria-current={state === 'active' ? 'step' : undefined}>
                        <span className="noor-stepper__n">
                          {state === 'done' ? <Icon name="check" size={12} /> : i + 1}
                        </span>
                        <span className="noor-stepper__label">{label}</span>
                        {state === 'done' && <span className="visually-hidden"> (complete)</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            {started ? (
              <div className="noor-log" ref={logRef} role="log" aria-live="off" aria-label="Conversation">
                <div className="noor-log__inner" ref={innerRef}>
                  <p className="noor-log__day">{ui.today}</p>
                  {messages.map((m) =>
                    m.role === 'user' ? (
                      <div className="noor-msg noor-msg--user" key={m.id}>
                        <div className="noor-bubble noor-bubble--user">
                          <span className="visually-hidden">{ui.announce.youSaid}</span>
                          {m.thumb && <img className="noor-bubble__thumb" src={m.thumb} alt="" />}
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <NoorMessage
                        key={m.id}
                        scenario={m.scenario}
                        avatar={persona.avatar}
                        labels={ui.announce}
                        chosen={m.chosen}
                        onStage={(st, sc) => onStage(st, sc, m.id)}
                        onAction={(event, payload) => onAction(event, payload, m.id)}
                      />
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className={`noor-welcome${leaving ? ' is-leaving' : ''}`}>
                <div className="noor-welcome__dots" aria-hidden="true" />
                <div className="noor-welcome__aurora" aria-hidden="true">
                  <i /><i /><i />
                </div>
                <div className="noor-welcome__hero">
                  <span className="noor-welcome__glow" aria-hidden="true" />
                  <NoorAvatar src={persona.avatar} size={76} ring state={avatarState} className="noor-welcome__avatar" />
                </div>
                <h2 className="noor-welcome__title">{ui.welcome.title}</h2>
                <p className="noor-welcome__sub">{ui.welcome.subtitle}</p>
              </div>
            )}

            <footer className="noor-footer">
              {!started && (
                <div className={`noor-topics${leaving ? ' is-leaving' : ''}`}>
                  {topics.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      className="noor-topic"
                      style={{ '--i': i }}
                      aria-disabled={blocked || undefined}
                      onClick={() => send(t.message)}
                    >
                      <span className="noor-topic__icon" aria-hidden="true">
                        <Icon name={t.icon} size={14} />
                      </span>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              <form
                className={`noor-input${listening ? ' is-listening' : ''}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                }}
              >
                {listening ? (
                  <>
                    <span className="noor-wave" aria-hidden="true">
                      <i /><i /><i /><i /><i /><i /><i />
                    </span>
                    <span className="noor-input__listening" role="status">
                      {ui.listening}
                    </span>
                    <button type="button" className="noor-send" aria-label={ui.actions.stop} onClick={stopListening}>
                      <Icon name="stop" size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      ref={inputRef}
                      className="noor-input__field"
                      type="text"
                      dir="auto"
                      enterKeyHint="send"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={placeholder}
                      aria-label={placeholder}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="noor-mic"
                      aria-label={ui.actions.mic}
                      aria-disabled={blocked || undefined}
                      onClick={startListening}
                    >
                      <Icon name="mic" size={20} />
                    </button>
                    <button
                      type="submit"
                      className="noor-send"
                      aria-label={ui.actions.send}
                      aria-disabled={blocked || !draft.trim() || undefined}
                    >
                      <Icon name="arrowRight" size={18} />
                    </button>
                  </>
                )}
              </form>
              <p className="noor-footer__note">{ui.footer}</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
