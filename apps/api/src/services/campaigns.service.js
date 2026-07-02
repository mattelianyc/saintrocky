import { randomUUID } from 'node:crypto';

import { buildCampaignsChannel } from '@saintrocky/realtime';
import {
  CAMPAIGN_MEMBERSHIP_STATUSES,
  CAMPAIGN_STATUSES,
  MAX_CAMPAIGN_RULES
} from '@saintrocky/shared';

import { env } from '../config/env.js';
import { connectMongo } from '../db/mongo.js';
import { CampaignMembership } from '../models/campaign-membership.model.js';
import { Campaign } from '../models/campaign.model.js';
import { Friendship } from '../models/friendship.model.js';
import { User } from '../models/user.model.js';
import { publishSnapshot } from './realtime.service.js';
import { resolveRuleActor } from './rules-access.service.js';

function buildCampaignError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.payload = { ok: false, code, message };
  return error;
}

async function ensureMongo() {
  if (!env.mongodbUri) {
    throw buildCampaignError(500, 'CAMPAIGNS_CONFIGURATION_INVALID', 'MongoDB is required for campaigns.');
  }

  await connectMongo(env.mongodbUri);
}

function toIsoNow() {
  return new Date().toISOString();
}

function normalizeUser(user) {
  return {
    id: String(user._id || user.id),
    email: String(user.email || '').trim().toLowerCase(),
    displayName: user.name || user.displayName || user.email
  };
}

async function findUsersByIds(userIds = []) {
  const users = await User.find({ _id: { $in: userIds } }).lean();
  return new Map(users.map((user) => [String(user._id), normalizeUser(user)]));
}

async function getAcceptedFriendEmails(actorEmail) {
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ requesterEmail: actorEmail }, { addresseeEmail: actorEmail }]
  }).lean();

  return new Set(
    friendships.map((friendship) =>
      friendship.requesterEmail === actorEmail ? friendship.addresseeEmail : friendship.requesterEmail
    )
  );
}

async function publishCampaignSnapshot(email) {
  const actor = await resolveRuleActor({ email });
  const response = await listCampaigns({ actor });
  publishSnapshot(buildCampaignsChannel(actor.email), response);
}

function normalizeSharedRules(sharedRules = []) {
  if (!Array.isArray(sharedRules) || sharedRules.length === 0) {
    throw buildCampaignError(400, 'BAD_REQUEST', 'At least one shared rule is required.');
  }
  if (sharedRules.length > MAX_CAMPAIGN_RULES) {
    throw buildCampaignError(400, 'BAD_REQUEST', `Campaigns may include at most ${MAX_CAMPAIGN_RULES} shared rules.`);
  }

  return sharedRules.map((rule, index) => ({
    id: String(rule.id || rule.ruleId || `campaign-rule-${index + 1}`),
    title: String(rule.title || '').trim(),
    summary: String(rule.summary || '').trim(),
    templateKey: String(rule.templateKey || '').trim() || null,
    config: rule.config || {},
    problemIndex: Number(rule.problemIndex) || 50,
    lockedStakeLamports: Number(rule.lockedStakeLamports) || 0
  }));
}

export async function listCampaigns(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);

  const memberships = await CampaignMembership.find({ userEmail: actor.email })
    .sort({ invitedAt: -1 })
    .lean();
  const campaignIds = memberships.map((membership) => membership.campaignId);
  const campaigns = await Campaign.find({ campaignId: { $in: campaignIds } }).sort({ startsAt: 1 }).lean();
  const campaignMap = new Map(campaigns.map((campaign) => [campaign.campaignId, campaign]));

  const groupedCampaigns = memberships
    .map((membership) => ({
      membership,
      campaign: campaignMap.get(membership.campaignId)
    }))
    .filter((entry) => entry.campaign)
    .map((entry) => ({
      ...entry.campaign,
      membership: entry.membership
    }));

  return {
    ok: true,
    actor,
    active: groupedCampaigns.filter((entry) => entry.membership.status === 'active'),
    invitations: groupedCampaigns.filter((entry) => entry.membership.status === 'invited'),
    history: groupedCampaigns.filter((entry) => entry.membership.status !== 'active' && entry.membership.status !== 'invited'),
    campaignStatuses: CAMPAIGN_STATUSES,
    membershipStatuses: CAMPAIGN_MEMBERSHIP_STATUSES
  };
}

export async function createCampaign(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();
  const startsAt = new Date(payload.startsAt || '');
  const endsAt = new Date(payload.endsAt || '');

  if (!title) {
    throw buildCampaignError(400, 'BAD_REQUEST', 'Campaign title is required.');
  }
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw buildCampaignError(400, 'BAD_REQUEST', 'Campaign start and end dates must form a valid range.');
  }

  const sharedRules = normalizeSharedRules(payload.sharedRules);
  const invitedUserIds = [...new Set((payload.invitedUserIds || []).map((value) => String(value)))];
  const userMap = await findUsersByIds(invitedUserIds);
  const acceptedFriendEmails = await getAcceptedFriendEmails(actor.email);

  const invitees = invitedUserIds
    .map((userId) => userMap.get(userId))
    .filter(Boolean)
    .filter((user) => user.email !== actor.email);

  if (invitees.some((invitee) => !acceptedFriendEmails.has(invitee.email))) {
    throw buildCampaignError(403, 'FORBIDDEN', 'Campaign invites are limited to accepted friends.');
  }

  const timestamp = toIsoNow();
  const campaignId = randomUUID();

  await Campaign.create({
    campaignId,
    ownerUserId: actor.id,
    ownerEmail: actor.email,
    ownerDisplayName: actor.displayName,
    title,
    description,
    status: 'active',
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    sharedRules,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  await CampaignMembership.insertMany([
    {
      membershipId: randomUUID(),
      campaignId,
      userId: actor.id,
      userEmail: actor.email,
      userDisplayName: actor.displayName,
      invitedByUserId: actor.id,
      invitedByEmail: actor.email,
      role: 'owner',
      status: 'active',
      invitedAt: timestamp,
      respondedAt: timestamp,
      joinedAt: timestamp
    },
    ...invitees.map((invitee) => ({
      membershipId: randomUUID(),
      campaignId,
      userId: invitee.id,
      userEmail: invitee.email,
      userDisplayName: invitee.displayName,
      invitedByUserId: actor.id,
      invitedByEmail: actor.email,
      role: 'member',
      status: 'invited',
      invitedAt: timestamp
    }))
  ]);

  await Promise.all([actor.email, ...invitees.map((invitee) => invitee.email)].map((email) => publishCampaignSnapshot(email)));

  return {
    ok: true,
    campaignId
  };
}

export async function respondToCampaignInvite(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const action = String(payload.action || '').trim().toLowerCase();
  const membership = await CampaignMembership.findOne({
    campaignId: payload.campaignId,
    userEmail: actor.email
  }).lean();

  if (!membership) {
    throw buildCampaignError(404, 'NOT_FOUND', 'Campaign invite not found.');
  }

  const timestamp = toIsoNow();
  let updates = null;
  if (action === 'accept') {
    updates = { status: 'active', respondedAt: timestamp, joinedAt: timestamp };
  } else if (action === 'decline') {
    updates = { status: 'declined', respondedAt: timestamp };
  } else if (action === 'leave') {
    updates = { status: 'left', respondedAt: timestamp, leftAt: timestamp };
  } else {
    throw buildCampaignError(400, 'BAD_REQUEST', 'Unsupported campaign action.');
  }

  await CampaignMembership.updateOne({ membershipId: membership.membershipId }, updates);
  const campaign = await Campaign.findOne({ campaignId: payload.campaignId }).lean();

  await Promise.all([actor.email, campaign.ownerEmail].map((email) => publishCampaignSnapshot(email)));

  return { ok: true };
}
