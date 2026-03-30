"use client";

import { useEffect, useMemo, useState } from 'react';

import { api } from '@saintrocky/api-client';

import { Button } from '../../primitives/Button/Button.jsx';
import { Card } from '../../primitives/Card/Card.jsx';
import { Checkbox } from '../../primitives/Checkbox/Checkbox.jsx';
import { Input } from '../../primitives/Input/Input.jsx';
import { Textarea } from '../../primitives/Input/Textarea.jsx';
import { Spinner } from '../../primitives/Spinner/Spinner.jsx';
import { StatusBanner } from '../StatusBanner/StatusBanner.jsx';
import { SummaryGrid } from '../SummaryGrid/SummaryGrid.jsx';

function toDatetimeLocalValue(date) {
  const nextDate = new Date(date);
  nextDate.setMinutes(nextDate.getMinutes() - nextDate.getTimezoneOffset());
  return nextDate.toISOString().slice(0, 16);
}

function SocialChecklist({ title, emptyMessage, items, selectedIds, onToggle, getId, getLabel }) {
  return (
    <div className="c-SocialDashboard__checklistBlock">
      <h3>{title}</h3>
      {items.length ? (
        <ul className="c-SocialDashboard__checklist">
          {items.map((item) => {
            const itemId = getId(item);
            const isSelected = selectedIds.includes(itemId);
            return (
              <li key={itemId} className="c-SocialDashboard__checkItem">
                <label>
                  <Checkbox.Root
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggle(itemId, Boolean(checked))}
                    aria-label={getLabel(item)}
                  >
                    <Checkbox.Indicator>✓</Checkbox.Indicator>
                  </Checkbox.Root>
                  <span>{getLabel(item)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="c-SocialDashboard__empty">{emptyMessage}</p>
      )}
    </div>
  );
}

function CampaignListCard({ title, items, emptyMessage, renderItem }) {
  return (
    <Card className="c-SocialDashboard__panel">
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

export function CampaignsDashboard() {
  const [campaigns, setCampaigns] = useState({ active: [], invitations: [], history: [] });
  const [friends, setFriends] = useState([]);
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState({ tone: 'info', message: '' });
  const [form, setForm] = useState({
    title: '',
    description: '',
    startsAt: toDatetimeLocalValue(Date.now() + 24 * 60 * 60 * 1000),
    endsAt: toDatetimeLocalValue(Date.now() + 8 * 24 * 60 * 60 * 1000)
  });
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);

  const selectableRules = useMemo(
    () => rules.filter((rule) => rule.status === 'active'),
    [rules]
  );

  async function loadCampaignData() {
    const [campaignsResponse, friendsResponse, rulesResponse] = await Promise.all([
      api.campaigns.list(),
      api.friends.list(),
      api.rules.listRules()
    ]);

    setCampaigns(campaignsResponse);
    setFriends(friendsResponse.friends || []);
    setRules(rulesResponse.rules || []);
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        await loadCampaignData();
      } catch (error) {
        setBanner({
          tone: 'error',
          message: error?.message || 'Unable to load campaigns right now.'
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData();
  }, []);

  function toggleSelection(targetId, checked, setState) {
    setState((currentIds) =>
      checked ? [...new Set([...currentIds, targetId])] : currentIds.filter((id) => id !== targetId)
    );
  }

  async function handleCreateCampaign() {
    setIsSubmitting(true);
    try {
      const sharedRules = selectableRules
        .filter((rule) => selectedRuleIds.includes(rule.ruleId))
        .map((rule) => ({
          ruleId: rule.ruleId,
          title: rule.title,
          summary: rule.summary,
          templateKey: rule.templateKey,
          config: rule.config,
          problemIndex: rule.problemIndex,
          lockedStakeLamports: rule.lockedStakeLamports
        }));

      await api.campaigns.create({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        invitedUserIds: selectedFriendIds,
        sharedRules
      });

      setBanner({ tone: 'success', message: 'Campaign created.' });
      setSelectedFriendIds([]);
      setSelectedRuleIds([]);
      setForm((currentForm) => ({ ...currentForm, title: '', description: '' }));
      await loadCampaignData();
    } catch (error) {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to create this campaign.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRespond(campaignId, action) {
    try {
      await api.campaigns.respond(campaignId, action);
      setBanner({ tone: 'success', message: 'Campaign updated.' });
      await loadCampaignData();
    } catch (error) {
      setBanner({
        tone: 'error',
        message: error?.message || 'Unable to update this campaign.'
      });
    }
  }

  const summaryItems = [
    ['Active', campaigns.active?.length || 0],
    ['Invites', campaigns.invitations?.length || 0],
    ['Friends', friends.length],
    ['Rules', selectableRules.length]
  ];

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
        <h1>Campaigns</h1>
        <p>Run shared discipline challenges with friends across a fixed time window.</p>
      </header>
      <StatusBanner message={banner.message} tone={banner.tone} />
      <SummaryGrid items={summaryItems} />

      <div className="c-DashboardSectionPage__grid c-SocialDashboard__grid--wide">
        <Card className="c-SocialDashboard__panel">
          <div className="c-SocialDashboard__panelHeader">
            <h2>Create Campaign</h2>
            <span>{selectedRuleIds.length} rules</span>
          </div>
          <div className="c-SocialDashboard__form">
            <Input
              value={form.title}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
              placeholder="Challenge title"
            />
            <Textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, description: event.target.value }))
              }
              placeholder="What is everyone committing to?"
            />
            <div className="c-SocialDashboard__fieldGrid">
              <label className="c-SocialDashboard__field">
                <span>Starts</span>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, startsAt: event.target.value }))
                  }
                />
              </label>
              <label className="c-SocialDashboard__field">
                <span>Ends</span>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, endsAt: event.target.value }))
                  }
                />
              </label>
            </div>
            <SocialChecklist
              title="Invite Friends"
              emptyMessage="No accepted friends available to invite."
              items={friends}
              selectedIds={selectedFriendIds}
              onToggle={(targetId, checked) => toggleSelection(targetId, checked, setSelectedFriendIds)}
              getId={(friendship) => friendship.counterparty.id}
              getLabel={(friendship) => friendship.counterparty.displayName}
            />
            <SocialChecklist
              title="Shared Rules"
              emptyMessage="You need active rules before launching a campaign."
              items={selectableRules}
              selectedIds={selectedRuleIds}
              onToggle={(targetId, checked) => toggleSelection(targetId, checked, setSelectedRuleIds)}
              getId={(rule) => rule.ruleId}
              getLabel={(rule) => rule.title}
            />
            <Button
              block
              onClick={handleCreateCampaign}
              loading={isSubmitting}
              loadingLabel="Creating..."
              disabled={!form.title.trim() || selectedRuleIds.length === 0}
            >
              Create Campaign
            </Button>
          </div>
        </Card>

        <CampaignListCard
          title="Invitations"
          items={campaigns.invitations || []}
          emptyMessage="No pending invites."
          renderItem={(campaign) => (
            <li key={campaign.campaignId} className="c-SocialDashboard__listItem">
              <div className="c-SocialDashboard__listItemBody">
                <strong>{campaign.title}</strong>
                <p>{campaign.description}</p>
                <p className="c-SocialDashboard__meta">
                  {new Date(campaign.startsAt).toLocaleString()} to{' '}
                  {new Date(campaign.endsAt).toLocaleString()}
                </p>
              </div>
              <div className="c-SocialDashboard__actions">
                <Button size="sm" onClick={() => handleRespond(campaign.campaignId, 'accept')}>
                  Accept
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleRespond(campaign.campaignId, 'decline')}>
                  Decline
                </Button>
              </div>
            </li>
          )}
        />
      </div>

      <div className="c-DashboardSectionPage__grid c-SocialDashboard__grid--wide">
        <CampaignListCard
          title="Active Campaigns"
          items={campaigns.active || []}
          emptyMessage="No active campaigns yet."
          renderItem={(campaign) => (
            <li key={campaign.campaignId} className="c-SocialDashboard__listItem">
              <div className="c-SocialDashboard__listItemBody">
                <strong>{campaign.title}</strong>
                <p>{campaign.description}</p>
                <p className="c-SocialDashboard__meta">
                  {new Date(campaign.startsAt).toLocaleString()} to{' '}
                  {new Date(campaign.endsAt).toLocaleString()}
                </p>
              </div>
            </li>
          )}
        />
        <CampaignListCard
          title="History"
          items={campaigns.history || []}
          emptyMessage="No historical campaign records yet."
          renderItem={(campaign) => (
            <li key={campaign.campaignId} className="c-SocialDashboard__listItem">
              <div className="c-SocialDashboard__listItemBody">
                <strong>{campaign.title}</strong>
                <p className="c-SocialDashboard__meta">
                  Membership: {campaign.membership?.status || 'unknown'}
                </p>
              </div>
            </li>
          )}
        />
      </div>
    </div>
  );
}
