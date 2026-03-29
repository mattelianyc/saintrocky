import { Card } from '../../primitives/Card/Card.jsx';
import { cx } from '../../primitives/_utils/cx.js';

function renderEmptyState(emptyMessage) {
  return (
    <li className="c-ResourceListCard__item c-ResourceListCard__item--empty">
      <p className="c-ResourceListCard__itemTitle">{emptyMessage}</p>
      <p className="c-ResourceListCard__itemBody">No records returned yet.</p>
    </li>
  );
}

export function ResourceListCard({
  title,
  items = [],
  renderItem,
  emptyMessage = 'Nothing yet',
  className = ''
}) {
  return (
    <Card className={cx('c-ResourceListCard', className)}>
      <div className="layout-stack-gap-12">
        <h2>{title}</h2>
        <ul className="c-ResourceListCard__list">
          {items.length ? items.map(renderItem) : renderEmptyState(emptyMessage)}
        </ul>
      </div>
    </Card>
  );
}
