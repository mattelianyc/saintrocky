export const authProviders = [
  {
    id: "email-password",
    title: "Email and password",
    summary: "Direct sign-in for the $TANDARD / DEVIANT$ control plane."
  }
];

export function buildSessionUser(email = "operator@thestandard.dev") {
  return {
    id: "user-001",
    email,
    displayName: "Disciplined Operator",
    workspaceName: "$TANDARD / DEVIANT$"
  };
}
