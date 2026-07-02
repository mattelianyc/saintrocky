export const MEMBER_ROLE = 'member';
export const STAFF_ROLE_THRESHOLD = 'editor';
export const USER_ROLES = [MEMBER_ROLE, STAFF_ROLE_THRESHOLD, 'operator', 'manager', 'admin', 'owner'];

export const USER_ROLE_LABELS = {
  member: 'Member',
  editor: 'Editor',
  operator: 'Operator',
  manager: 'Manager',
  admin: 'Admin',
  owner: 'Owner'
};

export const EDITOR_ROLE_THRESHOLD = STAFF_ROLE_THRESHOLD;
export const OWNER_ROLE = 'owner';
export const ADMIN_ROLE_THRESHOLD = 'admin';

export function isKnownUserRole(role) {
  return USER_ROLES.includes(String(role || ''));
}
