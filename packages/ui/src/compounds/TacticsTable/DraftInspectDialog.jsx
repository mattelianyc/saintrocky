"use client";

import { formatCompiledRuleSurfaceLabel } from "@saintrocky/shared";
import { Icon } from "@saintrocky/icons";

import { Button } from "../../primitives/Button/Button.jsx";
import { Dialog } from "../../primitives/Dialog/Dialog.jsx";

export function DraftInspectDialog({ open, onOpenChange, draft, submitting, onPublishDraft }) {
  if (!draft) return null;

  const surfaceLabel = formatCompiledRuleSurfaceLabel(draft.compiledRule);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="c-DialogBackdrop" />
        <Dialog.Popup className="c-DialogPanel">
          <div className="c-TacticsTableDialog">
            <div className="c-TacticsTableDialog__header">
              <Dialog.Title>AI draft</Dialog.Title>
              <Dialog.Close>
                <button type="button" className="c-TacticsTableDialog__close" aria-label="Close">
                  <Icon name="close" size={18} />
                </button>
              </Dialog.Close>
            </div>

            <div className="c-RulesWorkspaceEditor__metaGrid">
              <div>
                <span>Surface</span>
                <strong>{surfaceLabel}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{draft.confidenceScore}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{draft.status}</strong>
              </div>
            </div>

            <div>
              <p className="c-RulesWorkspacePanel__itemEyebrow">Natural language draft</p>
              <p>{draft.naturalLanguageDraft}</p>
            </div>

            {draft.status === "ready_for_activation" ? (
              <div className="c-RulesWorkspacePanel__actions">
                <Button
                  onClick={() => {
                    onPublishDraft?.(draft.id);
                    onOpenChange?.(false);
                  }}
                  loading={submitting}
                  loadingLabel="Activating draft"
                >
                  Activate draft
                </Button>
              </div>
            ) : (
              <p className="c-RulesWorkspaceEditor__summary">
                Continue this draft in the Create with AI tab if it still needs clarification.
              </p>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
