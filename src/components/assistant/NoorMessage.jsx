import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { NoorAvatar } from './NoorAvatar.jsx';
import { ActionCard } from './ActionCard.jsx';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion.js';

const THINK_MS = 650;
const TOOL_MS = 900;
const WORD_MS = 34;
const PARTS = ['lead', 'primary', 'tag', 'secondary', 'note', 'example'];

// One Mira turn, played as: thinking dots → "shows its work" chip → streamed words → cards.
// Stages: thinking → tool → stream → done. Reduced motion skips straight to done.
// Screen readers: the streaming text is hidden from them and the finished reply is announced
// once through the panel's live region (see Assistant.jsx), so they never hear it word by word.
export function NoorMessage({ msgId, scenario, avatar, onStage, onAction, labels, chosen, tray = false, feedback, rating, onRate, latest = false }) {
  const reduced = usePrefersReducedMotion();
  const hasTool = Boolean(scenario.tool);
  const [stage, setStage] = useState(reduced ? 'done' : 'thinking');
  const [shown, setShown] = useState(0);
  const onStageRef = useRef(onStage);
  onStageRef.current = onStage;

  // A reply reads as two kinds of text: a bold opener and body copy. Any smaller third line is joined onto the body copy.
  // A block that carries a `question` is shown as two bubbles: first what Mira acknowledges and understood (the opener and body
  // copy), then, on its own and set apart, what the person is asked to do next (with its example).
  const blocks = useMemo(
    () =>
      scenario.text.flatMap((b0) => {
        // The question, then on separate lines how to answer it (`how`) and anything else worth knowing (`note`), then an example.
        if (b0.question) {
          return [
            ...(b0.lead || b0.primary ? [{ lead: b0.lead, plainLead: b0.plainLead, primary: b0.primary }] : []),
            { primary: b0.question, tag: b0.tag, plainQuestion: b0.plainQuestion, items: b0.items, secondary: b0.how, note: b0.note, example: b0.example, exampleLabel: b0.exampleLabel, ask: true },
          ];
        }
        return [b0.secondary ? { ...b0, primary: b0.primary ? `${b0.primary} ${b0.secondary}` : b0.secondary, secondary: undefined } : b0];
      }),
    [scenario],
  );
  // Cards marked `before` (the UAE PASS details) sit between the acknowledgement and the question bubble.
  const firstAsk = blocks.findIndex((b) => b.ask);
  const beforeCards = firstAsk >= 0 ? scenario.cards.filter((c) => c.before) : [];
  // The words of each block, by part (a numbered list is one part per item), in the order they are shown.
  const words = useMemo(
    () =>
      blocks.map((b) => {
        const w = Object.fromEntries(PARTS.map((k) => [k, b[k] ? b[k].split(' ') : []]));
        return { ...w, items: (b.items ?? []).map((t) => t.split(' ')) };
      }),
    [blocks],
  );
  const total = words.reduce((n, w) => n + PARTS.reduce((m, k) => m + w[k].length, 0) + w.items.reduce((m, t) => m + t.length, 0), 0);

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
            const w = words[i];
            const lead = reveal(w.lead);
            const primary = reveal(w.primary);
            const tag = reveal(w.tag);
            const items = w.items.map(reveal);
            const secondary = reveal(w.secondary);
            const note = reveal(w.note);
            const example = reveal(w.example);
            if (!(lead.started || primary.started)) return null;
            const caret = <span className="noor-caret" aria-hidden="true" />;
            return (
              <Fragment key={i}>
                {i === firstAsk && beforeCards.map((card, k) => <ActionCard key={`before${k}`} card={card} index={0} onAction={onAction} chosen={chosen} tray={tray} />)}
              <div className={`noor-bubble noor-bubble--noor${b.ask ? ' noor-bubble--ask' : ''}`} aria-hidden={streaming || undefined}>
                <span className="visually-hidden">{labels.noorSaid}</span>
                {lead.started && (
                  <p className={b.plainLead ? 'noor-bubble__primary' : 'noor-bubble__lead'}>
                    {lead.text}
                    {lead.active && caret}
                  </p>
                )}
                {primary.started && (
                  <p className={b.ask && !b.plainQuestion ? 'noor-bubble__lead' : 'noor-bubble__primary'}>
                    {primary.text}
                    {primary.active && caret}
                    {tag.started && <span className="noor-bubble__tag"> {tag.text}</span>}
                    {tag.active && caret}
                  </p>
                )}
                {items.some((it) => it.started) && (
                  <ol className="noor-bubble__list">
                    {items.map((it, k) => it.started && (
                      <li key={k}>
                        {it.text}
                        {it.active && caret}
                      </li>
                    ))}
                  </ol>
                )}
                {secondary.started && (
                  <p className={b.ask ? 'noor-bubble__primary' : 'noor-bubble__secondary'}>
                    {secondary.text}
                    {secondary.active && caret}
                  </p>
                )}
                {note.started && (
                  <p className={b.ask ? 'noor-bubble__primary' : 'noor-bubble__secondary'}>
                    {note.text}
                    {note.active && caret}
                  </p>
                )}
                {example.started && (
                  <p className="noor-bubble__example">
                    <strong>{b.exampleLabel}</strong> {example.text}
                    {example.active && caret}
                  </p>
                )}
              </div>
              </Fragment>
            );
          })}
        {stage === 'done' &&
          scenario.cards.filter((card) => !beforeCards.includes(card)).map((card, i) => (
            <ActionCard key={i} card={card} index={i} onAction={onAction} chosen={chosen} tray={tray} />
          ))}
        {stage === 'done' && onRate && (
          // Thumbs up / down on the reply. Always shown on the latest reply; on older ones they show when the reply is hovered or
          // focused, and stay once a rating has been given.
          <div className={`noor-fb${rating ? ' is-rated' : ''}${latest ? ' is-latest' : ''}`} role="group" aria-label={feedback.label}>
            <button type="button" className={`noor-fb__btn${rating === 'up' ? ' is-on' : ''}`} aria-pressed={rating === 'up'} aria-label={feedback.up} title={feedback.up} onClick={() => onRate(rating === 'up' ? null : 'up')}>
              <ChatIcon name="thumbUp" size={18} />
            </button>
            <button type="button" className={`noor-fb__btn${rating === 'down' ? ' is-on' : ''}`} aria-pressed={rating === 'down'} aria-label={feedback.down} title={feedback.down} onClick={() => onRate(rating === 'down' ? null : 'down')}>
              <ChatIcon name="thumbDown" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
