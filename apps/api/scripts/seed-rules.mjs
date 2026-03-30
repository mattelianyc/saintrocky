import { randomUUID } from 'node:crypto';

import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { RuleDraft } from '@saintrocky/api/models/rule-draft';
import { RuleRuntimeEvent } from '@saintrocky/api/models/rule-runtime-event';
import { UserRule } from '@saintrocky/api/models/user-rule';
import { User } from '@saintrocky/api/models/user';
import {
  MEMBER_ROLE,
  buildCompiledRuleFromTemplate,
  foundationalRuleTemplates,
  getRuleEditTimingQuote
} from '@saintrocky/shared';
import {
  calculateLockedStake,
  clampProblemIndex
} from '@saintrocky/fuckyoupayme';
import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

const timezones = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London'];

const tradingDomainSets = [
  'pump.fun, jup.ag, raydium.io',
  'pump.fun, orca.so, dexscreener.com',
  'jup.ag, raydium.io, birdeye.so',
  'pump.fun, jup.ag, gmgn.ai'
];

const walletAppSets = [
  'Phantom, Solflare',
  'Phantom, Backpack',
  'Solflare, Backpack'
];

const templateProblemIndexMap = {
  'max-trades-per-day': 62,
  'max-position-size': 74,
  'no-trading-during-hours': 56,
  'no-fomo-buys': 81,
  'cooldown-after-loss': 69,
  'max-daily-loss': 77,
  'manual-trading-lock': 88,
  'block-domains-on-schedule': 41,
  'block-apps-on-schedule': 36
};

function getTemplate(templateId) {
  return foundationalRuleTemplates.find((template) => template.templateId === templateId);
}

function buildTemplateConfig(template, member, index) {
  switch (template.key) {
    case 'max-trades-per-day':
      return { maxTrades: 3 + (index % 8), blockedDomains: tradingDomainSets[index % tradingDomainSets.length] };
    case 'max-position-size':
      return { maxPositionSizeSol: 1 + (index % 5) };
    case 'no-trading-during-hours':
      return {
        blockedStart: index % 2 === 0 ? '00:00' : '22:00',
        blockedEnd: index % 2 === 0 ? '06:00' : '23:59',
        timezone: timezones[index % timezones.length],
        blockedDomains: tradingDomainSets[index % tradingDomainSets.length],
        blockedApps: walletAppSets[index % walletAppSets.length]
      };
    case 'no-fomo-buys':
      return { minTokenAgeHours: 1 + (index % 3) };
    case 'cooldown-after-loss':
      return {
        cooldownMinutes: 15 + (index % 4) * 15,
        blockedDomains: tradingDomainSets[index % tradingDomainSets.length],
        blockedApps: walletAppSets[index % walletAppSets.length]
      };
    case 'max-daily-loss':
      return { maxDailyLossSol: 3 + (index % 8), blockedDomains: tradingDomainSets[index % tradingDomainSets.length] };
    case 'manual-trading-lock':
      return {
        blockedDomains: tradingDomainSets[index % tradingDomainSets.length],
        blockedApps: walletAppSets[index % walletAppSets.length],
        lockLabel: `${member.name.split(' ')[0]}'s lock`
      };
    case 'block-domains-on-schedule':
      return {
        blockedDomains: 'amazon.com, doordash.com, ubereats.com',
        sessionStart: '22:00',
        sessionEnd: '06:00',
        timezone: timezones[index % timezones.length]
      };
    case 'block-apps-on-schedule':
      return {
        blockedApps: 'Discord, Slack, Steam',
        sessionStart: '09:00',
        sessionEnd: '17:00',
        timezone: timezones[index % timezones.length]
      };
    default:
      return { ...(template.defaultConfig || {}) };
  }
}

function inferSurfaces(compiledRule) {
  const surfaces = [];
  const targets = compiledRule?.targets || [];
  if (targets.some((t) => t.type === 'domain')) surfaces.push('browser_extension');
  if (targets.some((t) => t.type === 'app')) surfaces.push('desktop_runtime');
  if (compiledRule?.chainConstraints) surfaces.push('chain_watcher');
  return surfaces;
}

function resolveProblemIndex(template, index, status) {
  const baseline = templateProblemIndexMap[template.key] ?? 50;
  const variance = ((index * 17) % 19) - 9;
  const statusOffset =
    status === 'archived' ? -10 : status === 'paused' ? -5 : 0;
  return clampProblemIndex(baseline + variance + statusOffset);
}

function buildUserRule({ member, template, index, status }) {
  const timestamp = new Date(Date.now() - index * 60_000).toISOString();
  const config = buildTemplateConfig(template, member, index);
  const compiledRule = buildCompiledRuleFromTemplate(template, config);
  const problemIndex = resolveProblemIndex(template, index, status);
  const lockedStakeLamports = calculateLockedStake(problemIndex);

  return {
    ruleId: randomUUID(),
    ownerUserId: String(member._id),
    ownerDisplayName: member.name,
    ownerEmail: member.email,
    ownerRole: member.role,
    source: 'template',
    templateId: template.templateId,
    templateKey: template.key,
    draftId: null,
    status,
    title: template.title,
    summary: compiledRule.summary,
    problemIndex,
    lockedStakeLamports,
    config,
    compiledRule,
    bypassPolicy: compiledRule.bypass,
    enforcementSurfaces: inferSurfaces(compiledRule),
    pendingEdit: null,
    editHistory: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastRuntimeEventAt: null,
    lastRuntimeEventType: null
  };
}

function buildDraft({ member, template, index, status }) {
  const timestamp = new Date(Date.now() - index * 45_000).toISOString();
  const config = buildTemplateConfig(template, member, index);
  const compiledRule = status === 'ready_for_activation' ? buildCompiledRuleFromTemplate(template, config) : null;
  const problemIndex = resolveProblemIndex(template, index, status === 'ready_for_activation' ? 'active' : 'paused');
  const lockedStakeLamports = calculateLockedStake(problemIndex);

  return {
    id: randomUUID(),
    authorUserId: String(member._id),
    authorDisplayName: member.name,
    authorEmail: member.email,
    authorRole: member.role,
    status,
    statusHistory: [
      { status: 'draft_submitted', at: timestamp },
      { status, at: timestamp }
    ],
    naturalLanguageDraft:
      status === 'ready_for_activation'
        ? `${template.title} for ${member.name} using the sleep-on-it override model.`
        : `Create a stricter version of "${template.title}" for ${member.name}.`,
    clarificationAnswers: [],
    clarificationQuestions:
      status === 'ready_for_activation'
        ? []
        : [{ id: `question-${index}`, question: 'Which exact tokens or domains should this rule cover?' }],
    compiledRule,
    enforcementSurface: compiledRule ? inferSurfaces(compiledRule)[0] || null : null,
    enforcementAction: compiledRule?.enforcement?.action || null,
    bypassAllowed: compiledRule?.bypass?.allowed ?? false,
    bypassFeeModel: compiledRule?.bypass?.feeModel || 'none',
    problemIndex,
    lockedStakeLamports,
    confidenceScore: status === 'ready_for_activation' ? 1 : 0.62,
    validationNotes:
      status === 'ready_for_activation' ? [] : ['Need a more explicit target list before activation.'],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function buildRuntimeEvent(rule, index, eventType) {
  const surfaces = inferSurfaces(rule.compiledRule);
  return {
    eventId: randomUUID(),
    ruleId: rule.ruleId,
    ownerUserId: rule.ownerUserId,
    ownerEmail: rule.ownerEmail,
    runtimeSurface: surfaces[0] || 'browser_extension',
    eventType,
    occurredAt: new Date(Date.now() - index * 30_000).toISOString(),
    details: { source: 'seed', templateKey: rule.templateKey }
  };
}

export async function seedRules() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  await connectMongo(mongoUri);
  await Promise.all([RuleRuntimeEvent.deleteMany({}), UserRule.deleteMany({}), RuleDraft.deleteMany({})]);

  const members = await User.find({ role: MEMBER_ROLE }).sort({ email: 1 }).lean();
  if (!members.length) throw new Error('Seed users before seeding rules.');

  const maxTradesTemplate = getTemplate('template-max-trades-per-day');
  const maxPositionTemplate = getTemplate('template-max-position-size');
  const noTradingTemplate = getTemplate('template-no-trading-during-hours');
  const fomoTemplate = getTemplate('template-no-fomo-buys');
  const cooldownTemplate = getTemplate('template-cooldown-after-loss');
  const maxLossTemplate = getTemplate('template-max-daily-loss');
  const lockTemplate = getTemplate('template-manual-trading-lock');
  const blockDomainsTemplate = getTemplate('template-block-domains-on-schedule');
  const blockAppsTemplate = getTemplate('template-block-apps-on-schedule');

  const userRules = [];
  const ruleDrafts = [];
  const runtimeEvents = [];

  members.forEach((member, index) => {
    const seededRules = [
      buildUserRule({ member, template: maxTradesTemplate, index, status: 'active' }),
      buildUserRule({ member, template: maxPositionTemplate, index: index + 100, status: 'active' }),
      buildUserRule({ member, template: noTradingTemplate, index: index + 200, status: index % 3 === 0 ? 'paused' : 'active' }),
      buildUserRule({ member, template: fomoTemplate, index: index + 300, status: 'active' }),
      buildUserRule({ member, template: cooldownTemplate, index: index + 400, status: index % 4 === 0 ? 'paused' : 'active' }),
      buildUserRule({ member, template: maxLossTemplate, index: index + 500, status: index % 5 === 0 ? 'paused' : 'active' }),
      buildUserRule({ member, template: lockTemplate, index: index + 600, status: index % 6 === 0 ? 'archived' : 'paused' })
    ];

    if (index % 2 === 0) {
      seededRules.push(buildUserRule({ member, template: blockDomainsTemplate, index: index + 700, status: 'active' }));
    }
    if (index % 3 === 0) {
      seededRules.push(buildUserRule({ member, template: blockAppsTemplate, index: index + 800, status: 'active' }));
    }

    const activeRules = seededRules.filter((rule) => rule.status === 'active').slice(0, 3);
    activeRules.forEach((rule, eventIndex) => {
      const eventType = eventIndex % 3 === 0 ? 'rule_triggered' : eventIndex % 3 === 1 ? 'bypass_accepted' : 'chain_violation_detected';
      const event = buildRuntimeEvent(rule, index + eventIndex, eventType);
      rule.lastRuntimeEventAt = event.occurredAt;
      rule.lastRuntimeEventType = event.eventType;
      rule.updatedAt = event.occurredAt;
      runtimeEvents.push(event);
    });

    if (index % 4 === 0) {
      const scheduledQuote = getRuleEditTimingQuote('delay_24h', new Date(Date.now() - 2 * 60 * 60 * 1000));
      const scheduledConfig = buildTemplateConfig(maxTradesTemplate, member, index + 900);
      const scheduledCompiledRule = buildCompiledRuleFromTemplate(maxTradesTemplate, scheduledConfig);
      const scheduledProblemIndex = resolveProblemIndex(maxTradesTemplate, index + 900, 'active');
      seededRules[0].pendingEdit = {
        timingOption: scheduledQuote.timingOption,
        feeSol: scheduledQuote.feeSol,
        paymentRequired: scheduledQuote.paymentRequired,
        requestedAt: scheduledQuote.requestedAt,
        effectiveAt: scheduledQuote.effectiveAt,
        requestedByEmail: member.email,
        title: maxTradesTemplate.title,
        summary: scheduledCompiledRule.summary,
        problemIndex: scheduledProblemIndex,
        lockedStakeLamports: calculateLockedStake(scheduledProblemIndex),
        config: scheduledConfig,
        compiledRule: scheduledCompiledRule
      };
    }

    userRules.push(...seededRules);

    if (index % 2 === 0) {
      ruleDrafts.push(buildDraft({ member, template: fomoTemplate, index: index + 1000, status: 'ready_for_activation' }));
    }
    if (index % 3 === 0) {
      ruleDrafts.push(buildDraft({ member, template: cooldownTemplate, index: index + 1100, status: 'needs_clarification' }));
    }
  });

  await UserRule.insertMany(userRules);
  await RuleDraft.insertMany(ruleDrafts);
  await RuleRuntimeEvent.insertMany(runtimeEvents);

  await disconnectMongo();
  console.log(`[seed] rules seeded: members=${members.length}, rules=${userRules.length}, drafts=${ruleDrafts.length}, events=${runtimeEvents.length}`);
}

runSeedScript(import.meta.url, seedRules);
