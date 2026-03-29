# @saintrocky/analytics

Shared event schema + helpers with optional adapters.

## Usage
```js
import { createAnalytics } from '@saintrocky/analytics';

const analytics = createAnalytics({ context: { platform: 'web' } });
analytics.track('auth.login', { method: 'password' });
```

