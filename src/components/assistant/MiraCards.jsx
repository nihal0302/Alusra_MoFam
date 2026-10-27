import { useState } from 'react';
import { ChatIcon } from './ChatIcon.jsx';
import { ActionCard, LinkButton } from './ActionCard.jsx';
import { UaePassButton } from './UaePassButton.jsx';

// The cards of a reply in Variation 2, drawn as sections of the Mira card exactly as the team's Mira POD Assistant prototype
// draws them (its markup and class names, with the noor- prefix). A card type the prototype has no picture of falls through to
// ActionCard, which draws it as before, inside the same card.

export const Timeline = ({ items }) => (
  <ol className="noor-tl">
    {items.map((it) => (
      <li key={it.title} className={it.state === 'done' ? 'is-done' : it.state === 'current' ? 'is-cur' : ''}>
        <span className="noor-tl__dot">{it.state === 'done' && <ChatIcon name="check" size={11} weight={2.4} />}</span>
        <div>
          <b>{it.title}</b>
          <span>{it.text}</span>
        </div>
      </li>
    ))}
  </ol>
);

const ResultHead = ({ title, subtitle, tone = 'success' }) => (
  <div className="noor-sec">
    <div className={`noor-result is-${tone}`}>
      <span className="noor-result__ic">
        <ChatIcon name={tone === 'success' ? 'check' : 'info'} size={18} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  </div>
);

const Chips = ({ options, label, selected, locked, onPick }) => (
  <div className="noor-chips" role="group" aria-label={label}>
    {options.map((o) => (
      <button key={o} type="button" className={`noor-chip${selected === o ? ' is-sel' : ''}`} disabled={locked} aria-pressed={selected === o} onClick={() => onPick(o)}>
        {o}
      </button>
    ))}
  </div>
);

// Questions that do not depend on each other: each has its own line and chips, divided by a hairline.
function ChipSet({ card, locked, onAction }) {
  const [picked, setPicked] = useState({});
  return (
    <div className="noor-sec noor-chipsec">
      {card.sections.map((s, i) => (
        <div key={s.field}>
          {i > 0 && <div className="noor-chipdiv" />}
          <p className="noor-chiplbl">{s.question}</p>
          <Chips
            options={s.options}
            label={s.question}
            selected={picked[s.field]}
            locked={locked}
            onPick={(o) => {
              if (locked) return;
              setPicked((p) => ({ ...p, [s.field]: o }));
              onAction?.('choiceSet', { group: card.group, field: s.field, value: o });
            }}
          />
        </div>
      ))}
    </div>
  );
}

const Rows = ({ rows, onChange, locked, changeLabel }) => (
  <dl className="noor-rows">
    {rows.map((r) => (
      <div className="noor-row" key={r.id}>
        <dt>{r.label}</dt>
        <dd>{r.value}</dd>
        {r.field && onChange ? (
          <button type="button" className="noor-lnk" disabled={locked} aria-label={`${changeLabel}: ${r.label}, currently ${r.value}`} onClick={() => onChange(r)}>
            {changeLabel}
          </button>
        ) : (
          <span />
        )}
      </div>
    ))}
  </dl>
);

const Ack = ({ icon, children }) => (
  <div className="noor-sec noor-sec--ack">
    <ChatIcon name={icon} size={16} />
    <p>{children}</p>
  </div>
);

export function MiraCard({ card, index, onAction, chosen, tray }) {
  const locked = chosen !== undefined;
  const say = (label) => onAction?.('say', label);

  if (card.type === 'uaepass') {
    if (tray) return null;
    return (
      <div className="noor-sec">
        <UaePassButton label={card.action.label} disabled={locked} onClick={() => onAction?.(card.action.event, card.action)} />
      </div>
    );
  }

  if (card.type === 'details' && card.mira) {
    const m = card.mira;
    return (
      <>
        <ResultHead title={m.welcome} subtitle={m.signedIn} />
        <div className="noor-sec">
          <div className="noor-subrow">
            <p className="noor-subh">{m.heading}</p>
            <span className="noor-srctag">
              <ChatIcon name="check" size={13} weight={2.2} />
              {m.tag}
            </span>
          </div>
          <p className="noor-note">{m.note}</p>
          <Rows rows={card.rows} />
        </div>
      </>
    );
  }

  if (card.type === 'choices') {
    if (tray) return null;
    return (
      <div className="noor-sec noor-chipsec">
        {card.prompt && <p className="noor-chiplbl">{card.prompt}</p>}
        <Chips options={card.options} label={card.label} selected={chosen} locked={locked} onPick={(o) => onAction?.('choice', { field: card.field, value: o })} />
        {card.extra && (
          <>
            <div className="noor-chipdiv" />
            <p className="noor-chiplbl">{card.extra.prompt}</p>
            <Chips options={card.extra.options} label={card.extra.prompt} selected={chosen} locked={locked} onPick={(o) => onAction?.('choice', { field: card.field, value: o })} />
          </>
        )}
      </div>
    );
  }

  if (card.type === 'choiceSet') {
    if (tray) return null;
    return <ChipSet card={card} locked={locked} onAction={onAction} />;
  }

  if (card.type === 'appReview' && card.mira) {
    const [before, after] = card.mira.consent.split('{submit}');
    return (
      <>
        {card.groups.map((g) => (
          <div className="noor-sec noor-rv" key={g.title}>
            <div className="noor-rv__h">
              <h4>
                <ChatIcon name={card.mira.icons[g.key] ?? 'info'} size={17} />
                {g.title}
              </h4>
              {g.key === 'applicant' && (
                <span className="noor-srctag">
                  <ChatIcon name="check" size={13} weight={2.2} />
                  {card.fromUaePass}
                </span>
              )}
            </div>
            <Rows rows={g.rows.map((r) => (r.source === 'uaepass' ? { ...r, field: undefined } : r))} locked={locked} changeLabel={card.change} onChange={(r) => onAction?.('editField', { field: r.field })} />
          </div>
        ))}
        <div className="noor-sec">
          <p className="noor-consent">
            {before}
            <b>{card.mira.submit}</b>
            {after}
          </p>
        </div>
        {!tray && (
          <div className="noor-sec noor-sec--actions" style={{ '--n': 1 }}>
            <button type="button" className="noor-btn" disabled={locked} onClick={() => onAction?.(card.submit.event, { ...card.submit, label: card.mira.submit })}>
              {card.mira.submit}
            </button>
          </div>
        )}
      </>
    );
  }

  if (card.type === 'submitted' && card.mira) {
    const m = card.mira;
    return <SubmittedSections card={card} m={m} tray={tray} say={say} />;
  }

  if (card.type === 'status' && card.mira) {
    const m = card.mira;
    const current = card.steps.find((s) => s.state === 'current');
    return (
      <>
        <div className="noor-sec">
          <div className="noor-statushead">
            <h3 className="noor-ask__q">{card.title}</h3>
            <span className="noor-pill">{current?.label ?? card.steps.filter((s) => s.state === 'done').pop()?.label}</span>
          </div>
          <p className="noor-ask__helper noor-statushead__sub">{card.summary}</p>
        </div>
        <div className="noor-sec">
          <Timeline items={card.steps.map((s) => ({ title: s.label, text: s.stateLabel, state: s.state }))} />
        </div>
        <Ack icon="mail">{m.note}</Ack>
        {!tray && (
          <div className="noor-sec noor-sec--actions" style={{ '--n': 2 }}>
            <button type="button" className="noor-btn noor-btn--outline" disabled={locked} onClick={() => say('Check application status')}>
              {m.ask}
            </button>
            <LinkButton link={{ ...card.account, label: m.apps }} solid />
          </div>
        )}
      </>
    );
  }

  return <ActionCard card={card} index={index} onAction={onAction} chosen={chosen} tray={tray} />;
}

function SubmittedSections({ card, m, tray, say }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(card.reference);
    } catch {
      /* clipboard can be blocked; the number is still on screen */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <>
      <ResultHead title={card.title} subtitle={m.subtitle} />
      <div className="noor-sec">
        <div className="noor-appno">
          <div>
            <small>{card.numberLabel}</small>
            <b>{card.reference}</b>
          </div>
          <button type="button" className="noor-btn noor-btn--outline" onClick={copy}>
            <ChatIcon name={copied ? 'check' : 'copy'} size={16} />
            {copied ? m.copied : m.copy}
          </button>
        </div>
      </div>
      <Ack icon="mail">{m.confirm}</Ack>
      <div className="noor-sec">
        <p className="noor-subh">{m.next}</p>
        <Timeline items={m.timeline.map(([title, text], i) => ({ title, text, state: i < 1 ? 'done' : i === 1 ? 'current' : 'pending' }))} />
      </div>
      {!tray && (
        <div className="noor-sec noor-sec--actions" style={{ '--n': 2 }}>
          <button type="button" className="noor-btn noor-btn--outline" onClick={() => say('Check application status')}>
            {m.actions.status}
          </button>
          <LinkButton link={{ label: m.actions.apps, href: '/account', newTab: true }} solid />
        </div>
      )}
    </>
  );
}
