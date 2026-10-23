import { ImageSlot } from './ImageSlot.jsx';
import './CareersSection.css';

export function CareersSection({ content }) {
  return (
    <section className="shape-future-section" aria-labelledby="careers-title">
      <div className="container shape-future-section__grid">
        <div className="shape-image-container">
          <ImageSlot file={content.image.file} alt={content.image.alt} fit="contain" />
        </div>
        <div className="shape-content">
          <div className="airplane-icons1" aria-hidden="true">
            <ImageSlot file={content.birds.file} decorative fit="contain" />
          </div>
          <div className="airplane-icons2" aria-hidden="true">
            <ImageSlot file={content.birds.file} decorative fit="contain" />
          </div>
          <h2 id="careers-title" className="shape-title">{content.title}</h2>
          {content.paragraphs.map((p) => (
            <p key={p} className="shape-description">{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
