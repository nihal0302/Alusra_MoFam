import { useRef, useState } from 'react';
import { buildNudge, buildPrompt, buildSignIn, buildSigningIn, buildSubmitted, fill, newReference } from '../../lib/application.js';
import {
  CONV_KINDS,
  GROUPS,
  buildDocsAsk,
  buildEditAsk,
  buildGroupAsk,
  buildNudgeConv,
  buildResume,
  buildReviewConv,
  buildSignInConv,
  joinList,
  looksLikeQuestion,
  matchOption,
  nextGroup,
  parseNo,
  parseSkip,
  parseYes,
  readEditField,
  readGroup,
  readSingle,
  subject,
} from '../../lib/conversation.js';
import { classifyFile } from '../../lib/intake.js';
import { buildReviewSteps, buildStepPrompt, isOptional, nextStep, readStepAnswer } from '../../lib/stepwise.js';

const EXTRA_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// The application, in the conversation: UAE PASS sign-in → details fetched → a few questions →
// two uploads → review → consent and submit. Everything is held in memory; nothing leaves the device.
// `api` is the small set of chat actions the assistant gives us.
// Variation 1 asks the Ministry's form one question at a time (lib/stepwise.js): a short list as buttons, anything else typed or
// spoken, optional questions with a Skip button, the two documents as upload cards, and a review card with Change on each answer.
// With `conv` (Variation 2) the same journey runs as a conversation: the form is asked in groups of two or three questions,
// answered in free text, documents are attached to the chat, and the review is a sentence that can be changed by typing.
export function useApplication(app, api, { conv = false } = {}) {
  const ref = useRef({ data: {}, awaiting: null, returnToReview: false, settled: new Set(), who: 'self' });
  const signing = useRef(null); // timer while the simulated UAE PASS approval is pending
  const [awaitingInfo, setAwaitingInfo] = useState(null);

  const setAwait = (a) => {
    ref.current.awaiting = a;
    setAwaitingInfo(a ? { kind: a.kind, step: a.step, group: a.group, msgId: a.msgId, placeholder: a.placeholder ?? app.steps[a.step]?.placeholder } : null);
  };

  const ctx = () => ({ who: ref.current.who, conv: app.conv });
  const settle = (group) => ref.current.settled.add(group);

  const review = (updated = []) => {
    api.setStage('review');
    if (conv) {
      const msgId = api.pushNoor(buildReviewConv(app, { who: ref.current.who, data: ref.current.data, updated }));
      setAwait({ kind: 'confirm', step: 'review', msgId, placeholder: app.conv.review.placeholder, voiceSample: app.conv.review.voiceSample });
      return;
    }
    setAwait(null);
    api.pushNoor(buildReviewSteps(app, { who: ref.current.who, data: ref.current.data }));
  };

  const ask = (step, opts = {}) => {
    if (!conv) {
      const msgId = api.pushNoor(buildStepPrompt(app, step, { who: ref.current.who, data: ref.current.data, ...opts }));
      setAwait({ step, msgId, kind: app.steps[step].kind });
      return;
    }
    // The photograph is asked first; if the report is already in (sent earlier in the chat), say only one is left.
    const hasOther = step === 'photo' && Boolean(ref.current.data.report);
    const scenario = buildPrompt(app, step, { ...opts, hasOther });
    // Variation 2 asks for a replacement file with the form's own wording.
    if (step === 'photo' || step === 'report') {
      scenario.text[0].primary = app.conv.docs.editPrompt[step];
      if (scenario.cards[0]) scenario.cards[0] = { ...scenario.cards[0], hint: app.conv.docs.card.items[step].hint };
    }
    const msgId = api.pushNoor(scenario);
    setAwait({ step, msgId, kind: app.steps[step].kind });
  };

  // ---- Conversational steps (Variation 2) ----
  const askGroup = (id, opts = {}) => {
    if (id === 'documents') {
      const msgId = api.pushNoor(buildDocsAsk(app, { who: ref.current.who, data: ref.current.data, ...opts }));
      setAwait({ kind: 'docs', group: 'documents', step: 'docs', msgId, placeholder: app.conv.docs.placeholder, voiceSample: app.conv.docs.voiceSample });
      return;
    }
    const msgId = api.pushNoor(buildGroupAsk(app, id, { who: ref.current.who, data: ref.current.data, ...opts }));
    const g = app.conv.groups[id];
    setAwait({ kind: 'multi', group: id, step: 'details', msgId, placeholder: g.placeholder, voiceSample: g.voiceSample });
  };

  // The next group that still has something to ask, or the review when everything is in.
  const convNext = (opts = {}) => {
    const id = nextGroup(ref.current.who, ref.current.data, ref.current.settled);
    if (id) askGroup(id, opts);
    else review(opts.updated);
  };

  // `first` marks the first question after the UAE PASS details arrive (Variation 1 says they were retrieved).
  const next = ({ first = false } = {}) => {
    if (conv) {
      convNext();
      return;
    }
    const step = nextStep(ref.current.who, ref.current.data, ref.current.settled);
    if (step) ask(step, { first });
    else review();
  };

  const afterAnswer = (noted = []) => {
    if (ref.current.returnToReview) {
      ref.current.returnToReview = false;
      // A changed answer can open a question that was not asked before (e.g. employed instead of student): ask it, then review.
      const step = conv ? null : nextStep(ref.current.who, ref.current.data, ref.current.settled);
      if (step) ask(step);
      else review();
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

  // Who the card is for, from the eligibility answers ("self" or "other").
  const setWho = (who) => {
    ref.current.who = who === 'other' ? 'other' : 'self';
  };

  const reset = () => {
    clearTimeout(signing.current);
    signing.current = null;
    const files = Object.values(ref.current.data).flatMap((v) => (Array.isArray(v) ? v : [v]));
    files.forEach((v) => v?.url && URL.revokeObjectURL(v.url));
    ref.current = { data: {}, awaiting: null, returnToReview: false, settled: new Set(), who: 'self' };
    setAwaitingInfo(null);
  };

  const submit = (msgId, label) => {
    api.lock(msgId, 'submitted');
    api.pushUser(label);
    api.setStage('complete');
    setAwait(null);
    api.pushNoor(buildSubmitted(app, newReference()));
  };

  // Asks for one field again, from the review (Change, or "change my …").
  const askEdit = (field, lead) => {
    const msgId = api.pushNoor(buildEditAsk(app, field, { who: ref.current.who, lead }));
    setAwait({ kind: 'edit', step: 'edit', field, msgId, placeholder: app.conv.editPlaceholder, voiceSample: app.conv.editVoiceSample });
  };

  // A new value for a field that was already answered: back to the review, or on to anything the new answer opens up.
  const applyEdit = (field, value) => {
    store(field, value);
    const updated = [fill(app.conv.review.changed[field], { v: value })];
    if (field === 'address') {
      // An address in another emirate moves the delivery emirate with it.
      const emirate = matchOption(value, app.conv.options.emirates);
      if (emirate && emirate !== ref.current.data.emirate) {
        store('emirate', emirate);
        updated.push(fill(app.conv.review.changed.emirate, { v: emirate }));
      }
    }
    if (nextGroup(ref.current.who, ref.current.data, ref.current.settled)) convNext({ noted: [field] });
    else review(updated);
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
          // The delivery contact number starts as the UAE PASS mobile; it can be changed in the review.
          const mobile = app.signIn.profile.rows.find((r) => r.id === 'mobile')?.value;
          if (mobile) store('deliveryMobile', mobile);
          if (conv) {
            const group = nextGroup(ref.current.who, ref.current.data, ref.current.settled);
            const id = api.pushNoor(buildSignInConv(app, { who: ref.current.who, data: ref.current.data, group }));
            const g = app.conv.groups[group];
            setAwait({ kind: 'multi', group, step: 'details', msgId: id, placeholder: g.placeholder, voiceSample: g.voiceSample });
          } else {
            api.pushNoor(buildSignIn(app, ref.current.who));
          }
        }, app.signIn.wait.ms);
        return true;
      case 'choice':
        api.lock(msgId, payload.value);
        store(payload.field, payload.value);
        api.pushUser(payload.value);
        afterAnswer([payload.field]);
        return true;
      case 'skip':
        api.lock(msgId, 'skipped');
        api.pushUser(payload.label);
        settle(payload.group);
        if (conv) convNext();
        else next();
        return true;
      case 'upload': {
        const { field, file } = payload;
        const info = { name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) };
        api.lock(msgId, info);
        api.pushUser(`${app.steps[field].label}: ${file.name}`, info.type.startsWith('image/') ? info.url : undefined);
        if (field === 'additional') {
          // More than one extra report is allowed: add this one and offer to add another.
          store(field, [...(ref.current.data.additional ?? []), info]);
          ask('additional', { again: true, name: file.name });
          return true;
        }
        store(field, info);
        afterAnswer();
        return true;
      }
      case 'editField':
        api.lock(msgId, 'editing');
        api.pushUser(`${app.review.change}: ${app.conv.review.labels[payload.field]}`);
        if (conv && payload.field !== 'photo' && payload.field !== 'report') {
          askEdit(payload.field, 'Certainly. I will update that.');
          return true;
        }
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
    const c = app.conv;
    const question = looksLikeQuestion(text);

    // One group of questions: read what the message says about it.
    if (aw.kind === 'multi') {
      if (question && known) return false; // a real question gets answered first
      const meta = GROUPS.find((g) => g.id === aw.group);
      const found = readGroup(aw.group, text, d, ctx());
      const keys = Object.keys(found);
      if (keys.length) {
        api.lock(aw.msgId, found.disability ?? 'answered');
        api.pushUser(text);
        ref.current.data = { ...d, ...found };
        if (meta.optional) settle(aw.group); // an optional group is done once the person has answered, even in part
        afterAnswer(keys);
        return true;
      }
      if (meta.optional && parseSkip(text)) {
        api.lock(aw.msgId, 'skipped');
        api.pushUser(text);
        settle(aw.group);
        convNext();
        return true;
      }
      if (known) return false;
      const g = c.groups[aw.group];
      const list = joinList((meta.required ?? []).filter((k) => !d[k]).map((k) => g.need[k]));
      api.pushUser(text);
      api.pushNoor(buildNudgeConv(c.nudgeLead, meta.optional ? c.nudgeOptional : fill(c.nudge, { list }), g.example, g.example ? c.exampleLabel : undefined));
      return true;
    }

    // One field asked again.
    if (aw.kind === 'edit') {
      if (question && known) return false;
      const value = readSingle(aw.field, text, ctx());
      if (!value) {
        if (known) return false;
        api.pushUser(text);
        api.pushNoor(buildNudgeConv(c.nudgeLead, fill(c.edit[aw.field], subject(ref.current.who))));
        return true;
      }
      api.lock(aw.msgId, 'updated');
      api.pushUser(text);
      applyEdit(aw.field, value);
      return true;
    }

    if (aw.kind === 'docs') {
      if (known) return false;
      api.pushUser(text);
      api.pushNoor(buildNudgeConv(c.nudgeLead, c.docs.nudge));
      return true;
    }

    // confirm: yes submits, or something is changed by typing
    if (parseYes(text)) {
      submit(aw.msgId, text);
      return true;
    }
    if (parseNo(text)) {
      api.pushUser(text);
      api.pushNoor(buildNudgeConv(c.review.holdLead, c.review.hold, c.review.example, c.exampleLabel));
      return true;
    }
    if (question && known) return false;
    const field = readEditField(text);
    if (field === 'photo' || field === 'report') {
      api.lock(aw.msgId, 'editing');
      api.pushUser(text);
      ref.current.returnToReview = true;
      ask(field, { changing: true });
      return true;
    }
    if (field) {
      const value = readSingle(field, text, ctx());
      api.lock(aw.msgId, 'updated');
      api.pushUser(text);
      if (value) applyEdit(field, value);
      else askEdit(field);
      return true;
    }
    // No field named: an emirate or a disability type on its own still says what is meant.
    const emirate = readSingle('emirate', text, ctx());
    const disability = readSingle('disability', text, ctx());
    const guess = emirate ? ['emirate', emirate] : disability ? ['disability', disability] : null;
    if (guess) {
      api.lock(aw.msgId, 'updated');
      api.pushUser(text);
      applyEdit(guess[0], guess[1]);
      return true;
    }
    if (known) return false;
    api.pushUser(text);
    api.pushNoor(buildNudgeConv(c.review.nudgeLead, c.review.nudge, c.review.example, c.exampleLabel));
    return true;
  };

  // Variation 1: typed or spoken text for the one question that is open. Returns true when it was consumed.
  const stepText = (text, aw, known) => {
    const step = app.steps[aw.step];
    const optional = isOptional(aw.step) && !ref.current.returnToReview;
    const skip = () => {
      api.lock(aw.msgId, 'skipped');
      api.pushUser(text);
      settle(aw.step);
      next();
    };
    if (looksLikeQuestion(text) && known) return false; // a real question (who can apply, documents…) is answered first
    // An uploaded document is expected: typing cannot give it, apart from skipping an optional one.
    if (step.kind === 'file') {
      if (optional && parseSkip(text)) {
        skip();
        return true;
      }
      if (known) return false;
      api.pushUser(text);
      api.pushNoor(buildNudge(app.upload.nudge));
      return true;
    }
    // For an open answer ("none" would be a valid employer), skipping is checked first; for a list, the answer first.
    if (optional && step.kind === 'text' && parseSkip(text)) {
      skip();
      return true;
    }
    const value = readStepAnswer(app, aw.step, text, ref.current.who);
    if (value) {
      api.lock(aw.msgId, step.kind === 'choice' ? value : 'answered');
      api.pushUser(text);
      store(aw.step, value);
      if (aw.step === 'address' && ref.current.returnToReview) syncEmirate(value);
      afterAnswer([aw.step]);
      return true;
    }
    if (optional && parseSkip(text)) {
      skip();
      return true;
    }
    if (known) return false;
    api.pushUser(text);
    api.pushNoor(buildNudge(step.error ?? app.nudges.choice));
    return true;
  };

  // A new address in another emirate moves the delivery emirate with it.
  const syncEmirate = (address) => {
    const emirate = matchOption(address, app.conv.options.emirates);
    if (emirate) store('emirate', emirate);
  };

  // Typed or spoken text while a question is open. Returns true when it was consumed.
  const handleText = (text, { known }) => {
    if (signing.current) return true; // waiting for UAE PASS: ignore typing rather than derail the sign-in
    const aw = ref.current.awaiting;
    if (!aw) return false;
    if (conv && CONV_KINDS.includes(aw.kind)) return convText(text, aw, known);
    return stepText(text, aw, known);
  };

  // Files attached to a message in the conversational steps: sorted into photograph and report (or, when optional details
  // are being asked, kept as additional reports), and read together with any details typed alongside them.
  // `files` are the chosen attachments ({ file, name, size, type }).
  const handleFiles = (files, text) => {
    const aw = ref.current.awaiting;
    const c = app.conv;
    let d = { ...ref.current.data };
    const got = [];
    const wrong = [];
    const added = [];
    let setAside = false;
    const makeInfo = (f) => ({ name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f.file) });
    if (aw.kind === 'multi' && aw.group === 'extras') {
      for (const f of files) {
        if (EXTRA_TYPES.includes(f.type)) {
          d = { ...d, additional: [...(d.additional ?? []), makeInfo(f)] };
          added.push(f.name);
        } else {
          wrong.push('report');
        }
      }
    } else {
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
        d = { ...d, [kind]: makeInfo(f) };
        got.push(kind);
      }
    }
    const found = aw.kind === 'multi' && text ? readGroup(aw.group, text, d, ctx()) : {};
    d = { ...d, ...found };
    ref.current.data = d;
    const firstImage = got.includes('photo') ? d.photo.url : undefined;
    api.pushUser([text, files.map((f) => f.name).join(', ')].filter(Boolean).join(' — '), firstImage);
    api.lock(aw.msgId, aw.kind === 'docs' ? 'received' : aw.kind === 'confirm' || aw.kind === 'edit' ? 'updated' : found.disability ?? 'answered');

    const prefix = [
      ...(added.length ? [fill(c.docs.additionalNoted, { name: joinList(added) })] : []),
      ...wrong.map((k) => c.docs.wrongType[k]),
      ...(setAside ? [c.docs.extra] : []),
    ].join(' ');
    if (aw.kind === 'confirm' || aw.kind === 'edit') {
      review(got.map((k) => c.docs.yourNames[k]));
      return;
    }
    if (aw.kind === 'multi' && (added.length || Object.keys(found).length) && GROUPS.find((g) => g.id === aw.group)?.optional) settle(aw.group);
    convNext({ noted: Object.keys(found), docs: got, prefix });
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
    setWho,
    next,
    awaiting: awaitingInfo,
    voiceSample: ref.current.awaiting ? ref.current.awaiting.voiceSample ?? app.steps[ref.current.awaiting.step]?.voiceSample : null,
  };
}
