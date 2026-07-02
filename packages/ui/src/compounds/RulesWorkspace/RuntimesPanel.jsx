"use client";

import { motion } from "framer-motion";

import { Card } from "../../primitives/Card/Card.jsx";

const STAGGER_ITEM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 }
};

export function RuntimesPanel({ extensionSessions, realtimeStatus }) {
  return (
    <div className="c-RulesWorkspacePanel">
      <div className="c-RulesWorkspaceList__sectionHeader">
        <h3>Connected browser runtimes</h3>
        <span>{realtimeStatus}</span>
      </div>
      {extensionSessions.length ? (
        <div className="c-RulesWorkspaceDraftGrid">
          {extensionSessions.map((session, index) => (
            <motion.div key={session.sessionId} {...STAGGER_ITEM} transition={{ ...STAGGER_ITEM.transition, delay: index * 0.04 }}>
              <Card className="c-RulesWorkspacePanel__item">
                <div className="c-RulesWorkspacePanel__itemHeader">
                  <strong>{session.browserName || "Browser runtime"}</strong>
                  <span>{session.connectionState}</span>
                </div>
                <p className="c-RulesWorkspacePanel__meta">
                  {session.platform || "Unknown platform"} · {session.extensionVersion || "Unknown version"}
                </p>
                <p className="c-RulesWorkspacePanel__meta">
                  Assignments: {session.runtimeState?.assignmentCount || 0} · Status:{" "}
                  {session.runtimeState?.assignmentCount > 0 ? "monitoring" : "idle"}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="c-RulesWorkspacePanel__empty">No connected browser runtime yet.</p>
      )}
    </div>
  );
}
