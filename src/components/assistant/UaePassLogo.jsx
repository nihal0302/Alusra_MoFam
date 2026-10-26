import logo from '../../assets/noor/uaepass/logo.png';

// The UAE PASS logo (fingerprint mark with the Arabic and English name), as supplied: src/assets/noor/uaepass/logo.png, with the
// empty margin cropped off. It is wider than tall, so it is sized by its height; the width follows.
export function UaePassLogo({ height = 26, className = '' }) {
  return <img className={`uaepass-logo ${className}`.trim()} src={logo} alt="UAE PASS" height={height} style={{ height }} draggable={false} />;
}
