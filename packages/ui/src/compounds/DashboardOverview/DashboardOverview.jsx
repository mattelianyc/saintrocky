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
  variant = "default",
  className = ''
}) {
  const shouldRenderHero = variant !== "compact" && Boolean(eyebrow || title || summary);

  return (
    <div className={cx('c-DashboardOverview', variant === "compact" && "c-DashboardOverview--compact", className)}>
      {shouldRenderHero ? (
        <section className="c-DashboardOverview__hero">
          {eyebrow ? <p className="c-DashboardOverview__eyebrow">{eyebrow}</p> : null}
          {title ? <h1>{title}</h1> : null}
          {summary ? <p className="c-DashboardOverview__summary">{summary}</p> : null}
        </section>
      ) : null}

      <section className="c-DashboardOverview__metricGrid">
        {metrics.map(([key, label]) => (
          <Card key={key} className={variant === "compact" ? "c-CompactDashboardCard" : ""}>
            <div className="c-DashboardOverview__metricCard">
              <span className="c-DashboardOverview__metricLabel">{label}</span>
              <strong>{String(counts?.[key] ?? 0)}</strong>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
