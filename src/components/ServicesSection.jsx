import './ServicesSection.css';

export function ServicesSection({ content }) {
  return (
    <section className="what-we-do" aria-labelledby="services-title">
      <div className="container">
        <h2 id="services-title" className="section-title">{content.title}</h2>
        <p className="section-description">{content.description}</p>
        <ul className="services-grid">
          {content.items.map((s) => (
            <li key={s.slug} className="service-card">
              <h3 className="service-card-title">
                <a href={s.href}>{s.title}</a>
              </h3>
              <p className="service-card-description">{s.description}</p>
              <a href={s.href} className="service-learn-more" aria-label={`Start service: ${s.title}`}>
                {content.cta}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
