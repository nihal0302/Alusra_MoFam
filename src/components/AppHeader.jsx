import { home } from '../content/home.en.js';
import { caseView } from '../content/case.en.js';
import { ImageSlot } from './ImageSlot.jsx';
import './AppHeader.css';

export const Icon = ({ file, className = '' }) => (
  <span className={`case-icon ${className}`} aria-hidden="true">
    <ImageSlot file={file} decorative fit="contain" />
  </span>
);

// The bar at the top of the page: the two logos, the person signed in and the language switch.
export function AppHeader({ first }) {
  const h = caseView.header;
  return (
    <header className="app-header">
      <div className="app-header__logos">
        <a className="app-header__logo" href="/" aria-label={home.nav.logo.label}>
          <ImageSlot file={home.nav.logo.file} alt={home.nav.logo.label} fit="contain" />
        </a>
        <span className="app-header__rule" aria-hidden="true" />
        <span className="app-header__logo app-header__logo--uae">
          <ImageSlot file={home.nav.uaeLogo.file} alt={home.nav.uaeLogo.label} fit="contain" />
        </span>
      </div>
      <div className="app-header__tools">
        {/* the account menu is not built: the pill only shows who is signed in */}
        <div className="app-user" aria-label={h.userMenu}>
          <span className="app-user__avatar">
            <ImageSlot file="case-avatar.jpg" decorative />
          </span>
          <span className="app-user__text">
            <span className="app-user__name">{first}</span>
            <span className="app-user__role">{h.role}</span>
          </span>
          <Icon file="case-chevron-down.svg" className="case-icon--20" />
        </div>
        <div className="app-lang" role="group" aria-label={h.languageLabel}>
          <span className="app-lang__en" aria-current="true">
            {h.languages.en}
          </span>
          <span className="app-lang__rule" aria-hidden="true" />
          <a href={h.languages.arHref} lang="ar" hrefLang="ar">
            {h.languages.ar}
          </a>
        </div>
      </div>
    </header>
  );
}
