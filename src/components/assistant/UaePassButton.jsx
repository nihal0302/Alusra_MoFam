import { assetUrl } from '../../lib/assets.js';

// UAE PASS button, following the UAE PASS Buttons Guidelines (2023):
//  - one of the sanctioned styles: black, for white or light backgrounds (never on dark ones)
//  - title in the approved wording, first word capitalised, e.g. "Sign in with UAE PASS"
//  - logo and title vertically centred, logo height matching the button text
//  - at least 140 x 30 pt with a margin of at least 1/10 of the height around it
// The fingerprint logo is a file in src/assets/uaepass/; swap in the official artwork as supplied.
export function UaePassButton({ label, onClick, disabled }) {
  const logo = assetUrl('uae-pass-logo.svg');
  return (
    <button type="button" className="uaepass-btn" onClick={onClick} disabled={disabled}>
      {logo && <img className="uaepass-btn__logo" src={logo} alt="" width="24" height="24" />}
      <span className="uaepass-btn__title">{label}</span>
    </button>
  );
}
