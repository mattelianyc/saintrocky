# Dev Quickstart

Everything you need running locally to develop against the full stack including Solana.

---

## System Requirements

- Node.js >= 20
- Yarn 1.x
- MongoDB (local or Atlas)
- Redis (for cache/sessions)
- Rust + Solana CLI + Anchor CLI (for blockchain work only)

---

## Terminal Layout

You'll need 4-5 terminals running simultaneously:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `solana-test-validator` | Local Solana cluster |
| 2 | `yarn dev:api` | Express API server (port 4000) |
| 3 | `yarn dev:web` | Next.js web app (port 5173) |
| 4 | `yarn dev:electron` | Electron desktop app |
| 5 | Browser extension | Loaded from `apps/extension/dist` |

---

## Step-by-Step

### 1. Install everything

```bash
yarn install
```

### 2. Set up .env

Copy the example and fill in required values:

```bash
cp .env.example .env
```

Minimum required:

```env
MONGODB_URI=mongodb://localhost:27017/saintrocky
JWT_SECRET=any-random-string
SOLANA_RPC_URL=http://localhost:8899
```

### 3. Seed the database

```bash
yarn seed:all
```

This runs all seeders (users, blog, rules, wallets, etc.) and populates the DB with realistic dev data.

Individual seeders:

```bash
yarn seed:users
yarn seed:rules
yarn seed:wallets
```

### 4. Start the Solana validator (optional, needed for on-chain features)

```bash
solana-test-validator
```

See [solana-escrow-setup.md](./solana-escrow-setup.md) for full Solana setup instructions including Anchor build and deploy.

### 5. Start the API

```bash
yarn dev:api
```

### 6. Start the web app

```bash
yarn dev:web
```

### 7. Build and run Electron

```bash
yarn workspace @saintrocky/electron build
yarn workspace @saintrocky/electron dev
```

### 8. Build and load the browser extension

```bash
yarn workspace @saintrocky/extension build
```

Then in Chrome:

1. Navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/dist`

---

## Seeded Users

After running `yarn seed:users`, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@saintrocky.io` | `password` | `platform_admin` |
| `mod@saintrocky.io` | `password` | `community_moderator` |
| `member1@saintrocky.io` | `password` | `member` |
| `member2@saintrocky.io` ... `member50@saintrocky.io` | `password` | `member` |

Check `apps/api/scripts/seed-users.mjs` for the full list.

---

## Workspace Scripts

From the monorepo root:

```bash
yarn dev:api          # API server with --watch
yarn dev:web          # Next.js dev server
yarn seed:all         # Run all seeders
yarn seed:users       # Seed users only
yarn seed:rules       # Seed rules only
yarn seed:wallets     # Seed wallet links + trades
```

---

## Package Overview

| Package | Purpose |
|---------|---------|
| `@saintrocky/shared` | Rule engine, templates, runtime utilities |
| `@saintrocky/chain` | Solana program IDs, trade parser, trading domains/apps |
| `@saintrocky/escrow` | JS client SDK for the Anchor escrow program |
| `@saintrocky/realtime` | WebSocket client/server for cross-app sync |
| `@saintrocky/validation` | Zod schemas for rules, drafts, API payloads |
| `@saintrocky/ui` | Shared React components (web + Electron) |
| `@saintrocky/ui-native` | Shared React Native components (mobile) |
| `@saintrocky/api-client` | HTTP client for all API endpoints |
| `@saintrocky/config` | Env schema definitions and runtime config |
| `@saintrocky/design-tokens` | CSS custom properties, SCSS tokens |
| `@saintrocky/icons` | SVG icon components |
