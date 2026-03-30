import { randomUUID } from 'node:crypto';

import { buildFriendsChannel } from '@saintrocky/realtime';
import { MEMBER_ROLE } from '@saintrocky/shared';

import { env } from '../config/env.js';
import { connectMongo } from '../db/mongo.js';
import { Friendship } from '../models/friendship.model.js';
import { User } from '../models/user.model.js';
import { publishSnapshot } from './realtime.service.js';
import { resolveRuleActor } from './rules-access.service.js';

function buildSocialError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.payload = { ok: false, code, message };
  return error;
}

async function ensureMongo() {
  if (!env.mongodbUri) {
    throw buildSocialError(500, 'FRIENDSHIPS_CONFIGURATION_INVALID', 'MongoDB is required for friendships.');
  }

  await connectMongo(env.mongodbUri);
}

function toIsoNow() {
  return new Date().toISOString();
}

function normalizeParticipant(user) {
  return {
    id: String(user._id || user.id),
    email: String(user.email || '').trim().toLowerCase(),
    displayName: user.name || user.displayName || user.email
  };
}

function buildPairKey(firstEmail, secondEmail) {
  return [String(firstEmail || '').trim().toLowerCase(), String(secondEmail || '').trim().toLowerCase()]
    .filter(Boolean)
    .sort()
    .join('__');
}

function getCounterparty(friendship, actorEmail) {
  const normalizedActorEmail = String(actorEmail || '').trim().toLowerCase();
  if (friendship.requesterEmail === normalizedActorEmail) {
    return {
      id: friendship.addresseeUserId,
      email: friendship.addresseeEmail,
      displayName: friendship.addresseeDisplayName
    };
  }

  return {
    id: friendship.requesterUserId,
    email: friendship.requesterEmail,
    displayName: friendship.requesterDisplayName
  };
}

function formatFriendship(actor, friendship) {
  return {
    friendshipId: friendship.friendshipId,
    status: friendship.status,
    requestedAt: friendship.requestedAt,
    respondedAt: friendship.respondedAt,
    acceptedAt: friendship.acceptedAt,
    lastMessageAt: friendship.lastMessageAt,
    direction: friendship.requesterEmail === actor.email ? 'outgoing' : 'incoming',
    counterparty: getCounterparty(friendship, actor.email)
  };
}

async function findMemberUser({ userId, email }) {
  const query = userId
    ? { _id: userId, role: MEMBER_ROLE }
    : { email: String(email || '').trim().toLowerCase(), role: MEMBER_ROLE };
  const user = await User.findOne(query).lean();
  return user ? normalizeParticipant(user) : null;
}

async function findFriendshipBetween(firstEmail, secondEmail) {
  return Friendship.findOne({
    $or: [
      { requesterEmail: firstEmail, addresseeEmail: secondEmail },
      { requesterEmail: secondEmail, addresseeEmail: firstEmail }
    ]
  }).lean();
}

async function publishFriendshipSnapshot(email) {
  const actor = await resolveRuleActor({ email });
  const response = await listFriendships({ actor });
  publishSnapshot(buildFriendsChannel(actor.email), response);
}

export async function listFriendships(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);

  const [friendships, members] = await Promise.all([
    Friendship.find({
      $or: [{ requesterEmail: actor.email }, { addresseeEmail: actor.email }]
    })
      .sort({ requestedAt: -1 })
      .lean(),
    User.find({ role: MEMBER_ROLE }).sort({ name: 1, email: 1 }).lean()
  ]);

  const pendingIncoming = [];
  const pendingOutgoing = [];
  const friends = [];
  const blocked = [];
  const relationshipEmails = new Set([actor.email]);

  friendships.forEach((friendship) => {
    relationshipEmails.add(friendship.requesterEmail);
    relationshipEmails.add(friendship.addresseeEmail);
    const formattedFriendship = formatFriendship(actor, friendship);

    if (friendship.status === 'accepted') {
      friends.push(formattedFriendship);
      return;
    }
    if (friendship.status === 'pending' && formattedFriendship.direction === 'incoming') {
      pendingIncoming.push(formattedFriendship);
      return;
    }
    if (friendship.status === 'pending') {
      pendingOutgoing.push(formattedFriendship);
      return;
    }
    if (friendship.status === 'blocked') {
      blocked.push(formattedFriendship);
    }
  });

  const suggestions = members
    .map(normalizeParticipant)
    .filter((member) => !relationshipEmails.has(member.email))
    .slice(0, 12);

  return {
    ok: true,
    actor,
    friends,
    pendingIncoming,
    pendingOutgoing,
    blocked,
    suggestions
  };
}

export async function requestFriendship(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const target = await findMemberUser({
    userId: payload.targetUserId,
    email: payload.targetEmail
  });

  if (!target) {
    throw buildSocialError(404, 'NOT_FOUND', 'Target member not found.');
  }
  if (target.email === actor.email) {
    throw buildSocialError(400, 'BAD_REQUEST', 'You cannot friend yourself.');
  }

  const existingFriendship = await findFriendshipBetween(actor.email, target.email);
  const timestamp = toIsoNow();

  if (existingFriendship?.status === 'accepted') {
    throw buildSocialError(409, 'FRIENDSHIP_EXISTS', 'You are already friends.');
  }
  if (existingFriendship?.status === 'blocked') {
    throw buildSocialError(409, 'FRIENDSHIP_BLOCKED', 'This friendship is blocked.');
  }
  if (existingFriendship?.status === 'pending' && existingFriendship.requesterEmail === actor.email) {
    throw buildSocialError(409, 'REQUEST_ALREADY_SENT', 'Friend request already sent.');
  }

  let friendship = null;

  if (existingFriendship?.status === 'pending') {
    friendship = await Friendship.findOneAndUpdate(
      { friendshipId: existingFriendship.friendshipId },
      {
        status: 'accepted',
        respondedAt: timestamp,
        acceptedAt: timestamp,
        declinedAt: null,
        blockedAt: null,
        blockedByUserId: null
      },
      { new: true }
    ).lean();
  } else {
    friendship = await Friendship.create({
      friendshipId: randomUUID(),
      requesterUserId: actor.id,
      requesterEmail: actor.email,
      requesterDisplayName: actor.displayName,
      addresseeUserId: target.id,
      addresseeEmail: target.email,
      addresseeDisplayName: target.displayName,
      status: 'pending',
      requestedAt: timestamp
    });
    friendship = friendship.toObject();
  }

  await Promise.all([
    publishFriendshipSnapshot(actor.email),
    publishFriendshipSnapshot(target.email)
  ]);

  return {
    ok: true,
    friendship: formatFriendship(actor, friendship)
  };
}

export async function respondToFriendship(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const action = String(payload.action || '').trim().toLowerCase();
  const friendship = await Friendship.findOne({ friendshipId: payload.friendshipId }).lean();

  if (!friendship) {
    throw buildSocialError(404, 'NOT_FOUND', 'Friend request not found.');
  }

  const isAddressee = friendship.addresseeEmail === actor.email;
  const isParticipant =
    friendship.addresseeEmail === actor.email || friendship.requesterEmail === actor.email;

  if (!isParticipant) {
    throw buildSocialError(403, 'FORBIDDEN', 'You may only manage your own friendships.');
  }

  const timestamp = toIsoNow();
  let updates = null;

  if (action === 'accept') {
    if (!isAddressee) {
      throw buildSocialError(403, 'FORBIDDEN', 'Only the invited member can accept this request.');
    }
    updates = { status: 'accepted', respondedAt: timestamp, acceptedAt: timestamp, declinedAt: null };
  } else if (action === 'decline') {
    if (!isAddressee) {
      throw buildSocialError(403, 'FORBIDDEN', 'Only the invited member can decline this request.');
    }
    updates = { status: 'declined', respondedAt: timestamp, declinedAt: timestamp, acceptedAt: null };
  } else if (action === 'block') {
    updates = {
      status: 'blocked',
      respondedAt: timestamp,
      blockedAt: timestamp,
      blockedByUserId: actor.id,
      acceptedAt: null
    };
  } else if (action === 'remove') {
    await Friendship.deleteOne({ friendshipId: payload.friendshipId });
    await Promise.all([
      publishFriendshipSnapshot(friendship.requesterEmail),
      publishFriendshipSnapshot(friendship.addresseeEmail)
    ]);
    return { ok: true };
  } else {
    throw buildSocialError(400, 'BAD_REQUEST', 'Unsupported friendship action.');
  }

  const updatedFriendship = await Friendship.findOneAndUpdate(
    { friendshipId: payload.friendshipId },
    updates,
    { new: true }
  ).lean();

  await Promise.all([
    publishFriendshipSnapshot(updatedFriendship.requesterEmail),
    publishFriendshipSnapshot(updatedFriendship.addresseeEmail)
  ]);

  return {
    ok: true,
    friendship: formatFriendship(actor, updatedFriendship)
  };
}

export function buildFriendshipLookupKey(firstEmail, secondEmail) {
  return buildPairKey(firstEmail, secondEmail);
}
