"use client";

import { useEffect, useState } from "react";

import { Icon } from "@saintrocky/icons";

import { Dialog } from "../../primitives/Dialog/Dialog.jsx";
import { ProblemIndexSlider } from "../ProblemIndexSlider/ProblemIndexSlider.jsx";
import { RuleDetailEditor } from "../RulesWorkspace/RuleDetailEditor.jsx";

export function RuleInspectDialog({
  open,
  onOpenChange,
  rule,
  submitting,
  onSubmitEdit,
  onActivateRule,
  onRequestDeactivation,
  onConfirmDeactivation,
  onCancelDeactivation
}) {
  const [problemIndex, setProblemIndex] = useState(rule?.problemIndex ?? 50);

  useEffect(() => {
    if (rule) {
      setProblemIndex(rule.problemIndex ?? 50);
    }
  }, [rule?.ruleId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="c-DialogBackdrop" />
        <Dialog.Popup className="c-DialogPanel c-TacticsTableDialog__popup">
          <div className="c-TacticsTableDialog">
            <div className="c-TacticsTableDialog__header">
              <Dialog.Title>{rule?.title || "Inspect rule"}</Dialog.Title>
              <Dialog.Close>
                <button type="button" className="c-TacticsTableDialog__close" aria-label="Close">
                  <Icon name="close" size={18} />
                </button>
              </Dialog.Close>
            </div>

            <ProblemIndexSlider value={problemIndex} onChange={setProblemIndex} />

            <RuleDetailEditor
              rule={rule}
              problemIndex={problemIndex}
              submitting={submitting}
              onSubmitEdit={onSubmitEdit}
              onActivateRule={onActivateRule}
              onRequestDeactivation={onRequestDeactivation}
              onConfirmDeactivation={onConfirmDeactivation}
              onCancelDeactivation={onCancelDeactivation}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
