import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { VoiceGlow } from './VoiceGlow.jsx';
import { MicOrb } from './MicOrb.jsx';
import { makeSampleFile } from '../../lib/sampleFiles.js';
import { resolveHints } from '../../lib/hints.js';
import { recordFeedback } from '../../lib/feedback.js';
import { TopicArt } from './TopicArt.jsx';
import { ImageSlot } from '../ImageSlot.jsx';
import { NoorAvatar } from './NoorAvatar.jsx';
import { NoorMessage } from './NoorMessage.jsx';
import { MiraMessage } from './MiraMessage.jsx';
import { resolveScenario } from '../../lib/noor.js';
import { buildQuestion, buildResult, buildReview, nextStep, parseAnswer, pathOf, purge, reviewRows } from '../../lib/eligibility.js';
import { CONV_KINDS, batchExample, buildApplyConv, buildBatch, buildNudgeConv, looksLikeQuestion, readBatch } from '../../lib/conversation.js';
import { useApplication } from './useApplication.js';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';
import { buildNudge } from '../../lib/application.js';
import { buildStatusReply, parseApplicationId } from '../../lib/status.js';
import { buildNotEligible, buildResumeOffer, buildResumeSummary, readProfile, readResume } from '../../lib/application.js';
import { createKnowledge } from '../../lib/knowledge.js';
import { trayItems } from '../../lib/actionTray.js';
import { LinkButton } from './ActionCard.jsx';
import { UaePassButton } from './UaePassButton.jsx';
import { buildIntake, countFacts, extractFacts, markReceived, placeFiles } from '../../lib/intake.js';
import './Assistant.css';
import './EligibilityFlow.css';
import './AssistantV2.css';

let nextId = 1;
const LEAVE_MS = 200; // welcome → conversation
const CLOSE_MS = 180; // panel back into the launcher
const MIC_PROMPT_MS = 10000; // how long the pop-up over the microphone stays by default, and the orb on it with it
const FOLLOW_MS = 350; // pause before the first question follows its intro

// What a screen reader hears once a reply has finished: the words, then the card titles.
function spokenReply(scenario) {
  const words = scenario.text.flatMap((b) => [b.alert?.title, b.alert?.body, b.lead, b.primary, b.ack, b.question, b.tag, ...(b.items ?? []).map((i) => i.text ?? i), b.how, b.secondary, b.note, b.example]).filter(Boolean).join(' ');
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

export function Assistant({ content, variant = '1', buttonsInside = true, defaultOpen = false, onOpenChange, scenario = 'free' }) {
  const { persona, ui, topics, voice, scenarios, fallback, fallbackGap, afterCheck, eligibility, application, intake, statusCheck, eligibilityCard, knowledge, demo } = content;
  const scenarioName = scenario; // the testing scenario (inside the send function the name `scenario` is the reply being chosen)
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
  const [sizeIdx, setSizeIdx] = useState(0); // the text size: 0 normal, 1 large, 2 extra large
  const [stage, setStage] = useState(null); // stepper: null | check | checkDone | docs | review | complete
  const [awaiting, setAwaiting] = useState(false); // a question is waiting for an answer
  const [statusAwait, setStatusAwait] = useState(false); // Mira has asked for an application ID
  const [micShine, setMicShine] = useState(true); // the mic lights up once when the chat opens (both variations), and once more for the first question (Variation 2 only), then rests
  const [shineRun, setShineRun] = useState(0); // counts the runs, so a new question restarts the effect
  const [ratings, setRatings] = useState({}); // thumbs up / down given to Mira's replies, by message id
  const [transcript, setTranscript] = useState(''); // what is being heard while the microphone is on (shown in the message box as it comes)
  const heard = useRef(''); // the same, readable the moment the stop button is pressed
  const recRef = useRef(null); // the browser's speech recognition, when there is one
  const simRef = useRef(null); // the simulated stream, when there is not
  const simUsed = useRef(false);
  const vtextRef = useRef(null);
  const [micPop, setMicPop] = useState(true); // the pop-up over the microphone on the starting screen
  const questionShone = useRef(false); // the mic lights up for the FIRST question only, not for every one after it
  const micHinted = useRef(false); // the reminder to use the microphone or type has been given once in this conversation
  const askCounts = useRef({}); // testing scenarios: how many times each question has been asked, so a repeat gets the next sample
  const [session, setSession] = useState(0); // counts restarts, so the starting-screen sample is filled again
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
  const anchorRef = useRef(null); // a reply with an outcome card: keep ITS top in view while it is written, instead of the bottom
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
  const [doneIds, setDoneIds] = useState(() => new Set()); // the replies that have been fully shown (a reply behind one that is not done waits for it)
  // Variation 2: the splash (Mira's name inside a drawing gold ring) shows once, when the chat is first opened. A tap or a key skips it.
  const splashSeen = useRef(false);
  const [splash, setSplash] = useState(false);
  const [splashLeaving, setSplashLeaving] = useState(false);
  useEffect(() => {
    if (!open || variant !== '2' || splashSeen.current) return;
    splashSeen.current = true;
    setSplash(true);
  }, [open, variant]);
  const endSplash = () => {
    if (splashLeaving) return;
    setSplashLeaving(true);
    setTimeout(() => {
      setSplash(false);
      setSplashLeaving(false);
    }, reduced ? 0 : 400);
  };
  useEffect(() => {
    if (!splash) return undefined;
    const t = setTimeout(endSplash, reduced ? 1500 : 3800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splash]);
  // The one-time orb is over after about 7 seconds; if the browser never reports the end of its animation (a hidden tab), end it anyway.
  useEffect(() => {
    if (!micShine || !open || splash) return undefined;
    // On the starting screen the orb lasts as long as the pop-up does by default (10 s, MIC_PROMPT_MS); for the first question it is briefer.
    const t = setTimeout(() => setMicShine(false), shineRun === 0 ? MIC_PROMPT_MS + 500 : 8000);
    return () => clearTimeout(t);
  }, [micShine, shineRun, open, splash]);
  useEffect(() => {
    if (!micPop || !open || splash) return undefined;
    const t = setTimeout(() => setMicPop(false), MIC_PROMPT_MS);
    return () => clearTimeout(t);
  }, [micPop, open, session, splash]);
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
      anchorRef.current = null; // the reader is in charge now
      pinned.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    };
    const toBottom = () => {
      // A reply with an outcome card is read from its top: keep its top at the top of the chat while it is written and grows.
      const anchored = anchorRef.current != null ? log.querySelector(`[data-msg="${anchorRef.current}"]`) : null;
      if (anchored) {
        log.scrollTop = anchored.offsetTop - 12; // layout offsets, not on-screen rects: the message may still be sliding in
        lastSet = log.scrollTop;
        return;
      }
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

  // `thumb` is one picture's address, or a list of { url } for the files that were sent (a file that is not a picture has no url
  // and shows a document icon).
  const pushUser = (text, thumb) => {
    pinned.current = true; // sending always jumps to the latest
    anchorRef.current = null;
    setMessages((m) => [...m, { id: nextId++, role: 'user', text, thumb }]);
  };
  const pushNoor = (raw) => {
    // "Use the microphone or type" is said in the first reply that carries it, and left out of every one after (see lib/hints.js).
    const { scenario, had } = resolveHints(raw, !micHinted.current);
    if (had) micHinted.current = true;
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
  const app = useApplication(application, { pushUser, pushNoor, lock, setStage, startCheck: (who) => beginCheck(who), notEligible: (reason) => pushNoor(buildNotEligible(application, reason, fallbackGap.cards.find((c) => c.type === 'support'))) }, { conv });
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
    // (who the card is for, and the applicant's own citizenship or residency, are already known from UAE PASS and the one question)
    const qids = pathOf(answers).filter((q) => answers[q] === undefined);
    if (!qids.length) {
      askNext(answers);
      return;
    }
    const msgId = pushNoor(buildBatch(eligibility, qids, first, answers.who));
    setWaiting({ msgId, batch: true, qids });
  };

  // Starting the application: UAE PASS first (it gives the name, Emirates ID, nationality and contact details), so there is no
  // eligibility check. The only question afterwards is who the card is for (see useApplication.js).
  // The eligibility check, once UAE PASS is done and it is known who the card is for. UAE PASS already says whether the applicant
  // is a citizen or resident, so for "myself" only the report and its issuer are asked; for someone else, their citizenship or
  // residency too. Whatever a first message said is used.
  const presetRef = useRef({});
  const beginCheck = (who) => {
    const answers = purge({ ...presetRef.current, who, ...(who === 'self' ? { status: 'citizen' } : {}) });
    presetRef.current = {};
    flowRef.current = { answers, awaiting: null };
    setWaiting(null);
    setStage('check');
    expandForCheck();
    if (!pathOf(answers).some((q) => answers[q] === undefined)) {
      // a first message already answered everything: the result, with the answers
      const built = buildIntake({ eligibility, copy: intake, answers, docs: docsRef.current, notes: [], hadText: true, fileCount: 0, resultShownFor: resultShown.current });
      if (built.resultFor) {
        resultShown.current = built.resultFor;
        setStage(built.kind === 'eligible' ? 'checkDone' : 'check');
      }
      pushNoor(built.scenario);
      return;
    }
    if (conv) askBatch(answers, true);
    else askNext(answers);
  };

  // Starting (or starting again): UAE PASS first (it gives the name, Emirates ID, nationality and contact details); then who the card
  // is for; then the eligibility check; then the application.
  // The "returning visitor" testing scenario: on starting, Mira first asks whether to continue the application left half done or to
  // start again (asked once per conversation). Continue shows what was entered earlier and asks the next question.
  const resumeRef = useRef({ handled: false, awaiting: false, msgId: null });
  const offerResume = () => {
    if (scenario !== 'returning' || !demo?.saved || resumeRef.current.handled) return false;
    expandForCheck();
    const msgId = pushNoor(buildResumeOffer(application, demo.saved));
    resumeRef.current = { handled: true, awaiting: true, msgId };
    return true;
  };
  const resumeApplication = () => {
    const s = demo.saved;
    app.restore({ who: s.who, data: { ...s.data } });
    flowRef.current = { answers: { ...s.eligibility }, awaiting: null };
    resultShown.current = JSON.stringify(s.eligibility);
    docsRef.current = {};
    pushNoor(buildResumeSummary(application, eligibility, s, reviewRows));
    app.begin(); // the next question
  };

  // Until the person has signed in, the result's closing line says UAE PASS comes next.
  const withSignInHint = (sc) =>
    app.signedIn()
      ? sc
      : {
          ...sc,
          cards: sc.cards.map((c) =>
            c.type === 'result' && c.next
              ? { ...c, next: { ...c.next, hint: c.next.hintSignIn ?? c.next.hint }, mira: c.mira && { ...c.mira, next: { ...c.mira.next, hint: c.mira.next?.hintSignIn ?? c.mira.next?.hint } } }
              : c,
          ),
        };

  const startEligibility = () => {
    if (offerResume()) return;
    expandForCheck();
    app.reset(); // a clean start (also after "not eligible" or a finished application)
    flowRef.current = { answers: {}, awaiting: null };
    app.setWho('self', false);
    pushNoor(buildApplyConv(application, afterCheck.apply, 'self'));
  };

  // A first message that already says things (who it is for, files attached): the files are kept for the documents step, and a
  // statement of who the card is for means that question is not asked.
  // A first message with the person's details (Emirates ID, email, mobile), who it is for, a delivery address and the documents: no UAE PASS.
  // Mira shows the details and asks for whatever is still missing, then the optional questions, then the summary.
  const startFromDetails = (text, files, facts) => {
    expandForCheck();
    const placed = placeFiles(docsRef.current, files);
    docsRef.current = placed.docs;
    flowRef.current = { answers: {}, awaiting: null };
    setWaiting(null);
    pushUser([text, files.map((f) => f.name).join(', ')].filter(Boolean).join(' — '), files.map((f) => ({ url: f.type.startsWith('image/') ? f.url : undefined })));
    attachRef.current = [];
    setAttachments([]);
    app.reset();
    app.prefill(docsRef.current);
    app.startWithDetails({ who: facts.who === 'other' ? 'other' : 'self', deliveryText: text.match(/(?:delivered|delivery)[^.]*?\bto\b\s+([^.]+)/i)?.[1] });
  };

  const startFromMessage = (text, files, facts) => {
    if (scenario === 'returning' && !resumeRef.current.handled) {
      // someone returning: the question of continuing comes first (what the message said is not used)
      pushUser(text || files.map((f) => f.name).join(', '));
      setAttach([]);
      offerResume();
      return;
    }
    expandForCheck();
    const placed = placeFiles(docsRef.current, files);
    docsRef.current = placed.docs;
    flowRef.current = { answers: {}, awaiting: null };
    setWaiting(null);
    setStage('check');
    pushUser([text, files.map((f) => f.name).join(', ')].filter(Boolean).join(' — '), files.map((f) => ({ url: f.type.startsWith('image/') ? f.url : undefined })));
    attachRef.current = [];
    setAttachments([]);
    app.prefill(docsRef.current);
    // what the message already said is kept for the eligibility check (a report file means there is a report)
    presetRef.current = { ...facts, ...(placed.docs.report && facts.report === undefined ? { report: 'yes' } : {}) };
    app.setWho(facts.who, Boolean(facts.who));
    pushNoor(buildApplyConv(application, afterCheck.apply, facts.who));
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
    pushUser([text, files.map((f) => f.name).join(', ')].filter(Boolean).join(' — '), files.map((f) => ({ url: f.type.startsWith('image/') ? f.url : undefined })));
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
    pushNoor(withSignInHint(built.scenario));
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
      case 'ask':
        send(payload);
        break;
      case 'say':
        // A button that says something for the person (Variation 2's reply buttons): it is used once.
        lock(msgId, 'said');
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
  // When nothing fits, the reply depends on the message: about the Ministry (the information has no answer: point to the support
  // team) or not (say what Mira can help with).
  const isFallback = (scenario) => scenario === fallback || scenario === fallbackGap;
  // The words of the buttons (the starting screen's options, and those on a reply that could not answer) are commands: they go
  // to the scripted flow, not to the knowledge base.
  const commands = useMemo(
    () => new Set([...ui.landing.items.map((i) => i.label), ...[fallback, fallbackGap, afterCheck.later].flatMap((s) => s.cards.filter((x) => x.type === 'actions').flatMap((x) => x.buttons.map((b) => b.label)))]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const replyFor = (text) => {
    const scripted = resolveScenario(text, scenarios, fallback);
    if (commands.has(text.trim()) && scripted !== fallback) {
      kbService.current = null;
      return scripted;
    }
    const hit = kb.answer(text, { service: kbService.current });
    let scenario = scripted;
    if (hit && (hit.kind === 'smalltalk' || (hit.kind === 'service' && hit.strength >= 2))) scenario = hit.scenario;
    else if (['apply', 'track', 'ask', 'askElse'].includes(scripted.id)) scenario = scripted;
    else if (hit && hit.strength >= 2) scenario = hit.scenario;
    else if (scripted === fallback && hit) scenario = hit.scenario;
    if (hit && scenario === hit.scenario) {
      if (hit.kind === 'service') kbService.current = hit.serviceId;
      else if (hit.kind !== 'clarify') kbService.current = null;
    } else kbService.current = null;
    return scenario === fallback && fallbackGap.related.test(text) ? fallbackGap : scenario;
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
        if (resumeRef.current.awaiting) {
          const choice = readResume(application, text);
          if (choice) {
            resumeRef.current.awaiting = false;
            lock(resumeRef.current.msgId, 'answered');
            pushUser(text);
            if (choice === 'continue') resumeApplication();
            else startEligibility();
            return;
          }
        }
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
        // Files, or a message that already tells Mira two or more of the answers: read it all at once.
        const facts = extractFacts(text);
        if (!app.signedIn() && (files.length || (countFacts(facts) >= 2 && !open && !statusRef.current) || (readProfile(text).eid && readProfile(text).email))) {
          // The first message already gives details, or files: with all the details in it there is no UAE PASS; otherwise UAE PASS comes
          // first and what was said is kept. (There is no eligibility result: eligibility is found out as the application goes.)
          const given = readProfile(text);
          if (scenarioName === 'returning' && !resumeRef.current.handled) startFromMessage(text, files, facts); // the question of continuing comes first
          else if (given.eid && given.email && given.mobile) startFromDetails(text, files, facts); // the details are all in the message: no UAE PASS
          else startFromMessage(text, files, facts); // UAE PASS first; what was said is kept
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
          if (isFallback(scenario)) {
            pushUser(text);
            pushNoor(buildNudge(statusCheck.invalid));
            return;
          }
          // Something else was asked: leave the ID question and answer that instead.
          statusRef.current = false;
          setStatusAwait(false);
        }
        if (app.handleText(text, { known: !isFallback(scenario) })) return;
        pushUser(text);
        if (scenario.then === 'startEligibility') {
          // The sign-in message opens with its own line ("Great, let’s begin your application."), so no intro before it.
          startEligibility();
          return;
        }
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
    [busy, leaving, started, reduced, scenarios, fallback, scenario],
  );

  // ---- Testing scenarios: pre-fill the message box (see content/demo.en.js) --------------------------------------------
  // Puts a sample in the box (and the sample documents on it), ready to send. Anything the person has already typed is kept.
  const fillBox = (entry) => {
    const text = typeof entry === 'string' ? entry : entry.text ?? '';
    if (text) setDraft((d) => (d.trim() ? d : text));
    const kinds = typeof entry === 'string' ? [] : entry.files ?? [];
    if (!kinds.length) return;
    Promise.all(kinds.map(makeSampleFile)).then((files) =>
      setAttach(files.map((file) => ({ file, name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) }))),
    );
  };

  // The sample for the question that is being asked: the first time its own first sample, a repeat the next one.
  const sampleFor = (key) => {
    if (['free', 'returning', 'offtopic', 'gap'].includes(scenario)) return; // nothing is pre-filled for the application's questions
    if (key === 'batch') {
      // the eligibility questions that are being asked, answered in one sentence
      const w = flowRef.current.awaiting;
      if (w?.qids) fillBox(batchExample(eligibility, w.qids, flowRef.current.answers.who));
      return;
    }
    const set = demo?.samples?.[key];
    const list = set?.[scenario] ?? set?.default;
    if (!list?.length) return;
    const n = (askCounts.current[key] ?? -1) + 1;
    askCounts.current[key] = n;
    fillBox(list[Math.min(n, list.length - 1)]);
  };

  // Which question a finished reply is waiting on, if any.
  const questionKey = (msgId) => {
    const waiting = flowRef.current.awaiting;
    if (waiting?.msgId === msgId && waiting.batch) return 'batch';
    const a = appRef.current?.awaiting;
    if (a?.msgId !== msgId) return null;
    if (a.kind === 'who' || a.kind === 'detected' || a.kind === 'status') return a.kind;
    if (a.kind === 'docs') return 'documents';
    if (a.kind === 'confirm') return 'confirm';
    return a.kind === 'multi' ? a.group : null;
  };

  const onStage = (st, scenario, msgId) => {
    setThinking(st === 'thinking' || st === 'tool');
    if (st === 'done') setDoneIds((s) => (s.has(msgId) ? s : new Set(s).add(msgId)));
    const hasResult = scenario.cards?.some((card) => card.type === 'result' || card.type === 'submitted');
    // A tall outcome card should open at its heading: stop following the bottom for this reply, and keep the top of the reply in
    // view from the moment it starts (the reader would otherwise be left looking at their own message while it is written below)…
    if (hasResult && st === 'thinking') {
      pinned.current = false;
      anchorRef.current = msgId;
      later(() => {
        const log = logRef.current;
        const el = log?.querySelector(`[data-msg="${msgId}"]`);
        if (log && el) log.scrollTop = el.offsetTop - 12;
      }, 30);
    }
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
      if (conv) {
        const key = questionKey(msgId);
        if (key) sampleFor(key);
      }
      setBusy(false);
      setAnnouncement(spokenReply(scenario));
      if (scenario.then === 'startEligibility' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        later(startEligibility, reduced ? 0 : FOLLOW_MS);
      }
      // The first question that waits for an answer: the mic lights up once to point to it (Variation 2). Later questions do not.
      if (v2 && !questionShone.current && (flowRef.current.awaiting?.msgId === msgId || appRef.current?.awaiting?.msgId === msgId)) {
        questionShone.current = true;
        setShineRun((n) => n + 1);
        setMicShine(true);
      }
      if (scenario.then === 'resume' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        later(() => {
          if (flowRef.current.awaiting?.batch) pushNoor({ id: 'check:resume', tool: null, text: [{ question: eligibility.batch.resume }], cards: [] });
          else appRef.current?.resume();
        }, reduced ? 0 : FOLLOW_MS);
      }
      if (scenario.then === 'afterSignIn' && !followed.current.has(msgId)) {
        followed.current.add(msgId);
        // Let the details finish arriving before the first question.
        later(() => app.next({ first: true }), reduced ? 0 : application.signIn.profile.rows.length * 420 + 1400);
      }
    }
  };

  // ---- Voice: speech to text, streamed into the message box as it is heard ------------------------------------------------
  // Nobody has to speak: pressing the microphone writes out the sample answer for the question that is open, word by word, as if it
  // were being said (as the team's prototype does), then listening ends and the text waits in the message box. The browser's own
  // speech recognition is not used and no microphone is asked for. Nothing is sent anywhere by this code.
  const sampleSaid = () => {
    const waiting = flowRef.current.awaiting;
    return app.voiceSample ?? (statusRef.current ? statusCheck.voiceSample : waiting?.batch ? batchExample(eligibility, waiting.qids, flowRef.current.answers.who) : waiting ? eligibility.questions[waiting.qid].voiceSample : voice.transcript);
  };

  const showHeard = (text) => {
    heard.current = text;
    setTranscript(text);
  };

  const startSimulated = () => {
    simUsed.current = true;
    clearInterval(simRef.current);
    const words = sampleSaid().split(' ');
    let i = 0;
    simRef.current = setInterval(() => {
      i += 1;
      showHeard(words.slice(0, i).join(' '));
      if (i >= words.length) {
        // The answer is complete: a moment later listening ends by itself and the text waits in the message box.
        clearInterval(simRef.current);
        simRef.current = setTimeout(() => stopListening(), 1100);
      }
    }, 260);
  };

  const stopListening = () => {
    // What was heard lands in the message box; the person decides whether to send it. (If the simulated stream was used and the
    // stop came before any word, the whole sample answer is used.)
    const said = heard.current.trim() || (simUsed.current ? sampleSaid() : '');
    setListening(false);
    if (said) setDraft((d) => (d.trim() ? `${d.trim()} ${said}` : said));
    focusInput();
  };

  const startListening = () => {
    if (busy || listening || leaving) return;
    setMicPop(false);
    showHeard('');
    simUsed.current = false;
    setListening(true); // ends by itself once the sample answer has been written out, or when the person presses stop
    startSimulated();
  };

  // Whenever listening ends (stop, close, restart), the recognition and the simulated stream end with it.
  useEffect(() => {
    if (listening) return undefined;
    clearInterval(simRef.current);
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recRef.current = null;
    return undefined;
  }, [listening]);

  // The newest words stay in view as the text grows.
  useEffect(() => {
    if (vtextRef.current) vtextRef.current.scrollTop = vtextRef.current.scrollHeight;
  }, [transcript]);

  // Thumbs up / down on a reply (null takes the rating back). Kept by lib/feedback.js.
  const rate = (m, rating) => {
    setRatings((r) => ({ ...r, [m.id]: rating }));
    recordFeedback({ rating, variant, conversation: session, messageId: m.id, replyId: m.scenario.id, reply: spokenReply(m.scenario).slice(0, 300) });
  };
  const lastNoorId = [...messages].reverse().find((x) => x.role === 'noor')?.id;

  const restart = () => {
    timers.current.forEach(clearTimeout);
    flowRef.current = { answers: {}, awaiting: null };
    docsRef.current = {};
    resultShown.current = null;
    statusRef.current = false;
    resumeRef.current = { handled: false, awaiting: false, msgId: null };
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
    setMicShine(true);
    setMicPop(true);
    questionShone.current = false;
    askCounts.current = {};
    setRatings({});
    micHinted.current = false;
    setSession((n) => n + 1);
    anchorRef.current = null;
    focusInput();
  };

  // Switching the testing scenario starts the conversation again, so it begins from the right place.
  const lastScenario = useRef(scenario);
  useEffect(() => {
    if (lastScenario.current === scenario) return;
    lastScenario.current = scenario;
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // The "everything up front" scenario starts with everything already in the box and the documents attached.
  useEffect(() => {
    if (open && !started && demo?.landing?.[scenario]) fillBox(demo.landing[scenario]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scenario, session]);

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
  // The hint in the message box is the same for every question ("Speak or type your answer…"); it does not change with the question.
  const questionOpen = Boolean(app.awaiting) || statusAwait || awaiting;
  const placeholder = attachments.length ? ui.attach.placeholder : questionOpen ? ui.input.answer : started ? ui.input.conversation : v2 ? ui.input.welcomeV2 : ui.input.welcome;
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
              {listening && (
                <p className="noor-listen" role="status">
                  <span className="noor-listen__dot" aria-hidden="true" />
                  {ui.listeningStatus.replace('{name}', persona.name)}
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
                      <span className="noor-vtext" ref={vtextRef} aria-hidden="true">
                        {transcript ? (
                          <>
                            {transcript}
                            <span className="noor-caret" aria-hidden="true" />
                          </>
                        ) : (
                          <span className="noor-vtext__hint">{ui.listening}</span>
                        )}
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
                      onChange={(e) => {
                        setDraft(e.target.value);
                        setMicPop(false);
                      }}
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
                          <ChatIcon name={v2 ? 'clip' : 'attach'} size={20} weight={v2 ? 1.5 : 1.6} />
                        </button>
                      </>
                    )}
                    <span className="noor-mic-wrap">
                      <button
                        type="button"
                        className={`noor-mic${micShine ? ` is-shine${shineRun > 0 ? ' is-brief' : ''}` : ''}`}
                        aria-label={ui.actions.mic}
                        aria-disabled={blocked || undefined}
                        onClick={startListening}
                        onAnimationEnd={(e) => e.animationName === 'noor-mic-shine' && setMicShine(false)}
                      >
                        <span className="noor-mic__icon">
                          <ChatIcon name="mic" size={20} />
                          {/* the shimmer: a second, lighter copy of the icon, shown only through a band that sweeps across it */}
                          {!micShine && !reduced && (
                            <span className="noor-mic__sheen" aria-hidden="true">
                              <ChatIcon name="mic" size={20} />
                            </span>
                          )}
                        </span>
                        {micShine && !reduced && !splash && <MicOrb key={shineRun} />}
                      </button>
                      {micPop && !started && !splash && (
                        <div className="noor-mic-pop" role="status" style={{ '--pop-ms': `${MIC_PROMPT_MS - 600}ms` }}>
                          <p>
                            <strong>{ui.micPop.title}</strong> {ui.micPop.text}
                          </p>
                          <span className="noor-mic-pop__bar" aria-hidden="true">
                            <i />
                          </span>
                        </div>
                      )}
                    </span>
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
  // Variation 2: the three services are small quick-starts under the greeting, not the main thing on screen.
  const quickEl = (
    <div className={`noor-quick${leaving ? ' is-leaving' : ''}${listening ? ' is-muted' : ''}`} inert={listening || undefined}>
      <div className="noor-quick__row" role="group" aria-label={welcomeCopy.quickLabel}>
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
  const hour = new Date().getHours();
  const greeting = ui.landing.greetings[hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'];
  const heroEl = (
    <div className="noor-welcome__hero">
      {!v2view && <span className="noor-welcome__glow" aria-hidden="true" />}
      <NoorAvatar src={persona.avatar} size={v2view ? 60 : 76} ring={!v2view} state={avatarState} className="noor-welcome__avatar" />
    </div>
  );
  // One word or two of the greeting carry the accent colour (Variation 2).
  const titleText = listening ? ui.listening : welcomeCopy.title;
  const accent = v2view && welcomeCopy.titleAccent && titleText.endsWith(welcomeCopy.titleAccent) ? welcomeCopy.titleAccent : null;
  const titleEl = (
    <h2 className="noor-welcome__title" key={listening ? 'listening' : 'idle'}>
      {accent ? (
        <>
          {titleText.slice(0, -accent.length)}
          <span className="noor-welcome__accent">{accent}</span>
        </>
      ) : (
        titleText
      )}
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
        // Variation 2: the greeting reads left to right, with the quick-starts right under it (the message box stays at the bottom).
        <div className="noor-home">
          <div className="noor-mesh" aria-hidden="true">
            <i /><i /><i />
          </div>
          <div className="noor-home__pattern" aria-hidden="true" />
          <div className="noor-home__wrap">
            <NoorAvatar src={persona.avatar} size={60} state={avatarState} className="noor-home__avatar" />
            <div className="noor-home__greet">
              <div className="noor-home__k">{greeting}</div>
              <h2>{ui.landing.title}</h2>
              <p>{ui.landing.subtitle}</p>
            </div>
            <div className="noor-home__list" role="group" aria-label={ui.landing.title}>
              {ui.landing.items.map((it) => (
                <button key={it.id} type="button" className="noor-home__item" aria-disabled={blocked || undefined} onClick={() => send(it.label)}>
                  <span className="noor-home__ic">
                    <ChatIcon name={it.icon} size={21} weight={1.5} />
                  </span>
                  <span className="noor-home__tx">
                    <b>{it.label}</b>
                    <span>{it.description}</span>
                  </span>
                  <ChatIcon name="arrowRight" size={18} weight={1.5} />
                </button>
              ))}
            </div>
          </div>
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
        <div className={`noor-shell${expanded ? ' is-expanded' : ''}${closing ? ' is-closing' : ''}`} style={{ '--noor-text-scale': ui.textSize.scales[sizeIdx] }}>
          <div className="noor-pose" aria-hidden="true">
            <ImageSlot file={pose} decorative fit="contain" />
          </div>
          <div
            className={`noor-panel${v2 && !started ? ' is-landing' : ''}`}
            role="dialog"
            aria-label={ui.panelLabel}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
            }}
          >
            <div className="visually-hidden" aria-live="polite" aria-atomic="true">
              {announcement}
            </div>

            {splash && (
              <button type="button" className={`noor-splash${splashLeaving ? ' is-leaving' : ''}`} onClick={endSplash} aria-label={ui.splash.skip}>
                <span className="noor-mesh" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="noor-splash__inner">
                  <span className="noor-splash__av">
                    <svg viewBox="0 0 124 124" aria-hidden="true">
                      <circle className="r1" cx="62" cy="62" r="58" />
                      <circle className="r2" cx="62" cy="62" r="58" />
                    </svg>
                    <NoorAvatar src={persona.avatar} size={100} />
                  </span>
                  <span className="noor-splash__hello">{ui.splash.hello}</span>
                  <span className="noor-splash__name">{persona.name}</span>
                  <span className="noor-splash__sub">{ui.splash.sub}</span>
                  <span className="noor-splash__voice">
                    <ChatIcon name="mic" size={16} weight={1.6} />
                    {ui.splash.voice}
                  </span>
                </span>
                <span className="noor-splash__skip">{ui.splash.skip}</span>
              </button>
            )}
            <header className="noor-header">
              <NoorAvatar src={persona.avatar} size={44} state={avatarState} />
              <div className="noor-header__text">
                <p className="noor-header__name">{persona.name}</p>
                <p className="noor-header__sub">{persona.subtitle}</p>
              </div>
              <button
                type="button"
                className="noor-icon-btn noor-aa"
                aria-label={ui.textSize.label.replace('{size}', ui.textSize.sizes[sizeIdx])}
                onClick={() => setSizeIdx((i) => (i + 1) % ui.textSize.scales.length)}
              >
                {ui.textSize.button}
              </button>
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

            <div className="noor-stage">
            {started ? (
              <div key="log" className="noor-log" ref={logRef} role="log" aria-live="off" aria-label="Conversation">
                <div className="noor-log__inner" ref={innerRef}>
                  <p className="noor-log__day">{ui.today}</p>
                  {messages.map((m, mi) =>
                    m.role === 'user' ? (
                      <div className="noor-msg noor-msg--user" key={m.id}>
                        <div className="noor-bubble noor-bubble--user">
                          <span className="visually-hidden">{ui.announce.youSaid}</span>
                          {(Array.isArray(m.thumb) ? m.thumb : m.thumb ? [{ url: m.thumb }] : []).length > 0 && (
                            <span className="noor-bubble__thumbs">
                              {(Array.isArray(m.thumb) ? m.thumb : [{ url: m.thumb }]).map((t, i) =>
                                t.url ? (
                                  <img className="noor-bubble__thumb" key={i} src={t.url} alt="" />
                                ) : (
                                  <span className="noor-bubble__thumb noor-bubble__thumb--file" key={i} aria-hidden="true">
                                    <ChatIcon name="file" size={28} weight={1.4} />
                                  </span>
                                )
                              )}
                            </span>
                          )}
                          {m.text}
                        </div>
                      </div>
                    ) : v2 ? (
                      <MiraMessage
                        key={m.id}
                        msgId={m.id}
                        scenario={m.scenario}
                        avatar={persona.avatar}
                        name={persona.name}
                        head={messages[mi - 1]?.role !== m.role}
                        queued={mi > 0 && messages[mi - 1].role === m.role && !doneIds.has(messages[mi - 1].id)}
                        labels={ui.announce}
                        copy={{ thinking: ui.thinking, example: ui.example, answers: ui.answers }}
                        chosen={m.chosen}
                        tray={!buttonsInside}
                        feedback={ui.feedback}
                        rating={ratings[m.id]}
                        latest={m.id === lastNoorId}
                        onRate={messages[mi + 1] && messages[mi + 1].role !== 'user' ? undefined : (rating) => rate(m, rating)}
                        onStage={(st, sc) => onStage(st, sc, m.id)}
                        onAction={(event, payload) => onAction(event, payload, m.id)}
                      />
                    ) : (
                      <NoorMessage
                        key={m.id}
                        msgId={m.id}
                        queued={mi > 0 && messages[mi - 1].role === m.role && !doneIds.has(messages[mi - 1].id)}
                        scenario={m.scenario}
                        avatar={persona.avatar}
                        labels={ui.announce}
                        chosen={m.chosen}
                        tray={!buttonsInside}
                        feedback={ui.feedback}
                        rating={ratings[m.id]}
                        latest={m.id === lastNoorId}
                        onRate={messages[mi + 1] && messages[mi + 1].role !== 'user' ? undefined : (rating) => rate(m, rating)}
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

            {listening && <VoiceGlow overChat={started} said={transcript} />}

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

              {composer}
              <p className="noor-footer__note">{ui.footer}</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
