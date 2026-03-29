import { Card } from '../../primitives/Card/Card.jsx';
import { cx } from '../../primitives/_utils/cx.js';

export function DashboardSectionPage({
  title,
  description,
  items = [],
  itemTitleKey = 'title',
  getItemSummary,
  className = ''
}) {
  return (
    <div className={cx('c-DashboardSectionPage', className)}>
      <header className="c-DashboardSectionPage__header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <section className="c-DashboardSectionPage__grid">
        {items.map((item) => {
          const itemSummary = getItemSummary
            ? getItemSummary(item)
            : item.summary || item.description || item.status || '';

          return (
            <Card key={item.id}>
              <div className="c-DashboardSectionPage__cardStack">
                <h2>{item[itemTitleKey]}</h2>
                <p>{itemSummary}</p>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
