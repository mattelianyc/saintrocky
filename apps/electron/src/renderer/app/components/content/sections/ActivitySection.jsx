import { Card } from '@saintrocky/ui';

import { formatValue } from '../../../utils/runtime-formatters.js';

export function ActivitySection({ runtimeHub }) {
  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Activity</p>
          <h2>Recent desktop events</h2>
        </div>
      </div>
      <div className="desktop-HubList">
        {runtimeHub.recentEvents.length ? (
          runtimeHub.recentEvents.map((event) => (
            <div key={event.eventId} className="desktop-HubListItem">
              <strong>{event.eventType}</strong>
              <p>{event.title}</p>
              <span className="desktop-HubMeta">{formatValue(event.occurredAt)}</span>
            </div>
          ))
        ) : (
          <p className="desktop-HubEmpty">No desktop runtime events yet.</p>
        )}
      </div>
    </Card>
  );
}
