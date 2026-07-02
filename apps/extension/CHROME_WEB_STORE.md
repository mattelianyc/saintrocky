# Chrome Web Store Prep

## Privacy

- Public privacy policy route: `https://www.thestandard.dev/privacy`
- Manifest homepage: `https://www.thestandard.dev`

## Build And Upload

```bash
export EXTENSION_API_BASE_URL="https://www.thestandard.dev"
export EXTENSION_ALLOWED_ORIGINS="https://www.thestandard.dev"
yarn build:extension
cd apps/extension && zip -r saintrocky-extension.zip dist/
```

Upload `apps/extension/saintrocky-extension.zip` to the Chrome Web Store dashboard.

## Single Purpose

The extension exists to enforce active $TANDARD / DEVIANT$ browser rules by:

- authenticating a trusted runtime session from the web dashboard
- receiving browser rule assignments over realtime
- blocking matching pages when rules are active
- handling override countdown and confirmation flows

## Permissions

### `storage`

Used to persist authenticated runtime state, current assignments, pending violations, and override countdown state.

### `tabs`

Used to evaluate tab navigation events, query open tabs when clearing auth state, and synchronize overlays across blocked tabs.

### `host_permissions: <all_urls>`

Required because users can author domain rules against arbitrary sites. The extension must inspect the current page URL and inject the blocking overlay on whatever domains the active rule targets.

## Listing Copy

### Short Description

Enforces user-configured trading discipline rules by blocking sites and gating overrides.

### Detailed Description

$TANDARD / DEVIANT$ turns your browser into an enforcement surface for the trading rules you choose to live by.

- Authenticate the extension from the $TANDARD / DEVIANT$ web dashboard
- Receive active browser rule assignments in realtime
- Block matching sites when a rule is active
- Start, cancel, and confirm override countdown flows without leaving the page
- Keep runtime state synced with your $TANDARD / DEVIANT$ account

This extension is built for traders who want their browser behavior to follow the rules they already decided on before emotion, boredom, or impulse takes over.

### Category

Productivity

## Privacy Practices Draft

Use this as the source of truth when filling out the Chrome Web Store privacy questionnaire.

### What the extension accesses

- Current page URL
- Current page domain / hostname
- Current page title
- Tab state needed to apply or clear enforcement overlays
- Authenticated $TANDARD / DEVIANT$ session state stored locally in the extension

### Data collected

- Browsing activity related to rule enforcement: current URL, domain, and page title
- User identifiers tied to the authenticated $TANDARD / DEVIANT$ account, such as email and session state
- Extension runtime events related to blocked pages, overrides, and rule-triggered actions

### Data not collected by this extension

- Passwords
- Payment card or bank information
- Personal communications
- Precise location
- Health information
- Keystrokes
- Full page contents beyond URL, hostname, and title needed for enforcement context

### How the data is used

- Determine whether the current page matches an active browser rule
- Render or clear the enforcement overlay on matching pages
- Sync extension runtime state with the $TANDARD / DEVIANT$ backend
- Support override countdown, confirmation, and audit history

### Chrome Web Store privacy answers

- Sold to third parties: `No`
- Used for advertising: `No`
- Used for creditworthiness or lending: `No`
- Collected browsing activity: `Yes`
- Collected user IDs / account data: `Yes`
- Collection limited to feature operation: `Yes`
- Data handling described in privacy policy: `Yes`

## Screenshots Checklist

- Extension popup signed-in state
- Page blocking overlay on a matched trading domain
- Override countdown state
- Optional: web dashboard handoff flow showing how the extension connects to the account

## Release Checklist

- Build with production runtime env values so `EXTENSION_API_BASE_URL` and `EXTENSION_ALLOWED_ORIGINS` target the deployed web and API host.
- Confirm `apps/extension/src/assets/extension-icon-16.png`, `extension-icon-48.png`, and `extension-icon-128.png` are included in the uploaded zip.
- Confirm the popup and in-page overlay render with the generated token CSS from `packages/design-tokens`.
- Verify auth handoff works only from allowed origins.
- Verify the Chrome Web Store listing links to the hosted privacy policy and describes the domain-blocking rule-enforcement purpose clearly.
