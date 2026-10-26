import './PrototypeSwitches.css';

// Testing controls, not part of the product: they let the team compare the chatbot designs and the two places the
// buttons can sit. Both go away in the final build.

// On the page: which chatbot design is shown.
export function VariantSwitch({ value, onChange }) {
  return (
    <div className="proto-bar" role="group" aria-label="Chatbot design (testing)">
      <span className="proto-bar__label">Chatbot design</span>
      <div className="proto-seg" role="radiogroup" aria-label="Chatbot design">
        {['1', '2'].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={`proto-seg__btn${value === v ? ' is-on' : ''}`}
            onClick={() => onChange(v)}
          >
            Variation {v}
          </button>
        ))}
      </div>
    </div>
  );
}

// In the chatbot: buttons inside the reply (on) or outside it, above the message box (off).
export function ButtonsSwitch({ on, onChange, label, hint }) {
  return (
    <div className="proto-chat">
      <span className="proto-chat__hint">{hint}</span>
      <label className="proto-switch">
        <span className="proto-switch__label">{label}</span>
        <button type="button" role="switch" aria-checked={on} className={`proto-switch__track${on ? ' is-on' : ''}`} onClick={() => onChange(!on)}>
          <span className="proto-switch__thumb" />
        </button>
      </label>
    </div>
  );
}
