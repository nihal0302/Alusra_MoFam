import activeArt from '../../assets/noor/uaepass/signin-active.svg';
import pressedArt from '../../assets/noor/uaepass/signin-pressed.svg';
import focusArt from '../../assets/noor/uaepass/signin-focus.svg';
import disabledArt from '../../assets/noor/uaepass/signin-disabled.svg';

// "Sign in with UAE PASS": the supplied black button artwork, used as is (UAEPASS_Sign_in_Btn_Default_Black_*.svg).
// One image per state, stacked; CSS shows the one that matches (rest = active, press = pressed, keyboard focus =
// focus ring, disabled = disabled). The artwork carries its own text and logo, so the button's name is set here
// for screen readers and the images are decorative.
export function UaePassButton({ label, onClick, disabled }) {
  return (
    <button type="button" className="uaepass-btn" aria-label={label} onClick={onClick} disabled={disabled}>
      <img className="uaepass-btn__art uaepass-btn__art--active" src={activeArt} alt="" draggable={false} />
      <img className="uaepass-btn__art uaepass-btn__art--pressed" src={pressedArt} alt="" draggable={false} />
      <img className="uaepass-btn__art uaepass-btn__art--focus" src={focusArt} alt="" draggable={false} />
      <img className="uaepass-btn__art uaepass-btn__art--disabled" src={disabledArt} alt="" draggable={false} />
    </button>
  );
}
