# @saintrocky/notifications

Shared notification abstraction with platform adapters.

## Usage
```js
import { createNotifications } from '@saintrocky/notifications';
import { createWebNotifications } from '@saintrocky/notifications/web';

const notifications = createNotifications(createWebNotifications());
notifications.notify({ title: 'Saved', message: 'Profile updated' });
```

