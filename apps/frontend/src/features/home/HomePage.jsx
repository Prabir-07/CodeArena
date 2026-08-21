import { Button } from '../../components/ui/Button';

const signals = [
  ['Guided practice', 'Turn concepts into durable problem-solving instincts.'],
  ['Real feedback', 'Understand each submission with clear judge results.'],
  ['A growing arena', 'Build your profile as new challenges and contests arrive.'],
];

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero section-wrap">
        <div className="hero__copy">
          <p className="eyebrow">The coding practice arena</p>
          <h1>Make every solved problem <em>count.</em></h1>
          <p className="hero__lede">CodeArena is a focused place to practice, compete, and see the progress you have earned.</p>
          <div className="hero__actions">
            <Button href="/register">Start practicing <span aria-hidden="true">→</span></Button>
            <Button href="/problems" variant="secondary">Explore problems</Button>
          </div>
        </div>
        <div className="hero__panel" aria-label="Preview of CodeArena progress">
          <p className="panel-label">TODAY'S MOMENTUM</p>
          <strong>03<span>/05</span></strong>
          <div className="progress-track"><span /></div>
          <p>problems toward your daily goal</p>
          <div className="hero__streak"><span>⚡</span><b>7 day streak</b><small>Keep the signal alive.</small></div>
        </div>
      </section>
      <section className="signal-section section-wrap" aria-label="Platform benefits">
        {signals.map(([title, description], index) => (
          <article className="signal-card" key={title}>
            <span className="signal-card__number">0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
