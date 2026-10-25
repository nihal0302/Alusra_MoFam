import { UaePassLogo } from './UaePassLogo.jsx';

// "Sign in with UAE PASS", built from the official black button artwork
// (UAEPASS_Sign_in_Btn_Default_Black_*.svg) and the UAE PASS Buttons Guidelines v2:
//  - one sanctioned style only, none invented: black, for white or light backgrounds
//  - title in the approved wording, first word capitalised ("Sign in with UAE PASS"), black or white only
//  - logo in its official two-colour form (white + green and red on black), vertically centred with the title
//  - 300 x 44 pt artwork, radius 12; states: active, pressed, keyboard focus (green ring), disabled
// The title is live text (the artwork's SF Pro text is not embedded), so it follows the page language.
export function UaePassButton({ label, onClick, disabled }) {
  return (
    <button type="button" className="uaepass-btn" onClick={onClick} disabled={disabled}>
      <UaePassLogo className="uaepass-btn__logo" />
      <span className="uaepass-btn__title">{label}</span>
    </button>
  );
}
