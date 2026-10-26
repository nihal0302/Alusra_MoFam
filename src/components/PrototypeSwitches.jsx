import './PrototypeSwitches.css';

// Testing controls, not part of the product: they let the team compare the two chatbot designs and the two places the
// buttons can sit. They live outside the chatbot, in two small boxes stacked at the bottom-left of the page, and go away
// in the final build.
//   Buttons in reply: Yes = the buttons are inside the reply; No = they sit in a strip above the message box.
//   Chatbot design: which design is shown.
function Segmented({ label, value, options, onChange }) {
  return (
    <div className="proto-bar" role="group" aria-label={label}>
      <span className="proto-bar__label">{label}</span>
      <div className="proto-seg" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            className={`proto-seg__btn${value === v ? ' is-on' : ''}`}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VariantSwitch({ value, onChange, buttonsInside, onButtonsInside }) {
  return (
    <div className="proto-stack" aria-label="Testing controls">
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
    </div>
  );
}
