import { Router } from 'express';

import {
  cancelRuleDeactivationRequestController,
  cancelRuleOverrideRequestController,
  confirmRuleDeactivationRequestController,
  confirmRuleOverrideRequestController,
  createUserRuleFromTemplateController,
  editUserRuleController,
  getRuleDeactivationRequestController,
  getRuleDraftController,
  getRuleOverrideRequestController,
  listRuleDraftsController,
  listRuleTemplatesController,
  listRuntimeAssignmentsController,
  listUserRulesController,
  publishRuleDraftController,
  requestRuleDeactivationController,
  requestRuleOverrideController,
  reportRuntimeEventController,
  settleMeteredViolationPenaltyController,
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
  router.post('/:id/override', requestRuleOverrideController);
  router.get('/:id/override/:requestId', getRuleOverrideRequestController);
  router.post('/:id/override/:requestId/confirm', confirmRuleOverrideRequestController);
  router.post('/:id/override/:requestId/cancel', cancelRuleOverrideRequestController);
  router.post('/:id/deactivation', requestRuleDeactivationController);
  router.get('/:id/deactivation/:requestId', getRuleDeactivationRequestController);
  router.post('/:id/deactivation/:requestId/confirm', confirmRuleDeactivationRequestController);
  router.post('/:id/deactivation/:requestId/cancel', cancelRuleDeactivationRequestController);
  router.get('/runtime/assignments', listRuntimeAssignmentsController);
  router.post('/runtime/events', reportRuntimeEventController);
  router.post('/:id/metered-penalty', settleMeteredViolationPenaltyController);

  return router;
}
