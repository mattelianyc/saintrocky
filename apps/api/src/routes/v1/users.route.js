import { Router } from 'express';

import {
  listUsers,
  createUser,
  getMe,
  updateMe,
  getUser,
  updateUser,
  deleteUser,
  requestAccountDeletion
} from '@saintrocky/api/controllers/users';

export function createUsersRouter() {
  const router = Router();

  router.get('/', listUsers);
  router.post('/', createUser);
  router.get('/me', getMe);
  router.put('/me', updateMe);
  router.post('/me/delete-account', requestAccountDeletion);
  router.get('/:id', getUser);
  router.put('/:id', updateUser);
  router.delete('/:id', deleteUser);

  return router;
}
