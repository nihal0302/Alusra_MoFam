import './RegistrationBanner.css';

export function RegistrationBanner({ content }) {
  const { label, text, cta } = content;
  return (
    <aside className="registration-banner" aria-label={label}>
      <div className="registration-banner__inner">
        <p className="registration-banner__text">{text}</p>
        <a
          className="registration-banner__cta"
          href={cta.href}
          {...(cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {cta.label}
        </a>
      </div>
    </aside>
  );
}
