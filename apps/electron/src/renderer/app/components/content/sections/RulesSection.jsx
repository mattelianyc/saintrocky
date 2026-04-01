import { Card } from '@saintrocky/ui';

export function RulesSection({ runtimeHub }) {
  const desktopAssignments = runtimeHub.assignments || [];
  const chainRules = (runtimeHub.rules || []).filter(
    (rule) => rule.compiledRule?.chainConstraints?.length > 0
  );

  return (
    <>
      <Card className="desktop-HubPanel">
        <div className="desktop-HubPanelHeader">
          <div>
            <p className="desktop-Kicker">Desktop enforcement</p>
            <h2>Desktop assignments</h2>
          </div>
        </div>
        <div className="desktop-HubList">
          {desktopAssignments.length > 0 ? (
            desktopAssignments.map((assignment) => (
              <div key={assignment.ruleId} className="desktop-HubListItem">
                <strong>{assignment.compiledRule.summary}</strong>
                <p>{assignment.compiledRule.enforcement?.userMessage}</p>
                <span className="desktop-HubMeta">
                  Targets: {(assignment.compiledRule.targets || []).map((target) => target.value).join(', ') || 'None'}
                </span>
              </div>
            ))
          ) : (
            <p className="desktop-HubEmpty">No desktop assignments. Add a desktop rule from the web dashboard.</p>
          )}
        </div>
      </Card>

      {chainRules.length > 0 && (
        <Card className="desktop-HubPanel">
          <div className="desktop-HubPanelHeader">
            <div>
              <p className="desktop-Kicker">Chain enforcement</p>
              <h2>On-chain constraints</h2>
            </div>
          </div>
          <div className="desktop-HubList">
            {chainRules.map((rule) => (
              <div key={rule.ruleId} className="desktop-HubListItem">
                <strong>{rule.compiledRule?.summary || rule.ruleId}</strong>
                <p>
                  {(rule.compiledRule.chainConstraints || [])
                    .map((constraint) => formatConstraintLabel(constraint.type))
                    .join(', ')}
                </p>
                <span className="desktop-HubMeta">
                  Status: {rule.status || 'active'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function formatConstraintLabel(constraintType) {
  const labels = {
    max_trades_per_day: 'Max trades/day',
    max_position_size: 'Max position size',
    max_daily_loss: 'Max daily loss',
    blocked_tokens: 'Blocked tokens',
    schedule_violation: 'Schedule restriction'
  };
  return labels[constraintType] || constraintType;
}
