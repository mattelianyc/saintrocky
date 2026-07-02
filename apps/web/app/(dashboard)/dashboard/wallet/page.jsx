"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { Card, Button } from "@saintrocky/ui";
import { ESCROW_IDL } from "@saintrocky/escrow";
import { useWalletLink, useEscrowVault } from "@saintrocky/wallet";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (module) => module.WalletMultiButton
    ),
  { ssr: false }
);

export default function WalletPage() {
  return (
    <div className="c-CompactDashboardPage c-WalletPage">
      <div className="c-CompactDashboardPage__grid">
        <div className="c-CompactDashboardPage__stack">
          <ConnectionCard />
          <LinkedWalletsCard />
        </div>
        <aside className="c-CompactDashboardPage__rail">
          <EscrowVaultCard />
        </aside>
      </div>
    </div>
  );
}

function ConnectionCard() {
  const { walletAddress, connected, isLinked, isLinking, linkCurrentWallet } =
    useWalletLink();

  return (
    <Card className="c-CompactDashboardCard">
      <div className="c-CompactDashboardCard__stack">
        <h2>Connection</h2>
        <div className="c-WalletConnectRow">
          <WalletMultiButton />
        </div>

        {connected && (
          <>
            <p className="c-WalletAddress">{walletAddress}</p>
            {isLinked ? (
              <p className="c-WalletStatus c-WalletStatus--linked">
                Linked to your account
              </p>
            ) : (
              <Button
                variant="primary"
                onClick={() => linkCurrentWallet("Primary")}
                loading={isLinking}
                loadingLabel="Linking..."
              >
                Link this wallet
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function EscrowVaultCard() {
  const { vault, balanceSol, isLoading, error, deposit, withdraw, createVault } =
    useEscrowVault({ idl: ESCROW_IDL });
  const [amount, setAmount] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  async function handleDeposit() {
    const lamports = Math.round(parseFloat(amount) * 1_000_000_000);
    if (!lamports || lamports <= 0) return;
    setPendingAction("deposit");
    await deposit(lamports);
    setAmount("");
    setPendingAction(null);
  }

  async function handleWithdraw() {
    const lamports = Math.round(parseFloat(amount) * 1_000_000_000);
    if (!lamports || lamports <= 0) return;
    setPendingAction("withdraw");
    await withdraw(lamports);
    setAmount("");
    setPendingAction(null);
  }

  async function handleCreateVault() {
    setPendingAction("create");
    await createVault();
    setPendingAction(null);
  }

  if (isLoading) {
    return (
      <Card className="c-CompactDashboardCard">
        <div className="c-CompactDashboardCard__stack">
          <h2>Escrow Vault</h2>
          <p>Loading vault...</p>
        </div>
      </Card>
    );
  }

  if (!vault) {
    return (
      <Card className="c-CompactDashboardCard">
        <div className="c-CompactDashboardCard__stack">
          <h2>Escrow Vault</h2>
          <p>No vault found for this wallet. Create one to start staking.</p>
          {error && <p className="c-WalletError">{error}</p>}
          <Button
            variant="primary"
            onClick={handleCreateVault}
            loading={pendingAction === "create"}
            loadingLabel="Creating..."
          >
            Create Vault
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="c-CompactDashboardCard">
      <div className="c-CompactDashboardCard__stack">
        <h2>Escrow Vault</h2>
        <div className="c-VaultBalance">
          <span className="c-VaultBalance__label">Balance</span>
          <strong className="c-VaultBalance__value">
            {balanceSol.toFixed(4)} SOL
          </strong>
        </div>

        {error && <p className="c-WalletError">{error}</p>}

        <div className="c-VaultActions">
          <input
            className="c-VaultActions__input"
            type="number"
            step="0.001"
            min="0"
            placeholder="SOL amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <div className="c-VaultActions__buttons">
            <Button
              variant="primary"
              onClick={handleDeposit}
              loading={pendingAction === "deposit"}
              loadingLabel="Depositing..."
              disabled={!amount}
            >
              Deposit
            </Button>
            <Button
              variant="ghost"
              onClick={handleWithdraw}
              loading={pendingAction === "withdraw"}
              loadingLabel="Withdrawing..."
              disabled={!amount}
            >
              Withdraw
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LinkedWalletsCard() {
  const { linkedWallets, isLoading, unlinkWallet, error } = useWalletLink();

  return (
    <Card className="c-CompactDashboardCard">
      <div className="c-CompactDashboardCard__stack">
        <h2>Linked Wallets</h2>

        {error && <p className="c-WalletError">{error}</p>}

        {isLoading ? (
          <p>Loading linked wallets...</p>
        ) : linkedWallets.length === 0 ? (
          <p>No wallets linked yet. Connect a wallet above, then link it.</p>
        ) : (
          <ul className="c-LinkedWalletList">
            {linkedWallets.map((wallet) => (
              <li
                key={wallet.walletAddress}
                className="c-LinkedWalletList__item"
              >
                <span className="c-LinkedWalletList__address">
                  {wallet.walletAddress}
                </span>
                <span className="c-LinkedWalletList__label">
                  {wallet.label || "Primary"}
                </span>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => unlinkWallet(wallet.walletAddress)}
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
