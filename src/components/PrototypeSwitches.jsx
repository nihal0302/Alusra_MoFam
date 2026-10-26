import './PrototypeSwitches.css';

// Testing controls, not part of the product: they let the team compare the two chatbot designs and the two places the
// buttons can sit, and to try three kinds of person (the scenarios). They live outside the chatbot, in small boxes stacked at the
// bottom-left of the page, and go away in the final build.
//   Scenario: 1 free (nothing pre-filled), 2 answers as asked, 3 sends everything up front, 4 forgets some things (see demo.en.js).
//   Hovering a scenario number explains it.
//   Buttons in reply: Yes = the buttons are inside the reply; No = they sit in a strip above the message box.
//   Chatbot design: which design is shown.
function Segmented({ label, value, options, onChange }) {
  return (
    <div className="proto-bar" role="group" aria-label={label}>
      <span className="proto-bar__label">{label}</span>
      <div className="proto-seg" role="radiogroup" aria-label={label}>
        {options.map(([v, text, tip]) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={tip ? `${text}. ${tip}` : undefined}
            data-tip={tip || undefined}
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

// The scenario switch is hidden for now. All the scenario code stays; set this to true to show the switch again.
// While it is hidden the scenario stays on "free" (the default in App.jsx), so nothing is pre-filled.
const SHOW_SCENARIOS = false;

export function VariantSwitch({ value, onChange, buttonsInside, onButtonsInside, scenario, onScenario, scenarios }) {
  return (
    <div className="proto-stack" aria-label="Testing controls">
      {SHOW_SCENARIOS && <Segmented label={scenarios.label} value={scenario} options={scenarios.options} onChange={onScenario} />}
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
