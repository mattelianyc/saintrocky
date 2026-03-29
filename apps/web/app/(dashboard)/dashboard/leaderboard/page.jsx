"use client";

import { useState, useEffect } from "react";

import { api } from "@saintrocky/api-client";
import { Card } from "@saintrocky/ui";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);
  const [myScore, setMyScore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [leaderboardResult, scoreResult] = await Promise.allSettled([
          api.leaderboard.getLeaderboard(50),
          api.leaderboard.getMyDisciplineScore()
        ]);

        if (leaderboardResult.status === "fulfilled") {
          setEntries(leaderboardResult.value.entries || []);
        }
        if (scoreResult.status === "fulfilled") {
          setMyScore(scoreResult.value);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="c-DashboardSectionPage">
      <header className="c-DashboardSectionPage__header">
        <h1>Leaderboard</h1>
        <p>
          Discipline rankings across the network. Stay compliant, earn a bigger
          share of the fee pool.
        </p>
      </header>

      <section className="c-DashboardSectionPage__grid">
        {myScore && <MyScoreCard score={myScore} />}

        {isLoading ? (
          <Card>
            <div className="c-DashboardSectionPage__cardStack">
              <p>Loading leaderboard...</p>
            </div>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <div className="c-DashboardSectionPage__cardStack">
              <h2>No leaderboard data</h2>
              <p>
                The leaderboard will populate once traders link wallets and
                begin enforcing rules.
              </p>
            </div>
          </Card>
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </section>
    </div>
  );
}

function MyScoreCard({ score }) {
  return (
    <Card>
      <div className="c-DashboardSectionPage__cardStack">
        <h2>Your Discipline Score</h2>
        <div className="c-DisciplineScore">
          <strong className="c-DisciplineScore__value">
            {score.disciplineScore ?? "—"}
          </strong>
          <span className="c-DisciplineScore__label">/ 100</span>
        </div>
        {score.rank && (
          <p className="c-DisciplineScore__rank">
            Rank #{score.rank} of {score.totalTraders || "—"}
          </p>
        )}
      </div>
    </Card>
  );
}

function LeaderboardTable({ entries }) {
  return (
    <div className="c-LeaderboardTable">
      <table className="c-LeaderboardTable__table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Trader</th>
            <th>Score</th>
            <th>Violations</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.walletAddress || entry.userId || index}>
              <td>{index + 1}</td>
              <td>
                {entry.displayName ||
                  (entry.walletAddress
                    ? `${entry.walletAddress.slice(0, 4)}...${entry.walletAddress.slice(-4)}`
                    : "Anonymous")}
              </td>
              <td>
                <strong>{entry.disciplineScore ?? "—"}</strong>
              </td>
              <td>{entry.totalViolations ?? 0}</td>
              <td>{entry.cleanStreak ?? 0} days</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
