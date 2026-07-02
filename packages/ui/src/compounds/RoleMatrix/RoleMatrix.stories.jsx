import { RoleMatrix } from './RoleMatrix.jsx';
import { OWNER_ROLE, USER_ROLE_LABELS, USER_ROLES } from '@saintrocky/shared';

export default { title: 'Compounds/RoleMatrix' };

const roles = USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] }));

const permissions = [
  {
    key: 'users',
    label: 'Manage users',
    description: 'Create, edit, and remove users',
    allowedRoles: [OWNER_ROLE]
  },
  {
    key: 'seo',
    label: 'Manage SEO',
    description: 'Update SEO settings and overrides',
    allowedRoles: ['manager', 'admin', 'owner']
  },
  {
    key: 'blog',
    label: 'Manage blog',
    description: 'Create and publish posts',
    allowedRoles: ['editor', 'operator', 'manager', 'admin', 'owner']
  }
];

export const Preview = {
  render: () => <RoleMatrix roles={roles} permissions={permissions} />
};

