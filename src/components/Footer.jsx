import { Icon } from './Icon.jsx';
import { ImageSlot } from './ImageSlot.jsx';
import './Footer.css';

function ContactItem({ item }) {
  let body;
  if (item.lines) {
    body = (
      <span>
        {item.lines.map((line, i) => (
          <span key={line}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </span>
    );
  } else if (item.href) {
    body = (
      <a href={item.href} dir={item.ltr ? 'ltr' : undefined}>
        {item.text}
      </a>
    );
  } else {
    body = <span>{item.text}</span>;
  }
  return (
    <li className="contact-info-item">
      <span className="contact-icon">
        <Icon name={item.icon} size={18} />
      </span>
      {body}
    </li>
  );
}

export function Footer({ content }) {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <div className="footer-logo-img">
              <ImageSlot file={content.logos[0].file} alt={content.logos[0].label} fit="contain" />
            </div>
            <div className="footer-separator" aria-hidden="true" />
            <div className="footer-logo-img">
              <ImageSlot file={content.logos[1].file} alt={content.logos[1].label} fit="contain" />
            </div>
          </div>
          <ul className="footer-social" aria-label="Social media">
            {content.social.map((s) => (
              <li key={s.id}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="social-link">
                  <Icon name={s.id} size={22} title={s.label} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-section footer-section--spacer" />
        <div className="footer-section">
          <h3 className="footer-heading">{content.contactTitle}</h3>
          <ul className="footer-contact-info">
            {content.contact.map((item) => (
              <ContactItem key={item.icon} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
