import { randomUUID } from 'node:crypto';

import { buildConversationId } from '@saintrocky/shared';
import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { CampaignMembership } from '@saintrocky/api/models/campaign-membership';
import { Campaign } from '@saintrocky/api/models/campaign';
import { DirectMessage } from '@saintrocky/api/models/direct-message';
import { Friendship } from '@saintrocky/api/models/friendship';
import { UserRule } from '@saintrocky/api/models/user-rule';
import { User } from '@saintrocky/api/models/user';
import { MEMBER_ROLE } from '@saintrocky/shared';

import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

function createParticipant(user) {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.name || user.email
  };
}

export async function seedSocial() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  await connectMongo(mongoUri);

  await Promise.all([
    Friendship.deleteMany({}),
    DirectMessage.deleteMany({}),
    Campaign.deleteMany({}),
    CampaignMembership.deleteMany({})
  ]);

  const members = await User.find({ role: MEMBER_ROLE }).sort({ email: 1 }).lean();
  if (members.length < 4) throw new Error('Seed users before seeding social data.');

  const participants = members.map(createParticipant);
  const friendships = [];
  const messages = [];
  const campaigns = [];
  const memberships = [];
  const activeRules = await UserRule.find({ status: 'active' }).lean();
  const rulesByOwnerEmail = new Map();
  activeRules.forEach((rule) => {
    const currentRules = rulesByOwnerEmail.get(rule.ownerEmail) || [];
    currentRules.push(rule);
    rulesByOwnerEmail.set(rule.ownerEmail, currentRules);
  });

  for (let index = 0; index < participants.length - 1; index += 1) {
    const requester = participants[index];
    const addressee = participants[index + 1];
    const requestedAt = new Date(Date.now() - (index + 10) * 60 * 60 * 1000).toISOString();
    const acceptedAt = new Date(Date.now() - (index + 9) * 60 * 60 * 1000).toISOString();
    const friendshipId = randomUUID();

    friendships.push({
      friendshipId,
      requesterUserId: requester.id,
      requesterEmail: requester.email,
      requesterDisplayName: requester.displayName,
      addresseeUserId: addressee.id,
      addresseeEmail: addressee.email,
      addresseeDisplayName: addressee.displayName,
      status: 'accepted',
      requestedAt,
      respondedAt: acceptedAt,
      acceptedAt,
      lastMessageAt: acceptedAt
    });

    const conversationId = buildConversationId(requester.id, addressee.id);
    for (let messageIndex = 0; messageIndex < 4; messageIndex += 1) {
      const sender = messageIndex % 2 === 0 ? requester : addressee;
      const recipient = messageIndex % 2 === 0 ? addressee : requester;
      const createdAt = new Date(Date.now() - (index * 8 + messageIndex + 1) * 60 * 60 * 1000).toISOString();

      messages.push({
        messageId: randomUUID(),
        conversationId,
        senderUserId: sender.id,
        senderEmail: sender.email,
        senderDisplayName: sender.displayName,
        recipientUserId: recipient.id,
        recipientEmail: recipient.email,
        recipientDisplayName: recipient.displayName,
        body:
          messageIndex % 2 === 0
            ? `Lock in. We are not punting this setup tonight.`
            : `Copy. Keep the rules active and do not touch the override unless you mean it.`,
        createdAt,
        updatedAt: createdAt,
        readAt: recipient.id === addressee.id ? createdAt : null
      });
    }
  }

  for (let index = 0; index < Math.min(4, participants.length - 2); index += 1) {
    const requester = participants[index];
    const addressee = participants[index + 2];
    const requestedAt = new Date(Date.now() - (index + 3) * 60 * 60 * 1000).toISOString();

    friendships.push({
      friendshipId: randomUUID(),
      requesterUserId: requester.id,
      requesterEmail: requester.email,
      requesterDisplayName: requester.displayName,
      addresseeUserId: addressee.id,
      addresseeEmail: addressee.email,
      addresseeDisplayName: addressee.displayName,
      status: 'pending',
      requestedAt
    });
  }

  for (let index = 0; index < Math.min(3, participants.length - 3); index += 1) {
    const owner = participants[index];
    const invitedOne = participants[index + 1];
    const invitedTwo = participants[index + 2];
    const ownerRules = (rulesByOwnerEmail.get(owner.email) || []).slice(0, 2);
    if (!ownerRules.length) continue;

    const startsAt = new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + (index + 8) * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString();
    const campaignId = randomUUID();

    campaigns.push({
      campaignId,
      ownerUserId: owner.id,
      ownerEmail: owner.email,
      ownerDisplayName: owner.displayName,
      title: `${owner.displayName.split(' ')[0]}'s Seven Day Lock-In`,
      description: 'Shared discipline challenge with synchronized rules and the same accountability window.',
      status: 'active',
      startsAt,
      endsAt,
      sharedRules: ownerRules.map((rule) => ({
        id: rule.ruleId,
        title: rule.title,
        summary: rule.summary,
        templateKey: rule.templateKey,
        config: rule.config,
        problemIndex: rule.problemIndex,
        lockedStakeLamports: rule.lockedStakeLamports
      })),
      createdAt,
      updatedAt: createdAt
    });

    memberships.push(
      {
        membershipId: randomUUID(),
        campaignId,
        userId: owner.id,
        userEmail: owner.email,
        userDisplayName: owner.displayName,
        invitedByUserId: owner.id,
        invitedByEmail: owner.email,
        role: 'owner',
        status: 'active',
        invitedAt: createdAt,
        respondedAt: createdAt,
        joinedAt: createdAt
      },
      {
        membershipId: randomUUID(),
        campaignId,
        userId: invitedOne.id,
        userEmail: invitedOne.email,
        userDisplayName: invitedOne.displayName,
        invitedByUserId: owner.id,
        invitedByEmail: owner.email,
        role: 'member',
        status: 'active',
        invitedAt: createdAt,
        respondedAt: createdAt,
        joinedAt: createdAt
      },
      {
        membershipId: randomUUID(),
        campaignId,
        userId: invitedTwo.id,
        userEmail: invitedTwo.email,
        userDisplayName: invitedTwo.displayName,
        invitedByUserId: owner.id,
        invitedByEmail: owner.email,
        role: 'member',
        status: 'invited',
        invitedAt: createdAt
      }
    );
  }

  await Friendship.insertMany(friendships);
  await DirectMessage.insertMany(messages);
  await Campaign.insertMany(campaigns);
  await CampaignMembership.insertMany(memberships);

  await disconnectMongo();
  console.log(
    `[seed] social seeded: friendships=${friendships.length}, messages=${messages.length}, campaigns=${campaigns.length}`
  );
}

runSeedScript(import.meta.url, seedSocial);
