import { USER_ROLES } from '@saintrocky/shared';

const order = USER_ROLES;

export function roleAtLeast(role, minRole) {
  const a = order.indexOf(String(role || ''));
  const b = order.indexOf(String(minRole || ''));
  if (a === -1 || b === -1) return false;
  return a >= b;
}
