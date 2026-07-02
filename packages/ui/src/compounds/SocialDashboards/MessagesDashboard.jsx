"use client";

import { useEffect, useMemo, useState } from 'react';

import { api } from '@saintrocky/api-client';
import { buildDirectMessagesChannel, createRealtimeClient } from '@saintrocky/realtime';

import { Button } from '../../primitives/Button/Button.jsx';
import { Card } from '../../primitives/Card/Card.jsx';
import { Spinner } from '../../primitives/Spinner/Spinner.jsx';
import { Textarea } from '../../primitives/Input/Textarea.jsx';
import { StatusBanner } from '../StatusBanner/StatusBanner.jsx';
import { SummaryGrid } from '../SummaryGrid/SummaryGrid.jsx';

function ThreadButton({ isSelected, thread, onSelect }) {
  return (
    <button
      type="button"
      className={`c-SocialDashboard__threadButton ${isSelected ? 'is-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="c-SocialDashboard__threadHeader">
        <strong>{thread.counterparty.displayName}</strong>
        {thread.unreadCount ? <span>{thread.unreadCount}</span> : null}
      </div>
      <p className="c-SocialDashboard__meta">
        {thread.lastMessage?.body || 'No messages yet.'}
      </p>
    </button>
  );
}

function MessageBubble({ actorEmail, message }) {
  const isOwnMessage = message.sender.email === actorEmail;
  return (
    <li
      className={`c-SocialDashboard__messageItem ${
        isOwnMessage ? 'c-SocialDashboard__messageItem--own' : ''
      }`}
    >
      <div className="c-SocialDashboard__messageBubble">
        <strong>{message.sender.displayName}</strong>
        <p>{message.body}</p>
        <span>{new Date(message.createdAt).toLocaleString()}</span>
      </div>
    </li>
  );
}

export function MessagesDashboard() {
  const [threads, setThreads] = useState([]);
  const [actorEmail, setActorEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [banner, setBanner] = useState({ tone: 'info', message: '' });

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.counterparty.id === selectedUserId) || threads[0] || null,
    [threads, selectedUserId]
  );
  const selectedThreadUnreadCount = selectedThread?.unreadCount || 0;

  async function loadThreads() {
    const response = await api.messages.listThreads();
    setThreads(response.threads || []);
    setActorEmail(response.actor?.email || '');
    setSelectedUserId((currentUserId) =>
      (response.threads || []).some((thread) => thread.counterparty.id === currentUserId)
        ? currentUserId
        : response.threads?.[0]?.counterparty.id || ''
    );
  }

  async function loadConversation(counterpartyUserId, options = {}) {
    if (!counterpartyUserId) {
      setMessages([]);
      return;
    }

    const shouldMarkRead = options.markRead ?? false;
    setIsLoadingMessages(true);
    try {
      const response = await api.messages.listMessages(counterpartyUserId);
      setMessages(response.messages || []);
      if (shouldMarkRead) {
        await api.messages.markRead(counterpartyUserId);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingThreads(true);
      try {
        await loadThreads();
      } catch (error) {
        setBanner({
          tone: 'error',
          message: error?.message || 'Unable to load your message threads.'
        });
      } finally {
        setIsLoadingThreads(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    loadConversation(selectedThread?.counterparty.id || '', {
      markRead: selectedThreadUnreadCount > 0
    }).catch((error) => {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to load this conversation.'
      });
    });
  }, [selectedThread?.counterparty.id, selectedThreadUnreadCount]);

  useEffect(() => {
    if (!actorEmail) return undefined;

    let isMounted = true;
    let unsubscribe = null;
    let realtimeClient = null;

    async function connectRealtime() {
      const auth = await api.auth.createRuntimeToken({ runtimeSurface: 'web' });
      realtimeClient = createRealtimeClient({ clientType: 'web', authToken: auth.token });
      unsubscribe = realtimeClient.subscribe(buildDirectMessagesChannel(actorEmail), async (message) => {
        if (!isMounted) return;
        if (message?.event !== 'direct_message.created') return;
        await loadThreads();
        if (selectedThread?.counterparty.id) {
          await loadConversation(selectedThread.counterparty.id, { markRead: false });
        }
      });
      realtimeClient.connect();
    }

    connectRealtime().catch(() => {});

    return () => {
      isMounted = false;
      unsubscribe?.();
      realtimeClient?.disconnect();
    };
  }, [actorEmail, selectedThread?.counterparty.id]);

  async function handleSend() {
    if (!selectedThread || !draft.trim()) return;

    setIsSending(true);
    try {
      await api.messages.send({
        recipientUserId: selectedThread.counterparty.id,
        body: draft.trim()
      });
      setDraft('');
      await loadThreads();
      await loadConversation(selectedThread.counterparty.id);
    } catch (error) {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to send that message.'
      });
    } finally {
      setIsSending(false);
    }
  }

  const unreadCount = threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
  const summaryItems = [
    ['Threads', threads.length],
    ['Unread', unreadCount],
    ['Messages', messages.length]
  ];

  if (isLoadingThreads) {
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
        <h1>Messages</h1>
        <p>Realtime direct messages with your accepted friends.</p>
      </header>
      <StatusBanner message={banner.message} tone={banner.tone} />
      <SummaryGrid items={summaryItems} />

      <div className="c-SocialDashboard__messagesLayout">
        <Card className="c-SocialDashboard__panel">
          <div className="c-SocialDashboard__panelHeader">
            <h2>Threads</h2>
            <span>{threads.length}</span>
          </div>
          {threads.length ? (
            <div className="c-SocialDashboard__threadList">
              {threads.map((thread) => (
                <ThreadButton
                  key={thread.conversationId}
                  thread={thread}
                  isSelected={selectedThread?.conversationId === thread.conversationId}
                  onSelect={() => setSelectedUserId(thread.counterparty.id)}
                />
              ))}
            </div>
          ) : (
            <p className="c-SocialDashboard__empty">No threads yet. Add friends to open a conversation.</p>
          )}
        </Card>

        <Card className="c-SocialDashboard__panel c-SocialDashboard__conversation">
          <div className="c-SocialDashboard__panelHeader">
            <h2>{selectedThread?.counterparty.displayName || 'Conversation'}</h2>
            <span>{messages.length}</span>
          </div>
          {selectedThread ? (
            <>
              {isLoadingMessages ? (
                <div className="c-SocialDashboard__loadingInline">
                  <Spinner />
                </div>
              ) : messages.length ? (
                <ul className="c-SocialDashboard__messageList">
                  {messages.map((message) => (
                    <MessageBubble key={message.messageId} actorEmail={actorEmail} message={message} />
                  ))}
                </ul>
              ) : (
                <p className="c-SocialDashboard__empty">No messages yet. Send the first one.</p>
              )}
              <div className="c-SocialDashboard__composer">
                <Textarea
                  rows={4}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Send a message..."
                />
                <Button onClick={handleSend} loading={isSending} loadingLabel="Sending..." disabled={!draft.trim()}>
                  Send
                </Button>
              </div>
            </>
          ) : (
            <p className="c-SocialDashboard__empty">Choose a thread to start chatting.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
