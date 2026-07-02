import {
  createUserRuleFromTemplate,
  editUserRule,
  getRuleDraft,
  listRuleDrafts,
  listRuleTemplates,
  listRuntimeAssignments,
  listUserRules,
  publishRuleDraft,
  reportRuntimeEvent,
  submitRuleDraft,
  updateUserRuleStatus
} from '../services/rules.service.js';
import {
  cancelRuleChangeRequest,
  confirmRuleChangeRequest,
  getRuleChangeRequest,
  requestRuleDeactivation,
  requestRuleOverride,
  settleMeteredViolationPenalty
} from '../services/override.service.js';
import { requireUser } from '../utils/auth.js';

function respondWithError(res, error) {
  const status = error?.status || 500;
  const payload =
    error?.payload || { ok: false, code: 'RULE_DRAFT_ERROR', message: error?.message || 'Rule draft request failed' };

  return res.status(status).json(payload);
}

function getActor(req) {
  return requireUser(req);
}

export async function listRuleDraftsController(req, res) {
  try {
    return res.json(await listRuleDrafts({ actor: await getActor(req), authorEmail: req.query?.authorEmail }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRuleDraftController(req, res) {
  try {
    return res.json(
      await getRuleDraft({ actor: await getActor(req), authorEmail: req.query?.authorEmail, ruleDraftId: req.params.id })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function listRuleTemplatesController(req, res) {
  try {
    return res.json(await listRuleTemplates({ actor: await getActor(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function listUserRulesController(req, res) {
  try {
    return res.json(await listUserRules({ actor: await getActor(req), ownerEmail: req.query?.ownerEmail }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function submitRuleDraftController(req, res) {
  try {
    const response = await submitRuleDraft({ ...req.body, actor: await getActor(req) });
    return res.status(201).json(response);
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function createUserRuleFromTemplateController(req, res) {
  try {
    return res.status(201).json(await createUserRuleFromTemplate({ ...req.body, actor: await getActor(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function publishRuleDraftController(req, res) {
  try {
    return res
      .status(201)
      .json(await publishRuleDraft({ ...req.body, actor: await getActor(req), draftId: req.params.id }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function updateUserRuleStatusController(req, res) {
  try {
    return res.json(await updateUserRuleStatus({ ...req.body, actor: await getActor(req), ruleId: req.params.id }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function editUserRuleController(req, res) {
  try {
    return res.json(await editUserRule({ ...req.body, actor: await getActor(req), ruleId: req.params.id }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function requestRuleOverrideController(req, res) {
  try {
    return res
      .status(201)
      .json(await requestRuleOverride({ ...req.body, actor: await getActor(req), ruleId: req.params.id }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRuleOverrideRequestController(req, res) {
  try {
    return res.json(
      await getRuleChangeRequest({
        actor: await getActor(req),
        ruleId: req.params.id,
        requestId: req.params.requestId,
        requestKind: 'override'
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function confirmRuleOverrideRequestController(req, res) {
  try {
    return res.json(
      await confirmRuleChangeRequest({
        actor: await getActor(req),
        ruleId: req.params.id,
        requestId: req.params.requestId,
        requestKind: 'override'
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function cancelRuleOverrideRequestController(req, res) {
  try {
    return res.json(
      await cancelRuleChangeRequest({
        actor: await getActor(req),
        ruleId: req.params.id,
        requestId: req.params.requestId,
        requestKind: 'override'
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function requestRuleDeactivationController(req, res) {
  try {
    return res.status(201).json(
      await requestRuleDeactivation({
        ...req.body,
        actor: await getActor(req),
        ruleId: req.params.id
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function getRuleDeactivationRequestController(req, res) {
  try {
    return res.json(
      await getRuleChangeRequest({
        actor: await getActor(req),
        ruleId: req.params.id,
        requestId: req.params.requestId,
        requestKind: 'deactivation'
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function confirmRuleDeactivationRequestController(req, res) {
  try {
    return res.json(
      await confirmRuleChangeRequest({
        actor: await getActor(req),
        ruleId: req.params.id,
        requestId: req.params.requestId,
        requestKind: 'deactivation'
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function cancelRuleDeactivationRequestController(req, res) {
  try {
    return res.json(
      await cancelRuleChangeRequest({
        actor: await getActor(req),
        ruleId: req.params.id,
        requestId: req.params.requestId,
        requestKind: 'deactivation'
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function listRuntimeAssignmentsController(req, res) {
  try {
    const runtimeCapabilities = String(req.query?.runtimeCapabilities || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    return res.json(
      await listRuntimeAssignments({
        actor: await getActor(req),
        runtimeSurface: req.query?.runtimeSurface,
        runtimeCapabilities,
        ownerEmail: req.query?.ownerEmail
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function reportRuntimeEventController(req, res) {
  try {
    return res.status(201).json(await reportRuntimeEvent({ ...req.body, actor: await getActor(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function settleMeteredViolationPenaltyController(req, res) {
  try {
    return res.status(201).json(
      await settleMeteredViolationPenalty({ ...req.body, actor: await getActor(req), ruleId: req.params.id })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}
