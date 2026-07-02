"use client";

import { useEffect, useState } from "react";

import { api } from "@saintrocky/api-client";
import { DashboardOverview, LeaderboardWidget, RuntimesPanel } from "@saintrocky/ui";

const fallbackCounts = {
  disciplineScore: "—",
  escrowBalanceSol: "—",
  activeRules: 0,
  recentViolations: 0
};

export default function DashboardPage() {
  const [counts, setCounts] = useState(fallbackCounts);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [extensionSessions, setExtensionSessions] = useState([]);
  const [realtimeStatus, setRealtimeStatus] = useState("idle");

  useEffect(() => {
    let isMounted = true;

    async function loadOverviewData() {
      const [summaryResult, leaderboardResult, sessionsResult] = await Promise.allSettled([
        api.dashboard.summary(),
        api.leaderboard.getLeaderboard(10),
        api.extensionSessions.list()
      ]);

      if (!isMounted) return;

      if (summaryResult.status === "fulfilled") {
        setCounts(summaryResult.value?.counts || fallbackCounts);
      }
      if (leaderboardResult.status === "fulfilled") {
        setLeaderboardEntries(leaderboardResult.value?.leaderboard || []);
      }
      if (sessionsResult.status === "fulfilled") {
        setExtensionSessions(sessionsResult.value?.sessions || []);
        setRealtimeStatus("loaded");
      }
    }

    loadOverviewData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="c-CompactDashboardPage c-DashboardOverviewPage">
      <DashboardOverview
        variant="compact"
        counts={counts}
      />

      <div className="c-DashboardOverviewPage__widgets">
        <LeaderboardWidget
          entries={leaderboardEntries}
          variant="compact"
          limit={10}
          enableRealtime
        />

        <RuntimesPanel
          extensionSessions={extensionSessions}
          realtimeStatus={realtimeStatus}
        />
      </div>
    </div>
  );
}
