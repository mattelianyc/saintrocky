import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { UserRule } from '@saintrocky/api/models/user-rule';
import {
  buildCompiledRuleFromTemplate,
  getRuleTemplateById
} from '@saintrocky/shared';
import { mergeExpandingConfig } from '@saintrocky/enforcement';
import { calculateLockedStake } from '@saintrocky/fuckyoupayme';
import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

function inferRuntimeSurfaces(compiledRule) {
  const surfaces = [];
  const targets = compiledRule?.targets || [];
  if (targets.some((target) => target.type === 'domain')) surfaces.push('browser_extension');
  if (targets.some((target) => target.type === 'app')) surfaces.push('desktop_runtime');
  if (compiledRule?.chainConstraints) surfaces.push('chain_watcher');
  return surfaces;
}

function groupDuplicatesByOwnerAndTemplate(rules) {
  const groups = new Map();
  for (const rule of rules) {
    if (!rule.templateId) continue;
    const groupKey = `${rule.ownerUserId}::${rule.templateId}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(rule);
  }

  const duplicateGroups = [];
  for (const [, groupRules] of groups) {
    if (groupRules.length > 1) {
      groupRules.sort((ruleA, ruleB) => new Date(ruleA.createdAt) - new Date(ruleB.createdAt));
      duplicateGroups.push(groupRules);
    }
  }

  return duplicateGroups;
}

function reconcileGroup(rulesInGroup) {
  const survivor = rulesInGroup[0];
  const duplicates = rulesInGroup.slice(1);
  const template = getRuleTemplateById(survivor.templateId);

  if (!template) {
    console.warn(`  [skip] No template found for templateId=${survivor.templateId}, skipping group`);
    return null;
  }

  let mergedConfig = { ...(survivor.pendingEdit?.config || survivor.config || {}) };
  const absorbedRuleIds = [];

  for (const duplicate of duplicates) {
    const duplicateConfig = duplicate.pendingEdit?.config || duplicate.config || {};
    mergedConfig = mergeExpandingConfig(template, mergedConfig, duplicateConfig);
    absorbedRuleIds.push(duplicate.ruleId);
  }

  const mergedCompiledRule = buildCompiledRuleFromTemplate(template, mergedConfig);

  const highestProblemIndex = Math.max(...rulesInGroup.map((rule) => rule.problemIndex ?? 50));

  return {
    survivor: {
      ...survivor,
      config: mergedConfig,
      compiledRule: mergedCompiledRule,
      summary: mergedCompiledRule.summary,
      bypassPolicy: mergedCompiledRule.bypass,
      enforcementSurfaces: inferRuntimeSurfaces(mergedCompiledRule),
      problemIndex: highestProblemIndex,
      lockedStakeLamports: calculateLockedStake(highestProblemIndex),
      pendingEdit: null,
      updatedAt: new Date().toISOString()
    },
    absorbedRuleIds
  };
}

export async function reconcileDuplicateRules() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  await connectMongo(mongoUri);

  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log('[reconcile] DRY RUN -- no writes will be performed\n');
  }

  const activeRules = await UserRule.find({ status: 'active', templateId: { $ne: null } })
    .sort({ createdAt: 1 })
    .lean();

  console.log(`[reconcile] Found ${activeRules.length} active template-backed rules`);

  const duplicateGroups = groupDuplicatesByOwnerAndTemplate(activeRules);
  console.log(`[reconcile] Found ${duplicateGroups.length} duplicate group(s) to reconcile\n`);

  if (!duplicateGroups.length) {
    console.log('[reconcile] Nothing to do. All rules are already unique per template per user.');
    await disconnectMongo();
    return;
  }

  let totalMerged = 0;
  let totalArchived = 0;

  for (const group of duplicateGroups) {
    const template = getRuleTemplateById(group[0].templateId);
    const templateLabel = template?.title || group[0].templateId;
    console.log(`  [group] owner=${group[0].ownerEmail} template="${templateLabel}" count=${group.length}`);

    for (const rule of group) {
      const configSnippet = JSON.stringify(rule.config).slice(0, 120);
      console.log(`    ruleId=${rule.ruleId} p=${rule.problemIndex} config=${configSnippet}...`);
    }

    const result = reconcileGroup(group);
    if (!result) continue;

    console.log(`    -> survivor=${result.survivor.ruleId}`);
    console.log(`    -> absorbing ${result.absorbedRuleIds.length} duplicate(s): ${result.absorbedRuleIds.join(', ')}`);
    console.log(`    -> merged summary: "${result.survivor.summary}"`);

    if (!dryRun) {
      await UserRule.findOneAndUpdate(
        { ruleId: result.survivor.ruleId },
        result.survivor,
        { upsert: false, new: true }
      );

      await UserRule.updateMany(
        { ruleId: { $in: result.absorbedRuleIds } },
        {
          $set: {
            status: 'archived',
            updatedAt: new Date().toISOString(),
            pendingEdit: null
          }
        }
      );
    }

    totalMerged += 1;
    totalArchived += result.absorbedRuleIds.length;
    console.log('');
  }

  console.log(`[reconcile] Done. groups_merged=${totalMerged} rules_archived=${totalArchived}${dryRun ? ' (dry run)' : ''}`);
  await disconnectMongo();
}

runSeedScript(import.meta.url, reconcileDuplicateRules);
