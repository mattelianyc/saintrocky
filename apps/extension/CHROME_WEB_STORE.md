# Chrome Web Store Prep

## Privacy

- Public privacy policy route: `https://saintrocky.com/privacy`
- Manifest homepage: `https://saintrocky.com/privacy`

## Single Purpose

The extension exists to enforce active Saint Rocky browser rules by:

- authenticating a trusted runtime session from the web dashboard
- receiving browser rule assignments over realtime
- blocking matching pages when rules are active
- handling override countdown and confirmation flows

## Permissions

### `storage`

Used to persist authenticated runtime state, current assignments, pending violations, and override countdown state.

### `activeTab`

Used to communicate with the currently active tab when a rule needs to render or clear the enforcement overlay.

### `tabs`

Used to evaluate tab navigation events, query open tabs when clearing auth state, and synchronize overlays across blocked tabs.

### `host_permissions: <all_urls>`

Required because users can author domain rules against arbitrary sites. The extension must inspect the current page URL and inject the blocking overlay on whatever domains the active rule targets.

## Release Checklist

- Build with production runtime env values so `EXTENSION_API_BASE_URL` and `EXTENSION_ALLOWED_ORIGINS` target the deployed web and API host.
- Confirm `apps/extension/src/assets/extension-icon-16.png`, `extension-icon-48.png`, and `extension-icon-128.png` are included in the uploaded zip.
- Confirm the popup and in-page overlay render with the generated token CSS from `packages/design-tokens`.
- Verify auth handoff works only from allowed origins.
- Verify the Chrome Web Store listing links to the hosted privacy policy and describes the domain-blocking rule-enforcement purpose clearly.
