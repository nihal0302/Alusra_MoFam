import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { NoorAvatar } from './NoorAvatar.jsx';
import { ActionCard } from './ActionCard.jsx';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

const THINK_MS = 650;
const TOOL_MS = 900;
const WORD_MS = 34;
const PARTS = ['lead', 'primary', 'secondary'];

// One Mira turn, played as: thinking dots → "shows its work" chip → streamed words → cards.
// Stages: thinking → tool → stream → done. Reduced motion skips straight to done.
// Screen readers: the streaming text is hidden from them and the finished reply is announced
// once through the panel's live region (see Assistant.jsx), so they never hear it word by word.
export function NoorMessage({ msgId, scenario, avatar, onStage, onAction, labels, chosen }) {
  const reduced = usePrefersReducedMotion();
  const hasTool = Boolean(scenario.tool);
  const [stage, setStage] = useState(reduced ? 'done' : 'thinking');
  const [shown, setShown] = useState(0);
  const onStageRef = useRef(onStage);
  onStageRef.current = onStage;

  // A reply reads as two kinds of text: a bold opener and body copy. Any smaller third line is joined onto the body copy.
  const blocks = useMemo(
    () => scenario.text.map((b) => (b.secondary ? { lead: b.lead, primary: b.primary ? `${b.primary} ${b.secondary}` : b.secondary } : b)),
    [scenario],
  );
  const words = useMemo(
    () => blocks.map((b) => PARTS.map((k) => (b[k] ? b[k].split(' ') : []))),
    [blocks],
  );
  const total = words.reduce((n, parts) => n + parts.reduce((m, w) => m + w.length, 0), 0);

  useEffect(() => {
    onStageRef.current?.(stage, scenario);
  }, [stage, scenario]);

  useEffect(() => {
    if (reduced) {
      setShown(total);
      setStage('done');
    }
  }, [reduced, total]);

  useEffect(() => {
    if (stage === 'thinking') {
      const t = setTimeout(() => setStage(hasTool ? 'tool' : 'stream'), THINK_MS);
      return () => clearTimeout(t);
    }
    if (stage === 'tool') {
      const t = setTimeout(() => setStage('stream'), TOOL_MS);
      return () => clearTimeout(t);
    }
    if (stage === 'stream') {
      const id = setInterval(() => {
        setShown((n) => {
          if (n + 1 >= total) {
            clearInterval(id);
            setStage('done');
            return total;
          }
          return n + 1;
        });
      }, WORD_MS);
      return () => clearInterval(id);
    }
  }, [stage, hasTool, total]);

  const streaming = stage === 'stream';
  const showBubble = stage === 'stream' || stage === 'done';
  const toolDone = streaming || stage === 'done';

  let cursor = 0;
  const reveal = (list) => {
    const visible = Math.max(0, Math.min(list.length, shown - cursor));
    cursor += list.length;
    return { text: list.slice(0, visible).join(' '), active: streaming && visible > 0 && visible < list.length, started: visible > 0 };
  };

  return (
    <div className="noor-msg noor-msg--noor" data-msg={msgId}>
      <NoorAvatar src={avatar} size={30} className="noor-msg__avatar" />
      <div className="noor-msg__col">
        {stage === 'thinking' && (
          <div className="noor-bubble noor-bubble--noor noor-typing" aria-hidden="true">
            <span /><span /><span />
          </div>
        )}
        {hasTool && stage !== 'thinking' && (
          <div className={`noor-chip-tool${toolDone ? ' is-done' : ''}`} aria-hidden={!toolDone || undefined}>
            <span className="noor-chip-tool__icon" aria-hidden="true">
              {toolDone ? <ChatIcon name="check" size={12} /> : <span className="noor-spinner" />}
            </span>
            {toolDone ? scenario.tool.done : scenario.tool.working}
          </div>
        )}
        {showBubble &&
          blocks.map((b, i) => {
            const [lead, primary, secondary] = words[i].map(reveal);
            if (!(lead.started || primary.started)) return null;
            const caret = <span className="noor-caret" aria-hidden="true" />;
            return (
              <div className="noor-bubble noor-bubble--noor" key={i} aria-hidden={streaming || undefined}>
                <span className="visually-hidden">{labels.noorSaid}</span>
                {lead.started && (
                  <p className="noor-bubble__lead">
                    {lead.text}
                    {lead.active && caret}
                  </p>
                )}
                {primary.started && (
                  <p className="noor-bubble__primary">
                    {primary.text}
                    {primary.active && caret}
                  </p>
                )}
                {secondary.started && (
                  <p className="noor-bubble__secondary">
                    {secondary.text}
                    {secondary.active && caret}
                  </p>
                )}
              </div>
            );
          })}
        {stage === 'done' &&
          scenario.cards.map((card, i) => (
            <ActionCard key={i} card={card} index={i} onAction={onAction} chosen={chosen} />
          ))}
      </div>
    </div>
  );
}
