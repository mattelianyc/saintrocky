export const networkPolicies = [
  {
    id: "policy-focus",
    title: "Focus policy",
    summary: "Blocks known distraction destinations and rate-limits tempting detours.",
    enforcementLevel: "strict"
  },
  {
    id: "policy-balanced",
    title: "Balanced policy",
    summary: "Allows broader research while keeping risky categories visible and controllable.",
    enforcementLevel: "moderate"
  },
  {
    id: "policy-audit",
    title: "Audit policy",
    summary: "Records behavior without hard blocking to establish a baseline before enforcement.",
    enforcementLevel: "observe"
  }
];
