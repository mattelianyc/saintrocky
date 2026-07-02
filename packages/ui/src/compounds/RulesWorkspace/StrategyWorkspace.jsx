"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { RuleTemplatesPanel } from "./RuleTemplatesPanel.jsx";
import { useRulesWorkspaceData } from "./useRulesWorkspaceData.js";

const TAB_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
};

export function StrategyWorkspace() {
  const [activeTab] = useState("templates");
  const [problemIndex, setProblemIndex] = useState(50);
  const [refreshToken, setRefreshToken] = useState(0);
  const { activeRules } = useRulesWorkspaceData({ refreshToken });

  function handleRuleCreated() {
    setRefreshToken((current) => current + 1);
  }

  function renderActiveContent() {
    switch (activeTab) {
      case "templates":
        return (
          <RuleTemplatesPanel
            problemIndex={problemIndex}
            onProblemIndexChange={setProblemIndex}
            existingRules={activeRules}
            onRuleCreated={handleRuleCreated}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="c-RulesWorkspace c-StrategyWorkspace c-CompactDashboardPage">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} {...TAB_ANIMATION} className="c-RulesWorkspace__content">
          {renderActiveContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
