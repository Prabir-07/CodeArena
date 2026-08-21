import { Button } from '../../components/ui/Button';

const content = {
  problems: { eyebrow: 'PROBLEM SERVICE', title: 'The problem set is taking shape.', copy: 'Problem discovery, filters, statements, and editorial access will connect here once the Problem Service contract is established.' },
  contests: { eyebrow: 'CONTESTS', title: 'Competition is on the horizon.', copy: 'Contest schedules, rankings, and participation will arrive with their dedicated backend contracts.' },
  leaderboard: { eyebrow: 'LEADERBOARD', title: 'Rankings need verified results.', copy: 'The leaderboard will be built from Problem and Judge Service data once submissions and scoring are defined.' },
};

export function UnavailablePage({ feature }) {
  const page = content[feature];
  return <section className="unavailable-page section-wrap"><div className="unavailable-page__panel"><p className="eyebrow">{page.eyebrow} · IN DEVELOPMENT</p><h1>{page.title}</h1><p>{page.copy}</p><Button href="/" variant="secondary">Back home</Button></div></section>;
}
