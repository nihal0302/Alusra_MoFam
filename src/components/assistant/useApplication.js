import { useRef, useState } from 'react';
import {
  ORDER,
  buildNudge,
  buildPrompt,
  buildReview,
  buildSignIn,
  buildSigningIn,
  buildSubmitted,
  matchEmirate,
  newReference,
  normalisePhone,
  validName,
} from '../../lib/application.js';

// The application, in the conversation: UAE PASS sign-in → details fetched → a few questions →
// two uploads → review → consent and submit. Everything is held in memory; nothing leaves the device.
// `api` is the small set of chat actions the assistant gives us.
export function useApplication(app, api) {
  const ref = useRef({ data: {}, awaiting: null, returnToReview: false });
  const signing = useRef(null); // timer while the simulated UAE PASS approval is pending
  const [awaitingInfo, setAwaitingInfo] = useState(null);

  const setAwait = (a) => {
    ref.current.awaiting = a;
    setAwaitingInfo(a ? { kind: a.kind, step: a.step, msgId: a.msgId, placeholder: app.steps[a.step].placeholder } : null);
  };

  const review = () => {
    setAwait(null);
    api.setStage('review');
    api.pushNoor(buildReview(app, ref.current.data));
  };

  const ask = (step, opts) => {
    // The photograph is asked first; if the report is already in (sent earlier in the chat), say only one is left.
    const hasOther = step === 'photo' && Boolean(ref.current.data.report);
    const msgId = api.pushNoor(buildPrompt(app, step, { ...opts, hasOther }));
    setAwait({ step, msgId, kind: app.steps[step].kind });
  };

  const next = () => {
    const step = ORDER.find((s) => !ref.current.data[s]);
    if (step) ask(step);
    else review();
  };

  const afterAnswer = () => {
    if (ref.current.returnToReview) {
      ref.current.returnToReview = false;
      review();
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
          api.pushNoor(buildSignIn(app));
        }, app.signIn.wait.ms);
        return true;
      case 'choice':
        api.lock(msgId, payload.value);
        store(payload.field, payload.value);
        api.pushUser(payload.value);
        afterAnswer();
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
        api.lock(msgId, 'submitted');
        api.pushUser(payload.label);
        api.setStage('complete');
        api.pushNoor(buildSubmitted(app, newReference()));
        return true;
      default:
        return false;
    }
  };

  // Typed or spoken text while a question is open. Returns true when it was consumed.
  const handleText = (text, { known }) => {
    if (signing.current) return true; // waiting for UAE PASS: ignore typing rather than derail the sign-in
    const aw = ref.current.awaiting;
    if (!aw) return false;
    const step = app.steps[aw.step];

    if (step.kind === 'text') {
      const value = aw.step === 'emergencyPhone' ? normalisePhone(text) : validName(text) ? text.trim() : null;
      api.pushUser(text);
      if (!value) {
        api.pushNoor(buildNudge(step.error));
        return true;
      }
      store(aw.step, value);
      afterAnswer();
      return true;
    }

    if (step.kind === 'choice') {
      const hit = matchEmirate(text, step.options);
      if (hit) {
        api.lock(aw.msgId, hit);
        store(aw.step, hit);
        api.pushUser(text);
        afterAnswer();
        return true;
      }
    }

    // A real question (who can apply, documents…) still gets answered normally.
    if (known) return false;
    api.pushUser(text);
    api.pushNoor(buildNudge(step.kind === 'choice' ? app.nudges.choice : app.upload.nudge));
    return true;
  };

  return { handle, handleText, reset, prefill, next, awaiting: awaitingInfo, voiceSample: ref.current.awaiting ? app.steps[ref.current.awaiting.step].voiceSample : null };
}
