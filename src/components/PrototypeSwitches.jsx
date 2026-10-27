import { useState } from 'react';
import './PrototypeSwitches.css';

// Testing controls, not part of the product. A dark button at the bottom left of the page ("Prototype controls") opens a panel
// with the three things the team switches between; the button closes it again, so it does not cover the page. They go away in
// the final build.
//   Buttons in reply: Yes = the buttons are inside the reply; No = they sit in a strip above the message box.
//   Chatbot design: which design is shown (Variation 1 or 2).
//   Scenario: the kind of person the testing samples pretend to be (see demo.en.js): free, plain, everything up front, forgetful,
//   and a returning visitor who left an application half done.
// Changing a design or a scenario starts a fresh conversation.
const SlidersIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

function Segmented({ label, value, options, onChange }) {
  return (
    <div className="pc-group">
      <span className="pc-group__label">{label}</span>
      <div className="pc-seg" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" role="radio" aria-checked={value === v} className={`pc-seg__btn${value === v ? ' is-on' : ''}`} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VariantSwitch({ value, onChange, buttonsInside, onButtonsInside, scenario, onScenario, scenarios }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pc" aria-label="Testing controls">
      {open && (
        <div className="pc__panel" id="proto-panel" role="dialog" aria-label="Prototype controls">
          <h3 className="pc__title">
            Prototype controls
            <button type="button" className="pc__close" aria-label="Close" onClick={() => setOpen(false)}>
              <CloseIcon />
            </button>
          </h3>
          <Segmented
            label="Buttons in reply"
            value={buttonsInside}
            options={[
              [true, 'Yes'],
              [false, 'No'],
            ]}
            onChange={onButtonsInside}
          />
          <Segmented
            label="Chatbot design"
            value={value}
            options={[
              ['1', 'Variation 1'],
              ['2', 'Variation 2'],
            ]}
            onChange={onChange}
          />
          <div className="pc-group">
            <span className="pc-group__label">{scenarios.label}</span>
            <div className="pc-list" role="radiogroup" aria-label={scenarios.label}>
              {scenarios.options.map(([id, label, text]) => (
                <button key={id} type="button" role="radio" aria-checked={scenario === id} className={`pc-list__btn${scenario === id ? ' is-on' : ''}`} onClick={() => onScenario(id)}>
                  <b>{label}</b>
                  <small>{text}</small>
                </button>
              ))}
            </div>
            <small className="pc-group__note">Changing the design or the scenario starts a new conversation.</small>
          </div>
        </div>
      )}
      <button type="button" className="pc__btn" aria-expanded={open} aria-controls="proto-panel" onClick={() => setOpen((o) => !o)}>
        <SlidersIcon />
        <span>Prototype controls</span>
      </button>
    </div>
  );
}
