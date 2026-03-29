import { Card } from '../../primitives/Card/Card.jsx';
import { cx } from '../../primitives/_utils/cx.js';

const defaultMetrics = [
  { key: 'alerts', label: 'Alerts' },
  { key: 'workflows', label: 'Workflows' },
  { key: 'policies', label: 'Policies' },
  { key: 'devices', label: 'Devices' }
];

export function MetricGrid({ items = defaultMetrics, values = {}, className = '' }) {
  return (
    <div className={cx('c-MetricGrid', className)}>
      {items.map((item) => (
        <Card key={item.key} className="c-MetricGrid__card">
          <span className="c-MetricGrid__label">{item.label}</span>
          <strong className="c-MetricGrid__value">{String(values?.[item.key] ?? item.value ?? 0)}</strong>
        </Card>
      ))}
    </div>
  );
}
