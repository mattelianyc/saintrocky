import { cx } from '../../primitives/_utils/cx.js';

/**
 * Minimal 2-column layout (sidebar + main).
 * Keeps styling minimal; provides semantic regions for composition.
 */
export function PageLayout({
  className = '',
  sidebar = null,
  mainClassName = '',
  trailingPanel = null,
  trailingPanelClassName = '',
  children,
  ...props
}) {
  return (
    <div className={cx('c-PageLayout', className)} {...props}>
      {sidebar ? <aside className="c-PageLayout__sidebar">{sidebar}</aside> : null}
      <main className={cx('c-PageLayout__main', mainClassName)}>{children}</main>
      {trailingPanel ? (
        <aside className={cx('c-PageLayout__trailingPanel', trailingPanelClassName)}>
          {trailingPanel}
        </aside>
      ) : null}
    </div>
  );
}




