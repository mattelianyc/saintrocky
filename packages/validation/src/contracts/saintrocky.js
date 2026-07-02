function buildResult(ok, errors = []) {
  return {
    ok,
    errors
  };
}

export function validateRequiredFields(payload, requiredKeys) {
  const errors = requiredKeys
    .filter((key) => {
      const value = payload?.[key];
      return value === undefined || value === null || value === "";
    })
    .map((key) => ({
      field: key,
      message: `${key} is required`
    }));

  return buildResult(errors.length === 0, errors);
}

export function validateAuthLogin(payload) {
  return validateRequiredFields(payload, ["email", "password"]);
}

export function validateWorkflowDraft(payload) {
  return validateRequiredFields(payload, ["title", "mode"]);
}

export function validatePolicyDraft(payload) {
  return validateRequiredFields(payload, ["title", "enforcementLevel"]);
}
