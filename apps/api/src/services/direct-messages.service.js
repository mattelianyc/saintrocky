import { randomUUID } from 'node:crypto';

import { buildConversationId, MAX_DIRECT_MESSAGE_LENGTH } from '@saintrocky/shared';
import { buildDirectMessagesChannel } from '@saintrocky/realtime';

import { env } from '../config/env.js';
import { connectMongo } from '../db/mongo.js';
import { DirectMessage } from '../models/direct-message.model.js';
import { Friendship } from '../models/friendship.model.js';
import { User } from '../models/user.model.js';
import { publishEvent } from './realtime.service.js';
import { resolveRuleActor } from './rules-access.service.js';

function buildChatError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.payload = { ok: false, code, message };
  return error;
}

async function ensureMongo() {
  if (!env.mongodbUri) {
    throw buildChatError(500, 'DIRECT_MESSAGES_CONFIGURATION_INVALID', 'MongoDB is required for direct messages.');
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

function formatMessage(message) {
  return {
    messageId: message.messageId,
    conversationId: message.conversationId,
    body: message.body,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    readAt: message.readAt,
    sender: {
      id: message.senderUserId,
      email: message.senderEmail,
      displayName: message.senderDisplayName
    },
    recipient: {
      id: message.recipientUserId,
      email: message.recipientEmail,
      displayName: message.recipientDisplayName
    }
  };
}

async function findUserById(userId) {
  const user = await User.findById(userId).lean();
  return user ? normalizeUser(user) : null;
}

async function assertAcceptedFriendship(actorEmail, counterpartyEmail) {
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requesterEmail: actorEmail, addresseeEmail: counterpartyEmail },
      { requesterEmail: counterpartyEmail, addresseeEmail: actorEmail }
    ]
  }).lean();

  if (!friendship) {
    throw buildChatError(403, 'DIRECT_MESSAGES_FORBIDDEN', 'You may only message accepted friends.');
  }

  return friendship;
}

async function buildConversationSummary(actor, friendship, latestMessageMap, unreadCountMap) {
  const counterparty =
    friendship.requesterEmail === actor.email
      ? {
          id: friendship.addresseeUserId,
          email: friendship.addresseeEmail,
          displayName: friendship.addresseeDisplayName
        }
      : {
          id: friendship.requesterUserId,
          email: friendship.requesterEmail,
          displayName: friendship.requesterDisplayName
        };
  const conversationId = buildConversationId(actor.id, counterparty.id);

  return {
    conversationId,
    friendshipId: friendship.friendshipId,
    counterparty,
    lastMessage: latestMessageMap.get(conversationId) || null,
    unreadCount: unreadCountMap.get(conversationId) || 0,
    lastMessageAt: friendship.lastMessageAt || latestMessageMap.get(conversationId)?.createdAt || friendship.acceptedAt
  };
}

export async function listDirectMessageThreads(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);

  const [friendships, recentMessages, unreadCounts] = await Promise.all([
    Friendship.find({
      status: 'accepted',
      $or: [{ requesterEmail: actor.email }, { addresseeEmail: actor.email }]
    }).lean(),
    DirectMessage.find({
      $or: [{ senderEmail: actor.email }, { recipientEmail: actor.email }]
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    DirectMessage.aggregate([
      { $match: { recipientEmail: actor.email, readAt: null } },
      { $group: { _id: '$conversationId', unreadCount: { $sum: 1 } } }
    ])
  ]);

  const latestMessageMap = new Map();
  recentMessages.forEach((message) => {
    if (!latestMessageMap.has(message.conversationId)) {
      latestMessageMap.set(message.conversationId, formatMessage(message));
    }
  });

  const unreadCountMap = new Map(
    unreadCounts.map((entry) => [entry._id, entry.unreadCount])
  );

  const threads = await Promise.all(
    friendships.map((friendship) =>
      buildConversationSummary(actor, friendship, latestMessageMap, unreadCountMap)
    )
  );

  threads.sort((left, right) => String(right.lastMessageAt || '').localeCompare(String(left.lastMessageAt || '')));

  return {
    ok: true,
    actor,
    threads
  };
}

export async function listDirectMessages(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const counterparty = await findUserById(payload.counterpartyUserId);

  if (!counterparty) {
    throw buildChatError(404, 'NOT_FOUND', 'Conversation participant not found.');
  }

  await assertAcceptedFriendship(actor.email, counterparty.email);

  const conversationId = buildConversationId(actor.id, counterparty.id);
  const messages = await DirectMessage.find({ conversationId }).sort({ createdAt: 1 }).limit(250).lean();

  return {
    ok: true,
    conversationId,
    counterparty,
    messages: messages.map(formatMessage)
  };
}

export async function sendDirectMessage(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const counterparty = await findUserById(payload.recipientUserId);
  const body = String(payload.body || '').trim();

  if (!counterparty) {
    throw buildChatError(404, 'NOT_FOUND', 'Recipient not found.');
  }
  if (!body) {
    throw buildChatError(400, 'BAD_REQUEST', 'Message body is required.');
  }
  if (body.length > MAX_DIRECT_MESSAGE_LENGTH) {
    throw buildChatError(400, 'BAD_REQUEST', `Messages may not exceed ${MAX_DIRECT_MESSAGE_LENGTH} characters.`);
  }

  const friendship = await assertAcceptedFriendship(actor.email, counterparty.email);
  const timestamp = toIsoNow();
  const conversationId = buildConversationId(actor.id, counterparty.id);

  const message = await DirectMessage.create({
    messageId: randomUUID(),
    conversationId,
    senderUserId: actor.id,
    senderEmail: actor.email,
    senderDisplayName: actor.displayName,
    recipientUserId: counterparty.id,
    recipientEmail: counterparty.email,
    recipientDisplayName: counterparty.displayName,
    body,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  await Friendship.updateOne(
    { friendshipId: friendship.friendshipId },
    { lastMessageAt: timestamp }
  );

  const formattedMessage = formatMessage(message.toObject());
  [actor.email, counterparty.email].forEach((email) => {
    publishEvent(buildDirectMessagesChannel(email), 'direct_message.created', {
      conversationId,
      message: formattedMessage
    });
  });

  return {
    ok: true,
    conversationId,
    message: formattedMessage
  };
}

export async function markDirectMessagesRead(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const counterparty = await findUserById(payload.counterpartyUserId);

  if (!counterparty) {
    throw buildChatError(404, 'NOT_FOUND', 'Conversation participant not found.');
  }

  await assertAcceptedFriendship(actor.email, counterparty.email);

  const conversationId = buildConversationId(actor.id, counterparty.id);
  const readAt = toIsoNow();

  const result = await DirectMessage.updateMany(
    { conversationId, recipientEmail: actor.email, readAt: null },
    { readAt, updatedAt: readAt }
  );

  if (result.modifiedCount > 0) {
    publishEvent(buildDirectMessagesChannel(actor.email), 'direct_message.read', {
      conversationId,
      readCount: result.modifiedCount || 0
    });
  }

  return {
    ok: true,
    conversationId,
    readCount: result.modifiedCount || 0
  };
}
