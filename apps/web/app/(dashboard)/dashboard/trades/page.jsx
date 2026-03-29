"use client";

import { useState, useEffect, useCallback } from "react";

import { api } from "@saintrocky/api-client";
import { Card } from "@saintrocky/ui";
import { useWalletLink } from "@saintrocky/wallet";

export default function TradesPage() {
  const { linkedWallets, isLoading: walletsLoading } = useWalletLink();
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const fetchTrades = useCallback(async (walletAddress) => {
    if (!walletAddress) return;
    setIsLoading(true);
    try {
      const result = await api.chain.listRecentTrades(walletAddress);
      setTrades(result.trades || []);
    } catch {
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (linkedWallets.length > 0 && !selectedWallet) {
      const defaultWallet = linkedWallets[0].walletAddress;
      setSelectedWallet(defaultWallet);
      fetchTrades(defaultWallet);
    }
  }, [linkedWallets, selectedWallet, fetchTrades]);

  function handleWalletChange(event) {
    const address = event.target.value;
    setSelectedWallet(address);
    fetchTrades(address);
  }

  return (
    <div className="c-DashboardSectionPage">
      <header className="c-DashboardSectionPage__header">
        <h1>Trade History</h1>
        <p>
          Review detected on-chain trades, violation flags, and penalty records
          across your linked wallets.
        </p>
      </header>

      {linkedWallets.length > 1 && (
        <div className="c-TradesWalletSelector">
          <label htmlFor="wallet-select">Wallet</label>
          <select
            id="wallet-select"
            value={selectedWallet || ""}
            onChange={handleWalletChange}
          >
            {linkedWallets.map((wallet) => (
              <option key={wallet.walletAddress} value={wallet.walletAddress}>
                {wallet.label || wallet.walletAddress}
              </option>
            ))}
          </select>
        </div>
      )}

      <section className="c-DashboardSectionPage__grid">
        {walletsLoading || isLoading ? (
          <Card>
            <div className="c-DashboardSectionPage__cardStack">
              <p>Loading trades...</p>
            </div>
          </Card>
        ) : linkedWallets.length === 0 ? (
          <Card>
            <div className="c-DashboardSectionPage__cardStack">
              <h2>No wallets linked</h2>
              <p>
                Link a wallet on the Wallet page to start monitoring trades.
              </p>
            </div>
          </Card>
        ) : trades.length === 0 ? (
          <Card>
            <div className="c-DashboardSectionPage__cardStack">
              <h2>No trades detected</h2>
              <p>
                No on-chain trades have been detected for this wallet yet.
              </p>
            </div>
          </Card>
        ) : (
          <TradeTable trades={trades} />
        )}
      </section>
    </div>
  );
}

function TradeTable({ trades }) {
  return (
    <div className="c-TradeTable">
      <table className="c-TradeTable__table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Platform</th>
            <th>Token</th>
            <th>Side</th>
            <th>Amount</th>
            <th>Violation</th>
            <th>Signature</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.signature}
              className={
                trade.violatedRuleId
                  ? "c-TradeTable__row--violation"
                  : ""
              }
            >
              <td>{new Date(trade.timestamp).toLocaleString()}</td>
              <td>{trade.platform || "Unknown"}</td>
              <td>{trade.tokenSymbol || trade.tokenMint || "—"}</td>
              <td>{trade.side || "—"}</td>
              <td>{trade.amount ? Number(trade.amount).toFixed(4) : "—"}</td>
              <td>
                {trade.violatedRuleId ? (
                  <span className="c-TradeViolationBadge">Violated</span>
                ) : (
                  <span className="c-TradeCleanBadge">Clean</span>
                )}
              </td>
              <td>
                <span className="c-TradeSignature" title={trade.signature}>
                  {trade.signature?.slice(0, 8)}...
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
