import { Icon } from './Icon.jsx';
import './ContactSection.css';

export function ContactSection({ content }) {
  const { hours, reach } = content;
  return (
    <section className="newsletter-section" aria-label="Stay connected">
      <div className="dotted-pattern" aria-hidden="true" />
      <div className="container">
        <div className="newsletter-contact-cards">
          <div className="newsletter-info-card">
            <h3>{hours.title}</h3>
            {hours.rows.map((r) => (
              <p key={r.label}>
                <strong>{r.label}</strong> {r.value}
              </p>
            ))}
            <p>{hours.note}</p>
          </div>
          <div className="newsletter-info-card">
            <h3>{reach.title}</h3>
            <p>{reach.intro}</p>
            {reach.links.map((l) => (
              <div key={l.email} className="newsletter-contact-link">
                <strong>{l.label}</strong>
                <a href={`mailto:${l.email}`}>
                  {l.email}
                  <Icon name="arrowUpRight" size={16} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="dotted-pattern" aria-hidden="true" />
    </section>
  );
}
