import { Card } from '@saintrocky/ui';

import { formatValue } from '../../../utils/runtime-formatters.js';

export function RulesSection({ runtimeHub }) {
  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Active rules</p>
          <h2>Desktop assignments</h2>
        </div>
      </div>
      <div className="desktop-HubList">
        {runtimeHub.assignments.length ? (
          runtimeHub.assignments.map((assignment) => (
            <div key={assignment.ruleId} className="desktop-HubListItem">
              <strong>{assignment.compiledRule.summary}</strong>
              <p>{assignment.compiledRule.enforcement?.userMessage}</p>
              <span className="desktop-HubMeta">
                Targets: {(assignment.compiledRule.targets || []).map((target) => target.value).join(', ') || 'None'}
              </span>
            </div>
          ))
        ) : (
          <p className="desktop-HubEmpty">No desktop assignments yet. Add a desktop rule from the web rules page.</p>
        )}
      </div>
    </Card>
  );
}
