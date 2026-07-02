import * as React from 'react';
import { cx } from '../_utils/cx.js';

export const Textarea = React.forwardRef(function Textarea(
  { className = '', invalid = false, ...props },
  ref
) {
  const cls = cx('ui-Textarea', invalid ? 'ui-Textarea--invalid' : '', className);
  if (invalid) props['aria-invalid'] = true;
  return <textarea ref={ref} className={cls} {...props} />;
});
