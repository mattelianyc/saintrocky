export const alertSeverityOrder = ["critical", "high", "medium", "low"];

export const alertFeed = [
  {
    id: "alert-001",
    title: "Distraction spike detected",
    summary: "The browser session drifted into blocked destinations during a focus window.",
    severity: "high",
    surface: "extension",
    status: "open"
  },
  {
    id: "alert-002",
    title: "Desktop policy applied",
    summary: "A workstation entered enforcement mode and began routing traffic through a stricter policy.",
    severity: "medium",
    surface: "desktop",
    status: "resolved"
  },
  {
    id: "alert-003",
    title: "Mobile legitimacy check complete",
    summary: "The lightweight mobile client synced identity state successfully.",
    severity: "low",
    surface: "mobile",
    status: "resolved"
  }
];
