# @saintrocky/storage

Unified key/value storage API with web/native adapters.

## Usage
```js
import { createStorage } from '@saintrocky/storage';
import { createWebStorage } from '@saintrocky/storage/web';

const storage = createStorage(createWebStorage());
await storage.set('token', 'abc');
```

