import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { VoiceGlow } from './VoiceGlow.jsx';
import { TopicArt } from './TopicArt.jsx';
import { ImageSlot } from '../ImageSlot.jsx';
import { NoorAvatar } from './NoorAvatar.jsx';
import { NoorMessage } from './NoorMessage.jsx';
import { resolveScenario } from '../../lib/noor.js';
import { buildQuestion, buildResult, buildReview, nextStep, parseAnswer, pathOf, purge } from '../../lib/eligibility.js';
import { CONV_KINDS, batchExample, buildBatch, buildNudgeConv, looksLikeQuestion, readBatch } from '../../lib/conversation.js';
import { useApplication } from './useApplication.js';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';
import { buildNudge, formatSize } from '../../lib/application.js';
import { buildStatusReply, parseApplicationId } from '../../lib/status.js';
import { createKnowledge } from '../../lib/knowledge.js';
import { trayItems } from '../../lib/actionTray.js';
import { ButtonsSwitch } from '../PrototypeSwitches.jsx';
import { LinkButton } from './ActionCard.jsx';
import { UaePassButton } from './UaePassButton.jsx';
import { buildIntake, countFacts, extractFacts, markReceived, placeFiles } from '../../lib/intake.js';
import './Assistant.css';
import './EligibilityFlow.css';
import './AssistantV2.css';

let nextId = 1;
const LEAVE_MS = 200; // welcome → conversation
const CLOSE_MS = 180; // panel back into the launcher
const FOLLOW_MS = 350; // pause before the first question follows its intro

// Heights (0 to 1) for the waveform bars: taller in the middle, uneven like speech.
const VOICE_COUNT = 112;
const VOICE_BARS = Array.from({ length: VOICE_COUNT }, (_, i) => {
  const envelope = 0.3 + 0.7 * Math.sin((Math.PI * (i + 0.5)) / VOICE_COUNT);
  return +Math.max(0.16, envelope * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.9 + 0.6) * Math.cos(i * 0.37)))).toFixed(2);
});

// What a screen reader hears once a reply has finished: the words, then the card titles.
function spokenReply(scenario) {
  const words = scenario.text.flatMap((b) => [b.lead, b.primary, b.secondary, b.example]).filter(Boolean).join(' ');
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

export function Assistant({ content, variant = '1', buttonsInside = true, onButtonsInside, defaultOpen = false, onOpenChange }) {
  const { persona, ui, topics, voice, scenarios, fallback, afterCheck, eligibility, application, intake, statusCheck, eligibilityCard, knowledge } = content;
  // Search over the Ministry's published information (see src/lib/knowledge.js). The service we were just discussing is
  // remembered so a follow-up like "and the fees?" knows what it is about.
  const kb = useMemo(() => createKnowledge({ ...knowledge, extras: { eligibilityCard } }), [knowledge, eligibilityCard]);
  const kbService = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(defaultOpen);
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
  const [statusAwait, setStatusAwait] = useState(false); // Mira has asked for an application ID
  const statusRef = useRef(false);

  const [attachments, setAttachments] = useState([]); // up to two files chosen for the next message
  const [attachError, setAttachError] = useState('');
  const attachRef = useRef([]);
  const docsRef = useRef({}); // the photograph and report received so far from files sent in the chat
  const resultShown = useRef(null); // the answers an eligibility result was last shown for
  const appRef = useRef(null); // latest application state, for callbacks that outlive a render
  const fileRef = useRef(null);

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
  const expandedRef = useRef(false);
  expandedRef.current = expanded;

  const setAttach = (list) => {
    attachRef.current.forEach((a) => {
      if (a.url && !list.includes(a)) URL.revokeObjectURL(a.url);
    });
    attachRef.current = list;
    setAttachments(list);
  };

  const pickAttachments = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    const added = [];
    let error = '';
    for (const file of files) {
      if (!ui.attach.types.includes(file.type)) {
        error = ui.attach.errors.type;
        continue;
      }
      if (file.size > ui.attach.maxMb * 1024 * 1024) {
        error = ui.attach.errors.size;
        continue;
      }
      if (attachRef.current.length + added.length >= ui.attach.maxFiles) {
        error = ui.attach.errors.count;
        break;
      }
      added.push({ file, name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) });
    }
    setAttachError(error);
    if (added.length) {
      setAttach([...attachRef.current, ...added]);
      focusInput();
    }
  };

  const started = messages.length > 0;
  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };
  const focusInput = () => later(() => inputRef.current?.focus(), 30);
  // In Variation 2 the message box moves from the centre to the footer on the first message; the cursor follows it.
  useEffect(() => {
    if (started && open) focusInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // The message box grows with what is typed, so the whole message stays in view (up to six lines, then it scrolls).
  // It also re-measures whenever the box changes width (the window is resized, or the chat is expanded or collapsed),
  // because a different width changes how the text wraps.
  useLayoutEffect(() => {
    const fit = () => {
      const el = inputRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    const el = inputRef.current;
    let lastWidth = el?.clientWidth;
    const watch =
      el && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (el.clientWidth === lastWidth) return;
            lastWidth = el.clientWidth;
            fit();
          })
        : null;
    watch?.observe(el);
    return () => {
      window.removeEventListener('resize', fit);
      watch?.disconnect();
    };
  }, [draft, listening, expanded, open, attachments.length, started]);

  useEffect(() => {
    onOpenChange?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    ro.observe(log); // the viewport shrinks when the reply strip appears above the message box
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
  // Variation 2 runs the application as a conversation; Variation 1 uses the cards.
  const conv = variant === '2';
  const app = useApplication(application, { pushUser, pushNoor, lock, setStage }, { conv });
  appRef.current = app;

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

  // Starting the application opens the roomier layout (the button is hidden on phones, which are full screen already).
  // Called the moment the reader asks to start, so the panel grows before Mira begins to reply.
  const expandForCheck = () => {
    if (window.innerWidth > 416 && !expandedRef.current) {
      expandedRef.current = true;
      setExpanded(true);
      setAnnouncement(ui.announce.expanded);
    }
  };

  // Variation 2 asks the questions together, numbered; Variation 1 asks them one at a time.
  const askBatch = (answers, first = false) => {
    const qids = first ? ['who', 'status', 'report', 'accredited'] : pathOf(answers).filter((q) => answers[q] === undefined);
    if (!qids.length) {
      askNext(answers);
      return;
    }
    const msgId = pushNoor(buildBatch(eligibility, qids, first));
    setWaiting({ msgId, batch: true, qids });
  };

  const startEligibility = () => {
    flowRef.current = { answers: {}, awaiting: null };
    setStage('check');
    expandForCheck();
    if (conv) askBatch({}, true);
    else askNext({});
  };

  // Details and files sent in one message: read what is there, say what was understood, then either give the result
  // or ask only for what is missing. Answers and documents build up across messages until the check is complete.
  const runIntake = (text, files, facts) => {
    expandForCheck();
    const placed = placeFiles(docsRef.current, files);
    docsRef.current = placed.docs;
    const merged = { ...facts };
    // Sending a report file means there is a report, unless the message or an earlier answer already said so.
    if (placed.docs.report && merged.report === undefined && flowRef.current.answers.report === undefined) merged.report = 'yes';
    const answers = purge({ ...flowRef.current.answers, ...merged });
    flowRef.current.answers = answers;
    const open = flowRef.current.awaiting;
    if (open) lock(open.msgId, 'skipped'); // the question card is replaced by this message
    setWaiting(null);
    setStage('check');
    const firstImage = files.find((f) => f.type.startsWith('image/'));
    pushUser([text, files.map((f) => f.name).join(', ')].filter(Boolean).join(' — '), firstImage?.url);
    attachRef.current = []; // the bubble and the documents keep the preview URLs alive
    setAttachments([]);
    const built = buildIntake({
      eligibility,
      copy: intake,
      answers,
      docs: placed.docs,
      notes: placed.notes,
      hadText: Boolean(text),
      fileCount: files.length,
      resultShownFor: resultShown.current,
    });
    if (built.resultFor) {
      resultShown.current = built.resultFor;
      setStage(built.kind === 'eligible' ? 'checkDone' : 'check');
    }
    pushNoor(built.scenario);
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
        // Files sent earlier in the chat show as received on the checklist, and a later file will not repeat this result.
        if (Object.keys(docsRef.current).length) scenario.cards[0] = markReceived(scenario.cards[0], docsRef.current, intake);
        resultShown.current = JSON.stringify(flowRef.current.answers);
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
        app.prefill(docsRef.current); // files sent earlier are not asked for again
        app.setWho(flowRef.current.answers.who); // an application for a child asks for the child's details too
        pushNoor(afterCheck.apply);
        break;
      case 'ask':
        send(payload);
        break;
      case 'pickFiles':
        fileRef.current?.click();
        break;
      case 'startVoice':
        startListening();
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

  // Which reply a typed or spoken message gets. A service named in the question is answered from the knowledge base;
  // the scripted flows (start the check, track an application) keep their own phrases; other general questions use the
  // knowledge base; anything else falls back to the scripted answers, then to "I could not find that".
  const replyFor = (text) => {
    const scripted = resolveScenario(text, scenarios, fallback);
    const hit = kb.answer(text, { service: kbService.current });
    let scenario = scripted;
    if (hit && (hit.kind === 'smalltalk' || (hit.kind === 'service' && hit.strength >= 2))) scenario = hit.scenario;
    else if (['apply', 'track', 'ask'].includes(scripted.id)) scenario = scripted;
    else if (hit && hit.strength >= 2) scenario = hit.scenario;
    else if (scripted === fallback && hit) scenario = hit.scenario;
    if (hit && scenario === hit.scenario) {
      if (hit.kind === 'service') kbService.current = hit.serviceId;
      else if (hit.kind !== 'clarify') kbService.current = null;
    } else kbService.current = null;
    return scenario;
  };

  const send = useCallback(
    (raw) => {
      const text = raw.trim();
      const files = attachRef.current;
      if ((!text && !files.length) || busy || leaving) return;
      setDraft('');
      const waiting = flowRef.current.awaiting;
      // A typed or spoken answer to the open question counts the same as tapping an option.
      const option = waiting && !waiting.batch ? parseAnswer(eligibility.questions[waiting.qid], text) : null;
      const scenario = replyFor(text);
      if (scenario.then === 'startEligibility') expandForCheck();
      begin(() => {
        const open = appRef.current?.awaiting;
        if (files.length && open?.kind === 'file') {
          // A document is being asked for: a file sent from the message box counts as that upload.
          const att = files[0];
          const up = application.steps[open.step].upload;
          const bad = !up.types.includes(att.type)
            ? application.upload.errors.type.replace('{types}', up.typeNames)
            : att.size > application.upload.maxMb * 1024 * 1024
              ? application.upload.errors.size
              : '';
          setAttach([]);
          if (bad) {
            pushUser(att.name);
            pushNoor(buildNudge(bad));
          } else {
            appRef.current.handle('upload', { field: open.step, file: att.file }, open.msgId);
          }
          return;
        }
        if (conv && files.length && open && CONV_KINDS.includes(open.kind)) {
          // Files attached while the application is open: sorted into photograph and report, read with any typed details.
          setAttach([]);
          appRef.current.handleFiles(files, text);
          return;
        }
        if (conv && waiting?.batch) {
          // The numbered questions are open: read the reply as answers to them, unless it is a question of its own.
          const aside = looksLikeQuestion(text) && scenario !== fallback;
          const got = aside ? {} : readBatch(text, waiting.qids, eligibility);
          if (Object.keys(got).length || files.length) {
            runIntake(text, files, got);
            return;
          }
          if (!aside && scenario === fallback) {
            pushUser(text);
            pushNoor(buildNudgeConv(eligibility.batch.nudgeLead, eligibility.batch.nudge, batchExample(eligibility, waiting.qids), eligibility.batch.exampleLabel));
            return;
          }
        }
        // Files, or a message that already tells Mira two or more of the answers: read it all at once.
        const facts = extractFacts(text);
        if (files.length || (countFacts(facts) >= 2 && !open && !statusRef.current)) {
          runIntake(text, files, facts);
          return;
        }
        if (statusRef.current) {
          const id = parseApplicationId(text);
          if (id) {
            statusRef.current = false;
            setStatusAwait(false);
            pushUser(text);
            pushNoor(buildStatusReply(statusCheck, id));
            return;
          }
          if (scenario === fallback) {
            pushUser(text);
            pushNoor(buildNudge(statusCheck.invalid));
            return;
          }
          // Something else was asked: leave the ID question and answer that instead.
          statusRef.current = false;
          setStatusAwait(false);
        }
        if (app.handleText(text, { known: scenario !== fallback })) return;
        if (option) {
          answer(waiting.msgId, waiting.qid, option.value, text);
          return;
        }
        pushUser(text);
        // A question asked in the middle of the application is answered, then Mira brings the person back to it.
        const midway = conv && !scenario.then && (waiting?.batch || CONV_KINDS.includes(appRef.current?.awaiting?.kind));
        pushNoor(midway ? { ...scenario, then: 'resume' } : scenario);
        if (scenario.id === 'track') {
          statusRef.current = true;
          setStatusAwait(true);
        }
      });
      focusInput();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, leaving, started, reduced, scenarios, fallback],
  );

  const onStage = (st, scenario, msgId) => {
    setThinking(st === 'thinking' || st === 'tool');
    const hasResult = scenario.cards?.some((card) => card.type === 'result' || card.type === 'submitted');
    // A tall outcome card should open at its heading: stop following the bottom for this reply…
    if (hasResult && st === 'thinking') pinned.current = false;
    // …and once the card is there, bring the top of the message into view.
    if (hasResult && st === 'done') {
      pinned.current = false; // also covers reduced motion, which skips the thinking stage
      later(() => {
        const log = logRef.current;
        const el = log?.querySelector(`[data-msg="${msgId}"]`);
        if (!log || !el) return;
        // Layout offsets, not on-screen rects: the message is still sliding in, and a rect would include that.
        log.scrollTop = el.offsetTop - 12;
      }, 80);
    }
    if (st === 'thinking') setAnnouncement(ui.announce.thinking);
    if (st === 'done') {
      setBusy(false);
      setAnnouncement(spokenReply(scenario));
      if (scenario.then === 'startEligibility' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        later(startEligibility, reduced ? 0 : FOLLOW_MS);
      }
      if (scenario.then === 'continueIntake' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        later(() => (conv ? askBatch(flowRef.current.answers) : askNext(flowRef.current.answers)), reduced ? 0 : FOLLOW_MS);
      }
      if (scenario.then === 'resume' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        later(() => {
          if (flowRef.current.awaiting?.batch) pushNoor({ id: 'check:resume', tool: null, text: [{ primary: eligibility.batch.resume }], cards: [] });
          else appRef.current?.resume();
        }, reduced ? 0 : FOLLOW_MS);
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
    // The transcript lands in the message box; the person decides whether to send it.
    const said = app.voiceSample ?? (statusRef.current ? statusCheck.voiceSample : waiting?.batch ? eligibility.batch.voiceSample : waiting ? eligibility.questions[waiting.qid].voiceSample : voice.transcript);
    setDraft((d) => (d.trim() ? `${d.trim()} ${said}` : said));
    focusInput();
  };

  const startListening = () => {
    if (busy || listening || leaving) return;
    setListening(true); // runs until the person presses stop
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    flowRef.current = { answers: {}, awaiting: null };
    docsRef.current = {};
    resultShown.current = null;
    statusRef.current = false;
    kbService.current = null;
    setStatusAwait(false);
    followed.current = new Set();
    app.reset();
    setStage(null);
    setAwaiting(false);
    setListening(false);
    setMessages([]);
    setBusy(false);
    setThinking(false);
    setDraft('');
    setAttach([]);
    setAttachError('');
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
  const v2 = variant === '2';
  // Listening looks the way it does in Variation 1 (colour veil, centred avatar, glass message box).
  const v2view = v2 && !listening;
  const welcomeCopy = v2 ? ui.welcomeV2 : ui.welcome;
  const pose = started ? persona.poses.selection : persona.poses.greeting;

  // With the buttons outside the reply, the latest reply's buttons wait in a strip above the message box
  // until it is answered (or the person types instead).
  const lastMessage = messages[messages.length - 1];
  const trayNow =
    !buttonsInside && lastMessage?.role === 'noor' && lastMessage.chosen === undefined && !busy && !listening
      ? trayItems(lastMessage.scenario)
      : [];
  const placeholder = attachments.length ? ui.attach.placeholder : app.awaiting?.placeholder ?? (statusAwait ? statusCheck.placeholder : conv && flowRef.current.awaiting?.batch ? eligibility.batch.placeholder : awaiting ? ui.input.answer : started ? ui.input.conversation : v2 ? ui.input.welcomeV2 : ui.input.welcome);
  const blocked = busy || leaving;
  const topicsEl = (
    <div className={`noor-topics${leaving ? ' is-leaving' : ''}${listening ? ' is-muted' : ''}`} inert={listening || undefined}>
      {topics.map((t, i) => (
        <button
          key={t.id}
          type="button"
          className="noor-topic"
          data-topic={t.id}
          style={{ '--i': i }}
          aria-disabled={blocked || undefined}
          onClick={() => send(t.message)}
        >
            <span className="noor-topic__art" aria-hidden="true">
              <TopicArt id={t.id} />
            </span>
          <span className="noor-topic__text">
            <span className="noor-topic__label">{t.label}</span>
            <span className="noor-topic__desc">{t.description}</span>
          </span>
          <span className="noor-topic__go" aria-hidden="true">
            <ChatIcon name="arrowUpRight" size={14} weight={1.8} />
          </span>
        </button>
      ))}
    </div>
  );
  const composer = (
    <>
              {attachments.map((attachment) => (
                <div className="noor-attach" key={attachment.url}>
                  <span className="noor-attach__thumb" aria-hidden="true">
                    {attachment.type.startsWith('image/') ? <img src={attachment.url} alt="" /> : <ChatIcon name="file" size={20} weight={1.5} />}
                  </span>
                  <span className="noor-attach__meta">
                    <span className="noor-attach__name">{attachment.name}</span>
                    <span className="noor-attach__size">{formatSize(attachment.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="noor-attach__remove"
                    aria-label={`${ui.attach.remove}: ${attachment.name}`}
                    onClick={() => setAttach(attachRef.current.filter((a) => a !== attachment))}
                  >
                    <ChatIcon name="close" size={14} />
                  </button>
                </div>
              ))}
              {attachError && (
                <p className="noor-attach__error" role="alert">
                  {attachError}
                </p>
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
                    <span className="noor-vwave" role="status">
                      <span className="visually-hidden">{ui.listening}</span>
                      <span className="noor-vwave__bars" aria-hidden="true">
                        {VOICE_BARS.map((p, i) => (
                          <i key={i} style={{ '--p': p, '--d': `${(i * 59) % 700}ms` }} />
                        ))}
                      </span>
                    </span>
                    <button type="button" className="noor-send" aria-label={ui.actions.stop} onClick={stopListening}>
                      <span className="noor-stop" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <textarea
                      ref={inputRef}
                      className="noor-input__field"
                      rows={1}
                      dir="auto"
                      enterKeyHint="send"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        // Enter sends; Shift+Enter starts a new line.
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder={placeholder}
                      aria-label={placeholder}
                      autoComplete="off"
                    />
                    {(
                      <>
                        <input
                          ref={fileRef}
                          className="visually-hidden"
                          type="file"
                          accept={ui.attach.accept}
                          multiple
                          tabIndex={-1}
                          onChange={(e) => {
                            pickAttachments(e.target.files);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          className="noor-mic noor-attach-btn"
                          aria-label={ui.attach.label}
                          aria-disabled={blocked || undefined}
                          onClick={() => !blocked && fileRef.current?.click()}
                        >
                          <ChatIcon name="attach" size={20} weight={1.6} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="noor-mic"
                      aria-label={ui.actions.mic}
                      aria-disabled={blocked || undefined}
                      onClick={startListening}
                    >
                      <ChatIcon name="mic" size={20} />
                    </button>
                    <button
                      type="submit"
                      className="noor-send"
                      aria-label={ui.actions.send}
                      aria-disabled={blocked || (!draft.trim() && !attachments.length) || undefined}
                    >
                      <ChatIcon name="arrowRight" size={18} />
                    </button>
                  </>
                )}
              </form>
    </>
  );
  // Variation 2: the three services are small quick-starts under the message box, not the main thing on screen.
  const quickEl = (
    <div className={`noor-quick${leaving ? ' is-leaving' : ''}${listening ? ' is-muted' : ''}`} inert={listening || undefined}>
      <p className="noor-quick__label">{welcomeCopy.quickLabel}</p>
      <div className="noor-quick__row">
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            className="noor-quick__btn"
            data-topic={t.id}
            aria-disabled={blocked || undefined}
            onClick={() => send(t.message)}
          >
            <ChatIcon name={t.icon} size={16} weight={1.5} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
  const heroEl = (
    <div className="noor-welcome__hero">
      {!v2view && <span className="noor-welcome__glow" aria-hidden="true" />}
      <NoorAvatar src={persona.avatar} size={v2view ? 56 : 76} ring={!v2view} state={avatarState} className="noor-welcome__avatar" />
    </div>
  );
  const titleEl = (
    <h2 className="noor-welcome__title" key={listening ? 'listening' : 'idle'}>
      {listening ? ui.listening : welcomeCopy.title}
    </h2>
  );
  const subEl = <p className="noor-welcome__sub">{listening ? ui.listeningHint : welcomeCopy.subtitle}</p>;
  const welcomeView = (
    <div key="welcome" className={`noor-welcome${v2view ? ' noor-welcome--v2' : ''}${leaving ? ' is-leaving' : ''}${started ? ' is-over-log' : ''}`}>
      {!v2view && <div className="noor-welcome__dots" aria-hidden="true" />}
      {!v2view && (
        <div className="noor-welcome__aurora" aria-hidden="true">
          <i /><i /><i />
        </div>
      )}
      {v2view ? (
        // Variation 2: the greeting reads left to right, the message box sits right under it, then the quick-starts.
        <div className="noor-welcome__body">
          {heroEl}
          {titleEl}
          {subEl}
          {!started && composer}
          {!started && quickEl}
        </div>
      ) : (
        <>
          {heroEl}
          {titleEl}
          {subEl}
        </>
      )}
    </div>
  );

  return (
    <div className={`noor${v2 ? ' noor--v2' : ''}`} data-variant={variant}>
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

      {open && <div className={`noor-scrim${closing ? ' is-closing' : ''}`} aria-hidden="true" />}

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
                <ChatIcon name={expanded ? 'collapse' : 'expand'} size={16} />
              </button>
              {started ? (
                <button type="button" className="noor-icon-btn" aria-label={ui.actions.restart} onClick={restart}>
                  <ChatIcon name="refresh" size={16} />
                </button>
              ) : (
                <button type="button" className="noor-icon-btn" aria-label={ui.actions.minimize} onClick={close}>
                  <ChatIcon name="minus" size={16} />
                </button>
              )}
              <button type="button" className="noor-icon-btn" aria-label={ui.actions.close} onClick={close}>
                <ChatIcon name="close" size={16} />
              </button>
            </header>

            <ButtonsSwitch on={buttonsInside} onChange={onButtonsInside} label={ui.proto.buttons} hint={ui.proto.label} />

            {stage && (
              <nav className="noor-strip" aria-label={eligibility.stepsLabel}>
                <ol className="noor-stepper">
                  {eligibility.steps.map((label, i) => {
                    const state = stepState(stage, i);
                    return (
                      <li key={label} className={`is-${state}`} aria-current={state === 'active' ? 'step' : undefined}>
                        <span className="noor-stepper__n">
                          {state === 'done' ? <ChatIcon name="check" size={12} /> : i + 1}
                        </span>
                        <span className="noor-stepper__label">{label}</span>
                        {state === 'done' && <span className="visually-hidden"> (complete)</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            )}

            <div className="noor-stage">
            {started ? (
              <div key="log" className="noor-log" ref={logRef} role="log" aria-live="off" aria-label="Conversation">
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
                        msgId={m.id}
                        scenario={m.scenario}
                        avatar={persona.avatar}
                        labels={ui.announce}
                        chosen={m.chosen}
                        tray={!buttonsInside}
                        onStage={(st, sc) => onStage(st, sc, m.id)}
                        onAction={(event, payload) => onAction(event, payload, m.id)}
                      />
                    ),
                  )}
                </div>
              </div>
            ) : (
              welcomeView
            )}
            </div>

            {listening && <VoiceGlow overChat={started} />}

            {trayNow.length > 0 && (
              <div className="noor-tray">
                <div className="noor-tray__row" role="group" aria-label={ui.tray.label}>
                {trayNow.map((it, i) => {
                  const act = () => onAction(it.event, it.payload, lastMessage.id);
                  if (it.kind === 'link') return <LinkButton key={`l${i}`} link={it.link} solid={false} />;
                  if (it.kind === 'uaepass') return <UaePassButton key={`u${i}`} label={it.label} onClick={act} />;
                  if (it.kind === 'option')
                    return (
                      <button key={`o${i}`} type="button" className="noor-tray__opt" onClick={act}>
                        <span className="noor-tray__opt-title">{it.label}</span>
                        {it.hint && <span className="noor-tray__opt-hint">{it.hint}</span>}
                      </button>
                    );
                  if (it.kind === 'chip')
                    return (
                      <button key={`c${i}`} type="button" className="noor-suggest__btn" onClick={act}>
                        {it.label}
                      </button>
                    );
                  const cls = it.variant === 'primary' ? 'noor-btn' : it.variant === 'secondary' ? 'noor-btn noor-btn--outline' : 'noor-btn noor-btn--text';
                  return (
                    <button key={`b${i}`} type="button" className={cls} onClick={act}>
                      {it.icon && <ChatIcon name={it.icon} size={16} />}
                      {it.label}
                    </button>
                  );
                })}
                </div>
              </div>
            )}

            <footer className="noor-footer">
              {!started && !v2 && topicsEl}

              {(!v2view || started) && composer}
              <p className="noor-footer__note">{ui.footer}</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
