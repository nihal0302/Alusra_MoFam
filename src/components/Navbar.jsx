import { ImageSlot } from './ImageSlot.jsx';
import './Navbar.css';

export function Navbar({ content }) {
  const { logo, uaeLogo, language } = content;
  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar__inner">
        <a className="navbar__logo" href="/" aria-label="Alusra home">
          <ImageSlot file={logo.file} alt={logo.label} fit="contain" />
        </a>
        <div className="navbar__end">
          <a className="navbar__lang" href={language.href} lang="ar" hrefLang="ar">
            <span className="navbar__lang-full">{language.full}</span>
            <span className="navbar__lang-short" aria-hidden="true">{language.short}</span>
          </a>
          <div className="navbar__uae">
            <ImageSlot file={uaeLogo.file} alt={uaeLogo.label} fit="contain" />
          </div>
        </div>
      </div>
    </nav>
  );
}
