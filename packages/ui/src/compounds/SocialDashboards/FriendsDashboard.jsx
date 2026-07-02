"use client";

import { useEffect, useMemo, useState } from 'react';

import { api } from '@saintrocky/api-client';

import { Button } from '../../primitives/Button/Button.jsx';
import { Card } from '../../primitives/Card/Card.jsx';
import { Spinner } from '../../primitives/Spinner/Spinner.jsx';
import { cx } from '../../primitives/_utils/cx.js';
import { StatusBanner } from '../StatusBanner/StatusBanner.jsx';
import { SummaryGrid } from '../SummaryGrid/SummaryGrid.jsx';

function SocialListCard({ title, emptyMessage, items = [], renderItem, className = '' }) {
  return (
    <Card className={cx('c-SocialDashboard__panel', className)}>
      <div className="c-SocialDashboard__panelHeader">
        <h2>{title}</h2>
        <span>{items.length}</span>
      </div>
      {items.length ? (
        <ul className="c-SocialDashboard__list">{items.map(renderItem)}</ul>
      ) : (
        <p className="c-SocialDashboard__empty">{emptyMessage}</p>
      )}
    </Card>
  );
}

function FriendshipListItem({ friendship, children = null }) {
  return (
    <li className="c-SocialDashboard__listItem">
      <div className="c-SocialDashboard__listItemBody">
        <strong>{friendship.counterparty.displayName}</strong>
        <p className="c-SocialDashboard__meta">
          {friendship.counterparty.email}
          {friendship.lastMessageAt
            ? ` · Last activity ${new Date(friendship.lastMessageAt).toLocaleString()}`
            : ''}
        </p>
      </div>
      {children ? <div className="c-SocialDashboard__actions">{children}</div> : null}
    </li>
  );
}

export function FriendsDashboard() {
  const [data, setData] = useState({
    friends: [],
    pendingIncoming: [],
    pendingOutgoing: [],
    suggestions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [banner, setBanner] = useState({ tone: 'info', message: '' });

  async function loadFriendships() {
    setIsLoading(true);
    try {
      const response = await api.friends.list();
      setData(response);
    } catch (error) {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to load friendships right now.'
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFriendships();
  }, []);

  async function handleRequest(targetUserId) {
    try {
      await api.friends.request({ targetUserId });
      setBanner({ tone: 'success', message: 'Friend request sent.' });
      await loadFriendships();
    } catch (error) {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to send that friend request.'
      });
    }
  }

  async function handleRespond(friendshipId, action) {
    try {
      await api.friends.respond(friendshipId, action);
      setBanner({
        tone: 'success',
        message:
          action === 'accept'
            ? 'Friend request accepted.'
            : action === 'remove'
              ? 'Friend removed.'
              : 'Friendship updated.'
      });
      await loadFriendships();
    } catch (error) {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to update that friendship.'
      });
    }
  }

  const summaryItems = useMemo(
    () => [
      ['Friends', data.friends.length],
      ['Incoming', data.pendingIncoming.length],
      ['Outgoing', data.pendingOutgoing.length],
      ['Suggestions', data.suggestions.length]
    ],
    [data]
  );

  if (isLoading) {
    return (
      <div className="c-DashboardSectionPage">
        <div className="c-SocialDashboard__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="c-DashboardSectionPage c-SocialDashboard">
      <header className="c-DashboardSectionPage__header">
        <h1>Friends</h1>
        <p>Build your accountability network, manage requests, and pull trusted traders into campaigns.</p>
      </header>
      <StatusBanner message={banner.message} tone={banner.tone} />
      <SummaryGrid items={summaryItems} />

      <div className="c-DashboardSectionPage__grid c-SocialDashboard__grid--wide">
        <SocialListCard
          title="Accepted Friends"
          items={data.friends}
          emptyMessage="No accepted friends yet."
          renderItem={(friendship) => (
            <FriendshipListItem key={friendship.friendshipId} friendship={friendship}>
              <Button variant="ghost" size="sm" onClick={() => handleRespond(friendship.friendshipId, 'remove')}>
                Remove
              </Button>
            </FriendshipListItem>
          )}
        />
        <SocialListCard
          title="Incoming Requests"
          items={data.pendingIncoming}
          emptyMessage="No incoming requests."
          renderItem={(friendship) => (
            <FriendshipListItem key={friendship.friendshipId} friendship={friendship}>
              <Button size="sm" onClick={() => handleRespond(friendship.friendshipId, 'accept')}>
                Accept
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleRespond(friendship.friendshipId, 'decline')}>
                Decline
              </Button>
            </FriendshipListItem>
          )}
        />
      </div>

      <div className="c-DashboardSectionPage__grid c-SocialDashboard__grid--wide">
        <SocialListCard
          title="Outgoing Requests"
          items={data.pendingOutgoing}
          emptyMessage="No pending outgoing requests."
          renderItem={(friendship) => (
            <FriendshipListItem key={friendship.friendshipId} friendship={friendship} />
          )}
        />
        <SocialListCard
          title="Suggested Members"
          items={data.suggestions}
          emptyMessage="No suggestions available."
          renderItem={(suggestion) => (
            <li key={suggestion.id} className="c-SocialDashboard__listItem">
              <div className="c-SocialDashboard__listItemBody">
                <strong>{suggestion.displayName}</strong>
                <p className="c-SocialDashboard__meta">{suggestion.email}</p>
              </div>
              <div className="c-SocialDashboard__actions">
                <Button size="sm" onClick={() => handleRequest(suggestion.id)}>
                  Add Friend
                </Button>
              </div>
            </li>
          )}
        />
      </div>
    </div>
  );
}
