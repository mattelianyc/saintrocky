import { createChatCompletion } from '@saintrocky/chatbot/server';
import {
  RULE_BYPASS_FEE_MODELS,
  RULE_CONFIDENCE_THRESHOLD,
  RULE_ENFORCEMENT_ACTIONS,
  RULE_SCHEDULE_TYPES,
  RULE_CHAIN_CONSTRAINT_TYPES
} from '@saintrocky/shared';
import { validateRuleDraftAssessment } from '@saintrocky/validation';

import { env } from '../config/env.js';

const UNSUPPORTED_PATTERNS = [
  /when i feel/i,
  /based on my mood/i,
  /heart rate/i,
  /calendar/i,
  /location/i,
  /friend texts/i,
  /microphone/i,
  /camera/i
];

const DOMAIN_KEYWORDS = {
  'pump.fun': ['pump', 'pumpfun', 'pump.fun'],
  'jup.ag': ['jupiter', 'jup'],
  'raydium.io': ['raydium'],
  'orca.so': ['orca'],
  'dexscreener.com': ['dexscreener'],
  'birdeye.so': ['birdeye'],
  'youtube.com': ['youtube'],
  'reddit.com': ['reddit'],
  'x.com': ['x.com', 'twitter'],
  'instagram.com': ['instagram'],
  'amazon.com': ['amazon'],
  'doordash.com': ['doordash'],
  'ubereats.com': ['ubereats', 'uber eats']
};

const APP_KEYWORDS = {
  Phantom: ['phantom'],
  Solflare: ['solflare'],
  Backpack: ['backpack'],
  Discord: ['discord'],
  Slack: ['slack'],
  Steam: ['steam']
};

function hasAiProvider() {
  return Boolean(env.openAiApiKey || env.huggingFaceApiKey);
}

function buildClarificationQuestion(id, question) {
  return { id, question };
}

function normalizeClarificationAnswers(clarificationAnswers = []) {
  if (!clarificationAnswers.length) return 'No clarification answers were provided.';
  return clarificationAnswers.map((entry) => `- ${entry.questionId}: ${entry.answer}`).join('\n');
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function inferTargets(draftText) {
  const targets = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((keyword) => draftText.includes(keyword))) {
      targets.push({ type: 'domain', value: domain });
    }
  }

  for (const [app, keywords] of Object.entries(APP_KEYWORDS)) {
    if (keywords.some((keyword) => draftText.includes(keyword))) {
      targets.push({ type: 'app', value: app });
    }
  }

  return targets;
}

function inferAction(draftText) {
  if (/warn|remind|nudge/.test(draftText)) return 'warn';
  if (/log|record|track/.test(draftText)) return 'log_only';
  return 'block';
}

function inferSchedule(draftText) {
  const timeMatch = draftText.match(/(\d{1,2}:\d{2})\s*(?:to|-)\s*(\d{1,2}:\d{2})/);
  if (timeMatch) {
    return {
      type: 'window',
      windows: [{
        start: timeMatch[1],
        end: timeMatch[2],
        timezone: 'America/New_York'
      }]
    };
  }
  return { type: 'always' };
}

function inferChainConstraints(draftText) {
  if (/max.*trad|trade.*limit|daily.*limit.*trad/i.test(draftText)) {
    const numMatch = draftText.match(/(\d+)\s*trad/i);
    return { type: 'max_trades_per_day', maxTrades: Number(numMatch?.[1]) || 5 };
  }
  if (/position.*size|max.*sol|size.*limit/i.test(draftText)) {
    const numMatch = draftText.match(/(\d+(?:\.\d+)?)\s*sol/i);
    return { type: 'max_position_size', maxPositionSizeSol: Number(numMatch?.[1]) || 2 };
  }
  if (/daily.*loss|loss.*limit|stop.*loss.*day/i.test(draftText)) {
    const numMatch = draftText.match(/(\d+(?:\.\d+)?)\s*sol/i);
    return { type: 'max_daily_loss', maxDailyLossSol: Number(numMatch?.[1]) || 5 };
  }
  if (/fomo|new.*token|fresh.*token|token.*age/i.test(draftText)) {
    const numMatch = draftText.match(/(\d+)\s*h/i);
    return { type: 'min_token_age', minTokenAgeHours: Number(numMatch?.[1]) || 1 };
  }
  return null;
}

function buildAssessmentMessages({ naturalLanguageDraft, clarificationAnswers }) {
  return [
    {
      role: 'system',
      content: [
        'You validate user-authored behavior rules for Standard Deviants.',
        'Return strict JSON only.',
        'The platform may only accept a rule when it can be enforced with 100% confidence.',
        `Supported enforcement actions: ${RULE_ENFORCEMENT_ACTIONS.join(', ')}.`,
        `Supported bypass fee models: ${RULE_BYPASS_FEE_MODELS.join(', ')}.`,
        `Supported schedule types: ${RULE_SCHEDULE_TYPES.join(', ')}.`,
        `Supported chain constraint types: ${RULE_CHAIN_CONSTRAINT_TYPES.join(', ')}.`,
        'Compiled rule JSON shape:',
        JSON.stringify({
          status: '', confidenceScore: 0,
          compiledRule: {
            summary: '', targets: [{ type: 'domain|app', value: '' }],
            chainConstraints: null, schedule: { type: 'always' },
            enforcement: { action: '', userMessage: '' },
            bypass: { allowed: true, feeModel: 'sleep_on_it' },
            telemetry: { source: 'ai_authored' }
          },
          clarificationQuestions: [], validationNotes: []
        })
      ].join('\n')
    },
    {
      role: 'user',
      content: [
        `Rule draft: ${naturalLanguageDraft}`,
        'Clarification answers:',
        normalizeClarificationAnswers(clarificationAnswers),
        'Return JSON only.'
      ].join('\n')
    }
  ];
}

function extractJsonPayload(content) {
  const source = String(content || '').trim();
  if (!source) throw new Error('The model returned an empty response');
  const codeFenceMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeFenceMatch?.[1] || source.slice(source.indexOf('{'), source.lastIndexOf('}') + 1);
  if (!candidate || !candidate.trim().startsWith('{')) {
    throw new Error('The model did not return a JSON object');
  }
  return JSON.parse(candidate);
}

function buildFallbackAssessment({ naturalLanguageDraft, clarificationAnswers }) {
  const draftText = naturalLanguageDraft.trim().toLowerCase();
  const hasClarification = clarificationAnswers.length > 0;

  if (includesAny(draftText, UNSUPPORTED_PATTERNS)) {
    return {
      status: 'rejected_unenforceable',
      confidenceScore: 0,
      clarificationQuestions: [],
      validationNotes: ['This draft depends on unsupported signals.']
    };
  }

  const targets = inferTargets(draftText);
  const chainConstraints = inferChainConstraints(draftText);

  if (!targets.length && !chainConstraints && !hasClarification) {
    return {
      status: 'needs_clarification',
      confidenceScore: 0.4,
      clarificationQuestions: [
        buildClarificationQuestion('target', 'Which specific domains, apps, or on-chain constraints should this rule enforce?')
      ],
      validationNotes: ['The draft does not clearly map to any enforceable target.']
    };
  }

  const action = inferAction(draftText);
  const schedule = inferSchedule(draftText);
  const targetDescription = targets.map((target) => target.value).join(', ') || 'on-chain activity';

  return {
    status: 'validated_enforceable',
    confidenceScore: RULE_CONFIDENCE_THRESHOLD,
    compiledRule: {
      summary: `${action === 'block' ? 'Block' : action === 'warn' ? 'Warn on' : 'Log'} ${targetDescription}.`,
      targets,
      chainConstraints,
      schedule,
      enforcement: {
        action,
        userMessage: `This action violates your rule for ${targetDescription}. Pay to override.`
      },
      bypass: { allowed: true, feeModel: 'sleep_on_it' },
      telemetry: { source: 'ai_authored' }
    },
    clarificationQuestions: [],
    validationNotes: ['Fallback rule interpretation succeeded.']
  };
}

async function createAiAssessment(input) {
  const response = await createChatCompletion({
    provider: 'auto',
    openAiApiKey: env.openAiApiKey,
    huggingFaceApiKey: env.huggingFaceApiKey,
    huggingFaceModel: env.huggingFaceChatModel,
    messages: buildAssessmentMessages(input),
    temperature: 0.1,
    maxTokens: 700,
    metadata: { source: 'rule-authoring' }
  });

  return extractJsonPayload(response.content);
}

export async function assessRuleDraft(input) {
  const fallbackAssessment = buildFallbackAssessment(input);
  const attempt = hasAiProvider()
    ? await createAiAssessment(input).catch(() => fallbackAssessment)
    : fallbackAssessment;

  const validation = validateRuleDraftAssessment({
    naturalLanguageDraft: input.naturalLanguageDraft,
    clarificationQuestions: [],
    validationNotes: [],
    ...attempt
  });

  if (!validation.ok) {
    throw new Error(`Rule assessment failed validation: ${validation.errors.map((entry) => entry.message).join('; ')}`);
  }

  return {
    clarificationQuestions: [],
    validationNotes: [],
    ...attempt,
    naturalLanguageDraft: input.naturalLanguageDraft
  };
}
