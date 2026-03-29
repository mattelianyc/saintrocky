export const authProviders = [
  {
    id: "email-password",
    title: "Email and password",
    summary: "Direct sign-in for the Saint Rocky control plane."
  }
];

export function buildSessionUser(email = "operator@saintrocky.local") {
  return {
    id: "user-001",
    email,
    displayName: "Saint Rocky Operator",
    workspaceName: "Standard Deviants"
  };
}
