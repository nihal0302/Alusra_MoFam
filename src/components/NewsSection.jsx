import { ImageSlot } from './ImageSlot.jsx';
import './NewsSection.css';

function NewsCard({ item, featured }) {
  const body = (
    <>
      <div className="news-card-date">{item.date}</div>
      <h3 className="news-card-title">{item.title}</h3>
      <p className="news-card-description">{item.description}</p>
      <div className="news-card-image">
        <ImageSlot file={item.image.file} alt={item.image.alt} />
      </div>
    </>
  );
  const cls = `news-card${featured ? ' news-card--featured' : ''}`;
  return item.href ? (
    <a href={item.href} className={`${cls} news-card--linked`}>{body}</a>
  ) : (
    <article className={cls}>{body}</article>
  );
}

export function NewsSection({ content }) {
  return (
    <section id="news" className="news-section" aria-labelledby="news-title">
      <div className="container">
        <div className="news-header">
          <h2 id="news-title" className="news-title">
            {content.title[0]} <br />
            {content.title[1]}
          </h2>
        </div>
        <div className="news-cards-container">
          {content.items.map((item, i) => (
            <NewsCard key={item.title} item={item} featured={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
