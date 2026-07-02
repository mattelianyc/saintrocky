import * as React from 'react';

import { cx } from '../../primitives/_utils/cx.js';

export function StatusBanner({ message, tone = 'info', className = '', ...props }) {
  if (!message) return null;

  return (
    <div
      className={cx('ui-StatusBanner', `ui-StatusBanner--${tone}`, className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      {message}
    </div>
  );
}
