import {
  createCampaign,
  listCampaigns,
  respondToCampaignInvite
} from '../services/campaigns.service.js';
import { requireUser } from '../utils/auth.js';

function respondWithError(res, error) {
  return res.status(error.status || 500).json(
    error.payload || { ok: false, code: 'CAMPAIGNS_ERROR', message: error?.message || 'Campaign request failed.' }
  );
}

export async function listCampaignsController(req, res) {
  try {
    return res.json(await listCampaigns({ actor: await requireUser(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function createCampaignController(req, res) {
  try {
    return res.status(201).json(await createCampaign({ ...req.body, actor: await requireUser(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function respondToCampaignInviteController(req, res) {
  try {
    return res.json(
      await respondToCampaignInvite({
        campaignId: req.params.id,
        action: req.body?.action,
        actor: await requireUser(req)
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}
