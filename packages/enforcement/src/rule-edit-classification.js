function normalizeCommaSeparatedList(value) {
  return Array.from(
    new Set(
      String(value || '')
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort();
}

function serializeCommaSeparatedList(values = []) {
  return values.join(', ');
}

function compareListValues(currentValue, nextValue) {
  const currentItems = normalizeCommaSeparatedList(currentValue);
  const nextItems = normalizeCommaSeparatedList(nextValue);
  const currentSet = new Set(currentItems);
  const nextSet = new Set(nextItems);
  const added = nextItems.filter((item) => !currentSet.has(item));
  const removed = currentItems.filter((item) => !nextSet.has(item));

  if (!added.length && !removed.length) {
    return { direction: 'identical', normalizedValue: serializeCommaSeparatedList(nextItems) };
  }

  if (added.length && removed.length) {
    return { direction: 'mixed', normalizedValue: serializeCommaSeparatedList(nextItems) };
  }

  return {
    direction: added.length ? 'expanding' : 'reducing',
    normalizedValue: serializeCommaSeparatedList(nextItems)
  };
}

function normalizeNumericValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function compareNumericValues(currentValue, nextValue, editSemantics) {
  const normalizedCurrentValue = normalizeNumericValue(currentValue);
  const normalizedNextValue = normalizeNumericValue(nextValue);

  if (normalizedCurrentValue == null || normalizedNextValue == null) {
    return { direction: String(currentValue ?? '') === String(nextValue ?? '') ? 'identical' : 'reducing' };
  }

  if (normalizedCurrentValue === normalizedNextValue) {
    return { direction: 'identical', normalizedValue: normalizedNextValue };
  }

  if (editSemantics === 'lower_is_stricter') {
    return {
      direction: normalizedNextValue < normalizedCurrentValue ? 'expanding' : 'reducing',
      normalizedValue: normalizedNextValue
    };
  }

  return {
    direction: normalizedNextValue > normalizedCurrentValue ? 'expanding' : 'reducing',
    normalizedValue: normalizedNextValue
  };
}

function compareFieldValues(field, currentValue, nextValue) {
  if (field.editSemantics === 'list_expanding') {
    return compareListValues(currentValue, nextValue);
  }

  if (field.editSemantics === 'lower_is_stricter' || field.editSemantics === 'higher_is_stricter') {
    return compareNumericValues(currentValue, nextValue, field.editSemantics);
  }

  return {
    direction: String(currentValue ?? '') === String(nextValue ?? '') ? 'identical' : 'reducing',
    normalizedValue: nextValue
  };
}

function resolveOverallDirection(fieldDirections = []) {
  const nonIdenticalDirections = fieldDirections.filter((direction) => direction !== 'identical');
  if (!nonIdenticalDirections.length) {
    return 'identical';
  }

  if (nonIdenticalDirections.includes('mixed')) {
    return 'mixed';
  }

  const hasExpanding = nonIdenticalDirections.includes('expanding');
  const hasReducing = nonIdenticalDirections.includes('reducing');

  if (hasExpanding && hasReducing) {
    return 'mixed';
  }

  return hasExpanding ? 'expanding' : 'reducing';
}

export function classifyRuleEditDirection(template, currentConfig = {}, nextConfig = {}) {
  const fields = Array.isArray(template?.inputSchema?.fields) ? template.inputSchema.fields : [];
  const fieldResults = fields.map((field) => {
    const currentValue = currentConfig?.[field.key];
    const nextValue = nextConfig?.[field.key];
    const comparison = compareFieldValues(field, currentValue, nextValue);

    return {
      key: field.key,
      editSemantics: field.editSemantics || null,
      direction: comparison.direction,
      currentValue,
      nextValue,
      normalizedValue: comparison.normalizedValue
    };
  });

  return {
    direction: resolveOverallDirection(fieldResults.map((result) => result.direction)),
    fieldResults
  };
}

export function mergeExpandingConfig(template, currentConfig = {}, incomingConfig = {}) {
  const fields = Array.isArray(template?.inputSchema?.fields) ? template.inputSchema.fields : [];
  const fieldMap = new Map(fields.map((field) => [field.key, field]));
  const mergedConfig = { ...currentConfig, ...incomingConfig };

  for (const [key, incomingValue] of Object.entries(incomingConfig || {})) {
    const field = fieldMap.get(key);
    const currentValue = currentConfig?.[key];

    if (!field?.editSemantics) {
      mergedConfig[key] = incomingValue;
      continue;
    }

    if (field.editSemantics === 'list_expanding') {
      mergedConfig[key] = serializeCommaSeparatedList(
        Array.from(new Set([...normalizeCommaSeparatedList(currentValue), ...normalizeCommaSeparatedList(incomingValue)])).sort()
      );
      continue;
    }

    if (field.editSemantics === 'lower_is_stricter' || field.editSemantics === 'higher_is_stricter') {
      const normalizedCurrentValue = normalizeNumericValue(currentValue);
      const normalizedIncomingValue = normalizeNumericValue(incomingValue);

      if (normalizedCurrentValue == null) {
        mergedConfig[key] = normalizedIncomingValue ?? incomingValue;
        continue;
      }

      if (normalizedIncomingValue == null) {
        mergedConfig[key] = incomingValue;
        continue;
      }

      mergedConfig[key] =
        field.editSemantics === 'lower_is_stricter'
          ? Math.min(normalizedCurrentValue, normalizedIncomingValue)
          : Math.max(normalizedCurrentValue, normalizedIncomingValue);
      continue;
    }

    mergedConfig[key] = incomingValue;
  }

  return mergedConfig;
}
