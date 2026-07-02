# saintrocky Monorepo

Production monorepo (Yarn workspaces) with:
- Web app (Next.js App Router + SSR)
- Mobile app (Expo + React Native)
- HTTP API (Next.js Route Handlers under `/api/*`)
- Background workers (Node: cron + RabbitMQ consumers)
- Shared packages (`@saintrocky/*`):
  - `@saintrocky/ui` (Base UI primitives + composed layout/compounds + SCSS)
  - `@saintrocky/validation` (Yup schemas + message keys/translations)
  - `@saintrocky/api-client`
  - `@saintrocky/shared`
  - `@saintrocky/assets` (S3 upload helpers + presigned URL flow)
  - `@saintrocky/server` (server-only utilities used by Next API + worker)

## Requirements

- Node: `>=18` (see `.nvmrc`)
- Yarn: `1.22.x`
- MongoDB + Redis + RabbitMQ running locally (or accessible URLs)

## Environment

Single shared env file at repo root:
- Copy `.env.example` → `.env`
- Fill in required variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `REDIS_URL`
  - `RABBITMQ_URL`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_S3_BUCKET`
  - `AWS_REGION`
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `EXPO_PUBLIC_API_URL` (mobile)

S3 uploads (presigned URLs + public assets) are powered by `@saintrocky/assets` and require the AWS vars above.

## Install

```bash
# Optional: rename scaffold placeholders across the monorepo
# - Replaces `saintrocky` with your project slug
# - Replaces `@saintrocky` with your npm scope (e.g. `@rabbithole`)
node ./scripts/set-project.mjs --slug <your-project-slug> --scope <your-npm-scope> --dry-run
node ./scripts/set-project.mjs --slug <your-project-slug> --scope <your-npm-scope>

yarn install
```

## Run (dev)

```bash
# web + worker (recommended)
yarn dev

# just web
yarn dev:web

# just worker
yarn dev:worker

# mobile (Expo)
yarn dev:mobile
```

## UI / Components styling

The web app is intentionally light on app-level CSS. It pulls styling from the packages:
- `@saintrocky/ui/base.scss` (global baseline)
- `@saintrocky/ui/primitives.scss` (primitive styles)
- `@saintrocky/ui/compounds.scss` (compound styles)
- `@saintrocky/ui/layout.scss` (layout styles)

## Storybook

```bash
# UI storybook (primitives + compounds + layout)
yarn workspace @saintrocky/ui storybook
```

## API notes

The HTTP API is implemented in the Next app as Route Handlers under `app/api/**` (paths like `/api/v1/auth/*`).

Long-lived jobs (cron + queue consumers) run in the worker app:
- `yarn workspace @saintrocky/worker dev`

## Build / Start

```bash
yarn build

# starts web preview (Procfile entry)
yarn start
```

## Test / Lint

```bash
yarn test
yarn lint
```


