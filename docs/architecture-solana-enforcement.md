# Solana Enforcement Architecture

How the two-layer enforcement system works across all surfaces.

---

## Overview

The system enforces user-defined trading rules through two coordinated layers:

1. **Proactive blocking** -- browser extension and desktop app block access to trading domains/apps based on schedule, manual locks, and cooldowns
2. **Detective on-chain monitoring** -- Helius webhooks detect actual trades on Solana DEXs and apply escrow penalties when rules are violated

Both layers feed into the same rule engine (`@saintrocky/shared`) and the same realtime pubsub (`@saintrocky/realtime`).

---

## Data Flow

```
User sets rules via web UI
        |
        v
  API saves UserRule with compiledRule
  (targets[], chainConstraints, schedule)
        |
        +--------+--------+---------+
        |        |        |         |
        v        v        v         v
   Extension  Desktop  Chain     Mobile
   (domains)  (apps)   Watcher   (read-only)
        |        |        |
        v        v        v
   Block UI   Block UI  Helius webhook
   overlay    overlay   -> parse trade
        |        |     -> evaluate constraints
        v        v     -> record violation
   Bypass fee  Bypass  -> escrow penalty on-chain
   (escrow)    fee     -> realtime broadcast
```

---

## Compiled Rule Shape

Every rule compiles to this universal shape stored in MongoDB:

```json
{
  "summary": "Max 5 trades per day.",
  "targets": [
    { "type": "domain", "value": "pump.fun" },
    { "type": "domain", "value": "jup.ag" },
    { "type": "app", "value": "Phantom" }
  ],
  "chainConstraints": {
    "type": "max_trades_per_day",
    "maxTrades": 5
  },
  "schedule": {
    "type": "always"
  },
  "enforcement": {
    "action": "block",
    "userMessage": "You've hit your daily trade limit."
  },
  "bypass": {
    "allowed": true,
    "feeModel": "escrow_deduction",
    "escrowDeductionBps": 100
  },
  "telemetry": {
    "templateId": "template-max-trades-per-day",
    "category": "trade_limits",
    "source": "template"
  }
}
```

### Target Types

- `domain` -- enforced by the browser extension (blocks navigation)
- `app` -- enforced by the desktop runtime hub (detects visible processes)

### Chain Constraint Types

- `max_trades_per_day` -- caps daily trade count
- `max_position_size` -- caps SOL per trade
- `max_daily_loss` -- caps cumulative daily sell volume
- `min_token_age` -- blocks buying tokens younger than N hours
- `blocked_tokens` -- blocks specific token mints
- `cooldown_after_loss` -- locks trading for N minutes after a sell
- `schedule_violation` -- any trade during a restricted time window

### Schedule Types

- `always` -- rule is always active
- `window` -- active during specific time windows (with timezone)
- `manual_lock` -- active when manually armed by the user
- `cooldown` -- active for a duration after being armed

---

## Surface Inference

Rules don't declare a single `runtimeSurface`. Instead, enforcement surfaces are inferred from the rule's content:

- Has `domain` targets -> `browser_extension`
- Has `app` targets -> `desktop_runtime`
- Has `chainConstraints` -> `chain_watcher`

A single rule can span multiple surfaces (e.g., block pump.fun in the browser AND block Phantom on desktop AND detect trades on-chain).

---

## Escrow Smart Contract

The Anchor program at `apps/blockchain/escrow/` manages user funds on-chain.

### PDA Accounts

- **PlatformConfig** (seed: `platform_config`) -- singleton, stores the authority pubkey and global stats
- **UserVault** (seed: `user_vault` + owner pubkey) -- per-user, tracks balance, deposits, penalties, rewards
- **FeePool** (seed: `fee_pool`) -- singleton, accumulates penalty fees for redistribution

### Instructions

1. `initialize_platform(penalty_fee_bps)` -- one-time setup by authority
2. `create_user_vault()` -- user creates their vault (pays rent)
3. `deposit(amount)` -- user transfers SOL into their vault
4. `record_penalty(amount, violation_id)` -- authority deducts from vault -> fee pool
5. `distribute_rewards(amount)` -- authority sends from fee pool -> vault
6. `withdraw(amount)` -- user withdraws from their vault

### Security Model

- Only the **platform authority** can call `record_penalty` and `distribute_rewards`
- Only the **vault owner** can call `deposit` and `withdraw`
- PDA derivation ensures one vault per wallet address

---

## Helius Integration

Helius webhooks provide real-time transaction monitoring for linked wallets.

### Flow

1. User links wallet via `POST /api/v1/wallets/link`
2. API registers a Helius enhanced webhook for that wallet address
3. Helius POSTs to `POST /api/v1/chain/webhook/helius` on every transaction
4. `chain-watcher.service.js` parses the payload with `@saintrocky/chain`
5. Identifies the DEX program (Pump.fun, Jupiter, Raydium, etc.)
6. Evaluates against all active chain rules for that user
7. Records the trade in MongoDB (`ChainTrade` model)
8. If violated: records violation details, calls escrow penalty, broadcasts via realtime

### Monitored Programs

- Pump.fun (`6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`)
- PumpSwap (`PSwapMdSai8tjrEXcxFeQth87xC4rRsa4VA5mhGhXkP`)
- Jupiter (`JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`)
- Raydium AMM (`675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`)
- Raydium CLMM (`CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`)
- Orca Whirlpool (`whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc`)

---

## Browser Extension Enforcement

The extension background script (`apps/extension/src/background/background.js`):

1. Receives rule assignments via realtime WebSocket subscription
2. On every `chrome.tabs.onUpdated` event, extracts the domain
3. Matches the domain against all active rules' `targets[]` where `type === 'domain'`
4. Checks `isScheduleActive()` for the matched rule
5. If triggered: renders a block overlay on the tab via the content script
6. User can comply (stay blocked) or pay to bypass (escrow deduction)

---

## Desktop Enforcement

The Electron runtime hub (`apps/electron/src/runtime-hub.js`):

1. Polls visible processes every 5 seconds via `process-observer.js`
2. Matches process names against all active rules' `targets[]` where `type === 'app'`
3. Checks `isScheduleActive()` for the matched rule
4. If triggered: emits a pending violation to the renderer
5. Also detects **browser evasion**: if domain rules exist but no extension session is connected while a browser process is running, flags an enforcement gap

---

## Leaderboard and Rewards

### Discipline Score (0-100)

- **Rule commitment** (0-40 pts): more active rules = higher score
- **Compliance rate** (0-40 pts): (trades - violations) / trades over 30 days
- **Escrow commitment** (0-20 pts): SOL staked in escrow vault

### Reward Distribution

50% of collected penalty fees are redistributed to disciplined users on a gradient: rank 1 gets the largest share, rank 2 slightly less, etc.

The `distribute_rewards` instruction moves SOL from the on-chain FeePool to individual UserVaults.
