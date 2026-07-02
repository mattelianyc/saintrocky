import { Card } from '../../primitives/Card/Card.jsx';
import { cx } from '../../primitives/_utils/cx.js';

export function SummaryGrid({ items = [], className = '' }) {
  return (
    <div className={cx('c-SummaryGrid', className)}>
      {items.map(([label, value]) => (
        <Card key={label} className="c-SummaryGrid__card">
          <span className="c-SummaryGrid__label">{label}</span>
          <span className="c-SummaryGrid__value">{value}</span>
        </Card>
      ))}
    </div>
  );
}
