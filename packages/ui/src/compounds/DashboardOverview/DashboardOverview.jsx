import { Card } from '../../primitives/Card/Card.jsx';
import { cx } from '../../primitives/_utils/cx.js';

const defaultMetrics = [
  ['disciplineScore', 'Discipline Score'],
  ['escrowBalanceSol', 'Escrow Balance (SOL)'],
  ['activeRules', 'Active Rules'],
  ['recentViolations', 'Recent Violations']
];

export function DashboardOverview({
  eyebrow,
  title,
  summary,
  metrics = defaultMetrics,
  counts = {},
  sections = [],
  className = ''
}) {
  return (
    <div className={cx('c-DashboardOverview', className)}>
      <section className="c-DashboardOverview__hero">
        {eyebrow ? <p className="c-DashboardOverview__eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {summary ? <p className="c-DashboardOverview__summary">{summary}</p> : null}
      </section>

      <section className="c-DashboardOverview__metricGrid">
        {metrics.map(([key, label]) => (
          <Card key={key}>
            <div className="c-DashboardOverview__metricCard">
              <span className="c-DashboardOverview__metricLabel">{label}</span>
              <strong>{String(counts?.[key] ?? 0)}</strong>
            </div>
          </Card>
        ))}
      </section>

      <section className="c-DashboardOverview__sectionGrid">
        {sections.map((section) => (
          <Card key={section.slug || section.id || section.title}>
            <div className="c-DashboardOverview__sectionCard">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
