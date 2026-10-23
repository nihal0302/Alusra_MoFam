import { useEffect, useRef, useState } from 'react';
import { ImageSlot } from './ImageSlot.jsx';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion.js';
import './HeroSlider.css';

function SlideText({ slide }) {
  const cta = slide.cta && (
    <a
      className="btn-primary hero-slider__cta"
      href={slide.cta.href}
      {...(slide.cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {slide.cta.label}
    </a>
  );

  if (slide.id === 'empowerment') {
    return (
      <div className="hero-text">
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
        <div className="mission-block">
          <p className="mission-text">
            <span className="mission-title">{slide.mission.title}</span>
            {slide.mission.text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-text">
      <h1>
        {slide.accent && <span className="hero-slider__accent">{slide.accent}</span>}
        {slide.title}
      </h1>
      {slide.label && <p className="hero-slider__description-label">{slide.label}</p>}
      <p className="hero-slider__description">{slide.description}</p>
      {slide.dates && (
        <div className="hero-slider__dates">
          <p>{slide.dates}</p>
        </div>
      )}
      {cta}
    </div>
  );
}

export function HeroSlider({ content }) {
  const { slides, slideDurationMs, label } = content;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const autoplay = !reducedMotion && !paused;
  const timer = useRef(null);

  useEffect(() => {
    if (!autoplay) return undefined;
    timer.current = setTimeout(() => setActive((i) => (i + 1) % slides.length), slideDurationMs);
    return () => clearTimeout(timer.current);
  }, [active, autoplay, slideDurationMs, slides.length]);

  return (
    <section
      className="hero hero-slider"
      aria-roledescription="carousel"
      aria-label={label}
      style={{ '--hero-slide-duration': `${slideDurationMs}ms` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="hero-slider__viewport" aria-live={autoplay ? 'off' : 'polite'}>
        {slides.map((slide, i) => (
          <article
            key={slide.id}
            className={`hero-slider__slide hero-slider__slide--${slide.id}${i === active ? ' is-active' : ''}`}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${slides.length}`}
            aria-hidden={i !== active}
            inert={i !== active ? true : undefined}
          >
            <div className="hero-content">
              <SlideText slide={slide} />
              <div className="image-section">
                <div className="photo-frame">
                  <ImageSlot file={slide.image.file} alt={slide.image.alt} fit={slide.image.fit} />
                </div>
              </div>
              {slide.mascot && (
                <div className="hero-slider__cat" aria-hidden="true">
                  <ImageSlot file={slide.mascot.file} decorative fit="contain" />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="hero-slider__footer">
        <div className="hero-slider__dots-align">
          <div className="hero-slider__dots-track">
            <div className="hero-slider__dots" role="tablist" aria-label="Slide navigation">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Slide ${i + 1}`}
                  className={`hero-slider__dot${i === active ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {i === active && (
                    <span
                      key={`${active}-${autoplay}`}
                      className={`hero-slider__dot-progress${autoplay ? '' : ' is-static'}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
