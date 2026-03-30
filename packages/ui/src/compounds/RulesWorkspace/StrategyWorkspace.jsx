"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Tabs } from "../../primitives/Tabs/Tabs.jsx";
import { ProblemIndexSlider } from "../ProblemIndexSlider/ProblemIndexSlider.jsx";
import { RuleAuthoringWorkspace } from "../RuleAuthoringWorkspace/RuleAuthoringWorkspace.jsx";
import { RuleTemplatesPanel } from "./RuleTemplatesPanel.jsx";

const TAB_ANIMATION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
};

export function StrategyWorkspace({ section }) {
  const [activeTab, setActiveTab] = useState("templates");
  const [problemIndex, setProblemIndex] = useState(50);

  function renderActiveContent() {
    switch (activeTab) {
      case "templates":
        return (
          <RuleTemplatesPanel
            problemIndex={problemIndex}
            onProblemIndexChange={setProblemIndex}
          />
        );
      case "create-with-ai":
        return (
          <RuleAuthoringWorkspace
            section={section}
            showHeader={false}
            problemIndex={problemIndex}
            onProblemIndexChange={setProblemIndex}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="c-RulesWorkspace">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="c-RulesWorkspace__tabList">
          <Tabs.Tab value="templates">Templates</Tabs.Tab>
          <Tabs.Tab value="create-with-ai">Create with AI</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>

      <ProblemIndexSlider value={problemIndex} onChange={setProblemIndex} variant="hero" />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} {...TAB_ANIMATION} className="c-RulesWorkspace__content">
          {renderActiveContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
