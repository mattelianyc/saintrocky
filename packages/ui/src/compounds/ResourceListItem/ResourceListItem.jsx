import { cx } from '../../primitives/_utils/cx.js';

export function ResourceListItem({ title, body, meta, className = '' }) {
  return (
    <li className={cx('c-ResourceListCard__item', className)}>
      <p className="c-ResourceListCard__itemTitle">{title}</p>
      <p className="c-ResourceListCard__itemBody">{body}</p>
      {meta ? <p className="c-ResourceListCard__itemMeta">{meta}</p> : null}
    </li>
  );
}
