"use client";

import { useMemo, useState } from "react";

import { NestedTabNavigator } from "../../layout/NestedTabNavigator/NestedTabNavigator.jsx";
import { RuleAuthoringWorkspace } from "../RuleAuthoringWorkspace/RuleAuthoringWorkspace.jsx";
import { RuleTemplatesPanel } from "./RuleTemplatesPanel.jsx";
import { UserRulesPanel } from "./UserRulesPanel.jsx";

export function RulesWorkspace({ section }) {
  const [activeTab, setActiveTab] = useState("current-rules");
  const [refreshToken, setRefreshToken] = useState(0);

  const tabs = useMemo(
    () => [
      {
        value: "current-rules",
        label: "Current rules",
        content: () => <UserRulesPanel refreshToken={refreshToken} />
      },
      {
        value: "rule-templates",
        label: "Rule templates",
        content: () => <RuleTemplatesPanel onRuleCreated={() => setRefreshToken((value) => value + 1)} />
      },
      {
        value: "create-with-ai",
        label: "Create with AI",
        content: () => <RuleAuthoringWorkspace section={section} showHeader={false} />
      }
    ],
    [refreshToken, section]
  );

  return (
    <div className="c-RulesWorkspace">
      <header className="c-RulesWorkspace__header">
        <p className="c-RulesWorkspace__eyebrow">{section?.title || "Rules"}</p>
        <h1>Rules control plane</h1>
        <p>{section?.description}</p>
      </header>
      <NestedTabNavigator tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
    </div>
  );
}
