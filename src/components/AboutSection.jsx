import { ImageSlot } from './ImageSlot.jsx';
import './AboutSection.css';

export function AboutSection({ content }) {
  return (
    <section className="about-section" aria-labelledby="about-title">
      <div className="container about-section__grid">
        <div className="about-section__text">
          <h2 id="about-title" className="about-title">{content.title}</h2>
          {content.paragraphs.map((p) => (
            <p key={p} className="about-text">{p}</p>
          ))}
        </div>
        <div className="about-image-container">
          <div className="about-image">
            <ImageSlot file={content.image.file} alt={content.image.alt} />
          </div>
          <div className="wave-decoration">
            <ImageSlot file={content.decoration.file} decorative fit="contain" />
          </div>
        </div>
      </div>
    </section>
  );
}
