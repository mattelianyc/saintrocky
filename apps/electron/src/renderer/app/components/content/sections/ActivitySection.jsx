import { useState } from 'react';
import { Card } from '@saintrocky/ui';

import { formatRelativeTime, formatRuleEventHeadline, formatRuleEventMeta, formatSurfaceLabel } from '../../../utils/runtime-formatters.js';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'chain', label: 'Chain' },
  { id: 'rules', label: 'Rules' },
  { id: 'social', label: 'Social' }
];

const SOCIAL_SURFACES = new Set(['friends', 'direct_messages', 'campaigns']);

function filterEvents(events, filter) {
  if (filter === 'all') return events;
  if (filter === 'social') return events.filter((event) => SOCIAL_SURFACES.has(event.surface));
  return events.filter((event) => event.surface === filter);
}

export function ActivitySection({ runtimeHub }) {
  const [activeFilter, setActiveFilter] = useState('all');

  const desktopEvents = (runtimeHub.recentEvents || []).map((event) => ({
    ...event,
    surface: event.surface || 'desktop'
  }));
  const crossSurfaceEvents = runtimeHub.crossSurfaceActivity || [];
  const allEvents = mergeAndDeduplicate(desktopEvents, crossSurfaceEvents);
  const filteredEvents = filterEvents(allEvents, activeFilter);

  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Activity</p>
          <h2>Cross-surface event feed</h2>
        </div>
      </div>
      <div className="desktop-FilterRow">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`desktop-FilterPill ${activeFilter === option.id ? 'desktop-FilterPill--active' : ''}`}
            onClick={() => setActiveFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="desktop-HubList">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.eventId} className="desktop-HubListItem">
              <div className="desktop-ActivityItemHeader">
                <span className="desktop-HubMeta desktop-SurfaceTag">{formatSurfaceLabel(event.surface)}</span>
                <span className="desktop-HubMeta">{formatRelativeTime(event.occurredAt)}</span>
              </div>
              <strong>{formatRuleEventHeadline(event)}</strong>
              {formatRuleEventMeta(event) ? <span className="desktop-HubMeta">{formatRuleEventMeta(event)}</span> : null}
            </div>
          ))
        ) : (
          <p className="desktop-HubEmpty">No events recorded yet. Activity from all surfaces will appear here.</p>
        )}
      </div>
    </Card>
  );
}

function mergeAndDeduplicate(desktopEvents, crossSurfaceEvents) {
  const seen = new Set();
  const merged = [];

  for (const event of [...crossSurfaceEvents, ...desktopEvents]) {
    if (!seen.has(event.eventId)) {
      seen.add(event.eventId);
      merged.push(event);
    }
  }

  merged.sort((a, b) => {
    const timeA = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
    const timeB = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
    return timeB - timeA;
  });

  return merged.slice(0, 50);
}
