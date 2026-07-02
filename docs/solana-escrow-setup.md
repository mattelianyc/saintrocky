# Solana Escrow -- Local Development Setup

Step-by-step guide to building, deploying, and testing the on-chain escrow program locally.

---

## Prerequisites

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
rustup update
```

### 2. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
```

After install, add to your PATH (the installer will tell you the exact line):

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

Verify:

```bash
solana --version
```

### 3. Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.30.1
avm use 0.30.1
```

Verify:

```bash
anchor --version
```

### 4. Install Node dependencies

From the monorepo root:

```bash
yarn install
```

---

## One-Time Solana Setup

### 1. Configure Solana for localhost

```bash
solana config set --url localhost
```

### 2. Generate a dev keypair (if you don't have one)

```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

This keypair becomes the **platform authority** -- it signs `record_penalty` and `distribute_rewards` transactions.

### 3. Generate a real program keypair and update the program ID

The placeholder `SRockEscrow11111111111111111111111111111111` needs to be replaced with a real keypair:

```bash
solana-keygen new --outfile apps/blockchain/escrow/target/deploy/saintrocky_escrow-keypair.json --no-bip39-passphrase
```

Get the public key:

```bash
solana address -k apps/blockchain/escrow/target/deploy/saintrocky_escrow-keypair.json
```

Copy the output (e.g., `AbC123...xyz`) and replace the placeholder in **three places**:

1. `apps/blockchain/escrow/src/lib.rs` -- the `declare_id!("...")` macro
2. `apps/blockchain/Anchor.toml` -- both `[programs.localnet]` and `[programs.devnet]`
3. `packages/escrow/src/constants.js` -- the `ESCROW_PROGRAM_ID` value

---

## Build and Deploy (Local)

### 1. Start the local Solana validator

In a dedicated terminal:

```bash
solana-test-validator
```

This runs a local Solana cluster at `http://localhost:8899`. Leave this running.

### 2. Airdrop SOL to your dev wallet

```bash
solana airdrop 10
```

Repeat if needed. You need SOL to deploy programs and pay for transactions.

### 3. Build the Anchor program

```bash
cd apps/blockchain
anchor build
```

This compiles the Rust program and generates:

- `apps/blockchain/escrow/target/deploy/saintrocky_escrow.so` -- the compiled program
- `apps/blockchain/target/idl/saintrocky_escrow.json` -- the IDL (Interface Description Language)

### 4. Deploy the program to localnet

```bash
anchor deploy
```

If it fails with insufficient funds, airdrop more SOL.

### 5. Copy the IDL for the JS client

The `@saintrocky/escrow` client needs the IDL at runtime. Copy it:

```bash
cp apps/blockchain/target/idl/saintrocky_escrow.json packages/escrow/src/idl.json
```

---

## Initialize the Platform

After deploying, the platform needs a one-time initialization to create the `PlatformConfig` and `FeePool` PDA accounts.

Create a script at `apps/blockchain/scripts/initialize-platform.mjs`:

```javascript
import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { readFileSync } from 'node:fs';
import { createEscrowClient } from '@saintrocky/escrow';

const connection = new Connection('http://localhost:8899', 'confirmed');
const keypairData = JSON.parse(readFileSync(
  `${process.env.HOME}/.config/solana/id.json`, 'utf-8'
));
const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
const wallet = new Wallet(keypair);

const idl = JSON.parse(readFileSync(
  new URL('../target/idl/saintrocky_escrow.json', import.meta.url), 'utf-8'
));

const client = createEscrowClient({ connection, wallet, idl });

const result = await client.initializePlatform(100); // 100 bps = 1% penalty fee
console.log('Platform initialized:', result);

const config = await client.getPlatformConfig();
console.log('Platform config:', config);
```

Run it:

```bash
node apps/blockchain/scripts/initialize-platform.mjs
```

---

## Wire the API to Solana

### 1. Add env vars to `.env`

```env
SOLANA_RPC_URL=http://localhost:8899
HELIUS_API_KEY=
HELIUS_WEBHOOK_SECRET=
PUBLIC_API_URL=http://localhost:4000
```

`HELIUS_API_KEY` is only needed for production webhook registration. Leave blank for local dev.

### 2. Bootstrap the escrow client in the API startup

In `apps/api/src/index.js`, add the escrow client initialization after the server starts:

```javascript
import { Connection, Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import { readFileSync } from 'node:fs';
import { createEscrowClient } from '@saintrocky/escrow';
import { setEscrowClient } from './services/escrow.service.js';
import { env } from './config/env.js';

// After server.listen(...)
if (env.solanaRpcUrl && env.solanaRpcUrl !== 'https://api.mainnet-beta.solana.com') {
  try {
    const connection = new Connection(env.solanaRpcUrl, 'confirmed');
    const keypairPath = `${process.env.HOME}/.config/solana/id.json`;
    const keypairData = JSON.parse(readFileSync(keypairPath, 'utf-8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    const wallet = new Wallet(keypair);
    const idl = JSON.parse(readFileSync(
      new URL('../../apps/blockchain/target/idl/saintrocky_escrow.json', import.meta.url),
      'utf-8'
    ));
    const escrowClient = createEscrowClient({ connection, wallet, idl });
    setEscrowClient(escrowClient);
    console.log('[escrow] on-chain client initialized');
  } catch (err) {
    console.warn('[escrow] skipping on-chain client:', err.message);
  }
}
```

---

## Testing the Full Flow

### 1. Create a user vault

From the web app, a user connects their Phantom wallet via the wallet connect UI. Internally this:

1. Calls `POST /api/v1/wallets/link` with the wallet address
2. The API creates a `WalletLink` record
3. If `HELIUS_API_KEY` is set, registers a Helius webhook for that wallet

### 2. Deposit into escrow

The user deposits SOL into their escrow vault via the web UI, which calls the `deposit` instruction on-chain.

### 3. Rule violations trigger penalties

When the chain watcher receives a Helius webhook payload and detects a violation:

1. `chain-watcher.service.js` evaluates the trade against active chain rules
2. On violation, it calls `escrow.service.js` -> `recordPenaltyOnChain()`
3. The penalty moves SOL from the user's vault to the fee pool on-chain

### 4. Rewards distribution

A periodic job (cron or manual) calls `distributeRewardsOnChain()` for disciplined users, moving SOL from the fee pool back to their vaults.

---

## Helius Webhook Setup (Production / Devnet)

For devnet or mainnet, the chain watcher receives real-time transaction notifications from Helius:

### 1. Get a Helius API key

Sign up at [helius.dev](https://helius.dev) and get an API key.

### 2. Set env vars

```env
HELIUS_API_KEY=your_helius_api_key
HELIUS_WEBHOOK_SECRET=a_random_secret_you_choose
PUBLIC_API_URL=https://your-api-domain.com
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=your_helius_api_key
```

### 3. Expose the webhook endpoint

The webhook endpoint is `POST /api/v1/chain/webhook/helius`. Helius will POST enhanced transaction data to this URL whenever the linked wallet transacts.

For local dev testing with Helius, use a tunnel:

```bash
npx localtunnel --port 4000
```

Then set `PUBLIC_API_URL` to the tunnel URL.

---

## Devnet Deployment

### 1. Switch Solana config to devnet

```bash
solana config set --url devnet
```

### 2. Airdrop devnet SOL

```bash
solana airdrop 2
```

### 3. Update Anchor.toml

Change `[provider]` cluster:

```toml
[provider]
cluster = "Devnet"
```

### 4. Build and deploy

```bash
cd apps/blockchain
anchor build
anchor deploy
```

### 5. Update SOLANA_RPC_URL

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
```

Or use the Helius RPC for better reliability:

```env
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=your_helius_api_key
```

---

## File Reference

| Path | Purpose |
|------|---------|
| `apps/blockchain/Anchor.toml` | Anchor project config (program IDs, cluster, wallet) |
| `apps/blockchain/escrow/Cargo.toml` | Rust crate config |
| `apps/blockchain/escrow/src/lib.rs` | Program instructions (6 instructions) |
| `apps/blockchain/escrow/src/state.rs` | PDA account structs |
| `apps/blockchain/escrow/src/errors.rs` | Custom error codes |
| `packages/escrow/src/client.js` | JS client SDK for calling the program |
| `packages/escrow/src/constants.js` | Program ID, PDA seeds, address finders |
| `packages/chain/src/programs.js` | Solana DEX program IDs (Pump.fun, Jupiter, etc.) |
| `packages/chain/src/transaction-parser.js` | Helius webhook payload parser |
| `apps/api/src/services/escrow.service.js` | API-side escrow operations |
| `apps/api/src/services/chain-watcher.service.js` | Helius webhook handler + rule evaluation |
| `apps/api/src/services/wallets.service.js` | Wallet linking + Helius registration |

---

## Troubleshooting

**"Error: Account does not exist"** -- The program hasn't been deployed or the program ID doesn't match. Re-check the three locations where the ID is set.

**"Error: Insufficient funds"** -- Airdrop more SOL: `solana airdrop 5`

**"Error: custom program error: 0x0"** -- Usually means a PDA account already exists (e.g., trying to `initialize_platform` twice).

**Anchor build fails with "rustc version mismatch"** -- Run `rustup update stable` and retry.

**IDL not found** -- Make sure you ran `anchor build` and the IDL exists at `apps/blockchain/target/idl/saintrocky_escrow.json`.
