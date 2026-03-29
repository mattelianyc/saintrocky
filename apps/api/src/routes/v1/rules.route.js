import { Router } from 'express';

import {
  createUserRuleFromTemplateController,
  editUserRuleController,
  getRuleDraftController,
  listRuleDraftsController,
  listRuleTemplatesController,
  listRuntimeAssignmentsController,
  listUserRulesController,
  publishRuleDraftController,
  reportRuntimeEventController,
  submitRuleDraftController,
  updateUserRuleStatusController
} from '../../controllers/rules.controller.js';

export function createRulesRouter() {
  const router = Router();

  router.get('/templates', listRuleTemplatesController);
  router.get('/', listUserRulesController);
  router.get('/drafts', listRuleDraftsController);
  router.get('/drafts/:id', getRuleDraftController);
  router.post('/drafts', submitRuleDraftController);
  router.post('/drafts/:id/publish', publishRuleDraftController);
  router.post('/from-template', createUserRuleFromTemplateController);
  router.post('/:id/edit', editUserRuleController);
  router.post('/:id/status', updateUserRuleStatusController);
  router.get('/runtime/assignments', listRuntimeAssignmentsController);
  router.post('/runtime/events', reportRuntimeEventController);

  return router;
}
