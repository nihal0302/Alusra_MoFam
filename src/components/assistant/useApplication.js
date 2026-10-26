import { useRef, useState } from 'react';
import {
  ORDER,
  buildNudge,
  buildPrompt,
  buildReview,
  buildSignIn,
  buildSigningIn,
  buildSubmitted,
  fill,
  matchEmirate,
  newReference,
  normalisePhone,
  validName,
} from '../../lib/application.js';
import {
  DETAILS,
  buildDetailsAsk,
  buildDocsAsk,
  buildNudgeConv,
  buildResume,
  buildReviewConv,
  buildSignInConv,
  joinList,
  looksLikeQuestion,
  parseNo,
  parseYes,
  readDetails,
  readEditTarget,
} from '../../lib/conversation.js';
import { classifyFile } from '../../lib/intake.js';

const CONV_KINDS = ['multi', 'docs', 'confirm'];

// The application, in the conversation: UAE PASS sign-in → details fetched → a few questions →
// two uploads → review → consent and submit. Everything is held in memory; nothing leaves the device.
// `api` is the small set of chat actions the assistant gives us.
// With `conv` (Variation 2) the same steps run as a conversation: the questions are asked together and answered in
// free text, documents are attached to the chat, and the review is a sentence that can be changed by typing.
export function useApplication(app, api, { conv = false } = {}) {
  const ref = useRef({ data: {}, awaiting: null, returnToReview: false });
  const signing = useRef(null); // timer while the simulated UAE PASS approval is pending
  const [awaitingInfo, setAwaitingInfo] = useState(null);

  const setAwait = (a) => {
    ref.current.awaiting = a;
    setAwaitingInfo(a ? { kind: a.kind, step: a.step, msgId: a.msgId, placeholder: a.placeholder ?? app.steps[a.step].placeholder } : null);
  };

  const review = (updated = []) => {
    api.setStage('review');
    if (conv) {
      const msgId = api.pushNoor(buildReviewConv(app, ref.current.data, { updated }));
      setAwait({ kind: 'confirm', step: 'review', msgId, placeholder: app.conv.review.placeholder, voiceSample: app.conv.review.voiceSample });
      return;
    }
    setAwait(null);
    api.pushNoor(buildReview(app, ref.current.data));
  };

  const ask = (step, opts) => {
    // The photograph is asked first; if the report is already in (sent earlier in the chat), say only one is left.
    const hasOther = step === 'photo' && Boolean(ref.current.data.report);
    const scenario = buildPrompt(app, step, { ...opts, hasOther });
    // Variation 2 never offers the emirate as buttons: it is typed, like the other details.
    if (conv) scenario.cards = scenario.cards.filter((c) => c.type !== 'choices');
    const msgId = api.pushNoor(scenario);
    setAwait({ step, msgId, kind: app.steps[step].kind, ...(conv && step === 'emirate' ? { placeholder: app.conv.editPlaceholder } : {}) });
  };

  // ---- Conversational steps (Variation 2) ----
  const askDetails = (opts) => {
    const msgId = api.pushNoor(buildDetailsAsk(app, ref.current.data, opts));
    setAwait({ kind: 'multi', step: 'details', msgId, placeholder: app.conv.placeholder, voiceSample: app.conv.voiceSample });
  };

  const askDocs = (opts) => {
    const msgId = api.pushNoor(buildDocsAsk(app, ref.current.data, opts));
    setAwait({ kind: 'docs', step: 'docs', msgId, placeholder: app.conv.docs.placeholder, voiceSample: app.conv.docs.voiceSample });
  };

  // Whatever is still missing, in the order a person would give it: the three details, then the two documents, then the review.
  const convNext = (opts = {}) => {
    const d = ref.current.data;
    if (DETAILS.some((k) => !d[k])) askDetails(opts);
    else if (!d.photo || !d.report) askDocs(opts);
    else review(opts.updated);
  };

  const next = () => {
    if (conv) {
      convNext();
      return;
    }
    const step = ORDER.find((s) => !ref.current.data[s]);
    if (step) ask(step);
    else review();
  };

  const afterAnswer = (noted = []) => {
    if (ref.current.returnToReview) {
      ref.current.returnToReview = false;
      review();
    } else if (conv) {
      convNext({ noted });
    } else {
      next();
    }
  };

  const store = (field, value) => {
    ref.current.data = { ...ref.current.data, [field]: value };
  };

  // Documents sent earlier in the chat (with the eligibility details) are used here, so they are not asked for again.
  const prefill = (docs) => {
    const { photo, report } = docs;
    ref.current.data = {
      ...ref.current.data,
      ...(photo ? { photo: { name: photo.name, size: photo.size, type: photo.type, url: photo.url } } : {}),
      ...(report ? { report: { name: report.name, size: report.size, type: report.type, url: report.url } } : {}),
    };
  };

  const reset = () => {
    clearTimeout(signing.current);
    signing.current = null;
    Object.values(ref.current.data).forEach((v) => v?.url && URL.revokeObjectURL(v.url));
    ref.current = { data: {}, awaiting: null, returnToReview: false };
    setAwaitingInfo(null);
  };

  const submit = (msgId, label) => {
    api.lock(msgId, 'submitted');
    api.pushUser(label);
    api.setStage('complete');
    setAwait(null);
    api.pushNoor(buildSubmitted(app, newReference()));
  };

  // Events from cards. Returns true when handled.
  const handle = (event, payload, msgId) => {
    switch (event) {
      case 'uaepass':
        api.lock(msgId, 'signedIn');
        api.pushUser(payload.label);
        api.pushNoor(buildSigningIn(app));
        // Simulated approval: after the wait, the details arrive exactly as before.
        signing.current = setTimeout(() => {
          signing.current = null;
          api.setStage('docs');
          if (conv) {
            const id = api.pushNoor(buildSignInConv(app, ref.current.data));
            setAwait({ kind: 'multi', step: 'details', msgId: id, placeholder: app.conv.placeholder, voiceSample: app.conv.voiceSample });
          } else {
            api.pushNoor(buildSignIn(app));
          }
        }, app.signIn.wait.ms);
        return true;
      case 'choice':
        api.lock(msgId, payload.value);
        store(payload.field, payload.value);
        api.pushUser(payload.value);
        afterAnswer([payload.field]);
        return true;
      case 'upload': {
        const { field, file } = payload;
        const info = { name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) };
        api.lock(msgId, info);
        store(field, info);
        api.pushUser(`${app.steps[field].label}: ${file.name}`, info.type.startsWith('image/') ? info.url : undefined);
        afterAnswer();
        return true;
      }
      case 'editField':
        api.lock(msgId, 'editing');
        api.pushUser(`${app.review.change}: ${app.review.labels[payload.field]}`);
        ref.current.returnToReview = true;
        ask(payload.field, { changing: true });
        return true;
      case 'submit':
        submit(msgId, payload.label);
        return true;
      default:
        return false;
    }
  };

  // Typed or spoken text in the conversational steps. Returns true when it was consumed.
  const convText = (text, aw, known) => {
    const d = ref.current.data;
    const options = app.steps.emirate.options;
    const question = looksLikeQuestion(text);

    if (aw.kind === 'multi') {
      if (question && known) return false; // a real question gets answered first
      const found = readDetails(text, options, d);
      const keys = Object.keys(found);
      if (!keys.length) {
        if (known) return false;
        const list = joinList(DETAILS.filter((k) => !d[k]).map((k) => app.conv.ask[k]));
        api.pushUser(text);
        api.pushNoor(buildNudgeConv(app.conv.nudgeLead, fill(app.conv.nudge, { list }), app.conv.example));
        return true;
      }
      api.lock(aw.msgId, 'answered');
      api.pushUser(text);
      ref.current.data = { ...d, ...found };
      afterAnswer(keys);
      return true;
    }

    if (aw.kind === 'docs') {
      if (known) return false;
      api.pushUser(text);
      api.pushNoor(buildNudgeConv(app.conv.nudgeLead, app.conv.docs.nudge));
      return true;
    }

    // confirm: yes submits, or something is changed by typing
    if (parseYes(text)) {
      submit(aw.msgId, text);
      return true;
    }
    if (parseNo(text)) {
      api.pushUser(text);
      api.pushNoor(buildNudgeConv(app.conv.review.holdLead, app.conv.review.hold, app.conv.review.example));
      return true;
    }
    if (question && known) return false;
    const target = readEditTarget(text);
    if (target) {
      api.lock(aw.msgId, 'editing');
      api.pushUser(text);
      ref.current.returnToReview = true;
      ask(target, { changing: true });
      return true;
    }
    const found = readDetails(text, options, d, true);
    const keys = Object.keys(found);
    if (!keys.length) {
      if (known) return false;
      api.pushUser(text);
      api.pushNoor(buildNudgeConv(app.conv.review.nudgeLead, app.conv.review.nudge, app.conv.review.example));
      return true;
    }
    api.lock(aw.msgId, 'updated');
    api.pushUser(text);
    ref.current.data = { ...d, ...found };
    review(keys.map((k) => fill(app.conv.review.changed[k], { v: found[k] })));
    return true;
  };

  // Typed or spoken text while a question is open. Returns true when it was consumed.
  const handleText = (text, { known }) => {
    if (signing.current) return true; // waiting for UAE PASS: ignore typing rather than derail the sign-in
    const aw = ref.current.awaiting;
    if (!aw) return false;
    if (conv && CONV_KINDS.includes(aw.kind)) return convText(text, aw, known);
    const step = app.steps[aw.step];

    if (step.kind === 'text') {
      const value = aw.step === 'emergencyPhone' ? normalisePhone(text) : validName(text) ? text.trim() : null;
      api.pushUser(text);
      if (!value) {
        api.pushNoor(buildNudge(step.error));
        return true;
      }
      store(aw.step, value);
      afterAnswer([aw.step]);
      return true;
    }

    if (step.kind === 'choice') {
      const hit = matchEmirate(text, step.options);
      if (hit) {
        api.lock(aw.msgId, hit);
        store(aw.step, hit);
        api.pushUser(text);
        afterAnswer([aw.step]);
        return true;
      }
    }

    // A real question (who can apply, documents…) still gets answered normally.
    if (known) return false;
    api.pushUser(text);
    api.pushNoor(buildNudge(step.kind === 'choice' ? (conv ? app.conv.nudgeEmirate : app.nudges.choice) : app.upload.nudge));
    return true;
  };

  // Files attached to a message in the conversational steps: sorted into photograph and report, and read together
  // with any details typed alongside them. `files` are the chosen attachments ({ file, name, size, type }).
  const handleFiles = (files, text) => {
    const aw = ref.current.awaiting;
    let d = { ...ref.current.data };
    const got = [];
    const wrong = [];
    let setAside = false;
    for (const f of files) {
      const kind = classifyFile(f);
      if (got.includes(kind) || wrong.includes(kind)) {
        setAside = true;
        continue;
      }
      if (!app.steps[kind].upload.types.includes(f.type)) {
        wrong.push(kind);
        continue;
      }
      d = { ...d, [kind]: { name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f.file) } };
      got.push(kind);
    }
    const found = aw.kind === 'multi' && text ? readDetails(text, app.steps.emirate.options, d) : {};
    d = { ...d, ...found };
    ref.current.data = d;
    const firstImage = got.includes('photo') ? d.photo.url : undefined;
    api.pushUser([text, files.map((f) => f.name).join(', ')].filter(Boolean).join(' — '), firstImage);
    api.lock(aw.msgId, aw.kind === 'docs' ? 'received' : aw.kind === 'confirm' ? 'updated' : found.emirate ?? undefined);

    const prefix = [...wrong.map((k) => app.conv.docs.wrongType[k]), ...(setAside ? [app.conv.docs.extra] : [])].join(' ');
    const noted = Object.keys(found);
    if (aw.kind === 'confirm') {
      review(got.map((k) => app.conv.docs.yourNames[k]));
      return;
    }
    const opts = { noted, docs: got, prefix };
    if (DETAILS.some((k) => !d[k])) askDetails(opts);
    else if (!d.photo || !d.report) askDocs(opts);
    else review();
  };

  // After a question was answered mid-application, bring the person back to where they were.
  const resume = () => {
    const aw = ref.current.awaiting;
    if (!conv || !aw) return;
    const scenario = buildResume(app, aw.kind, ref.current.data);
    if (scenario) api.pushNoor(scenario);
  };

  return {
    handle,
    handleText,
    handleFiles,
    resume,
    reset,
    prefill,
    next,
    awaiting: awaitingInfo,
    voiceSample: ref.current.awaiting ? ref.current.awaiting.voiceSample ?? app.steps[ref.current.awaiting.step]?.voiceSample : null,
  };
}
