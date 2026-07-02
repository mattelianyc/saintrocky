# @saintrocky/ui

Primitives built on [Base UI](https://base-ui.com/) (unstyled, accessible React components).

## Usage

```js
import { Button, Input, Card, Checkbox } from '@saintrocky/ui';
```

### Recommended shared styles

```js
import '@saintrocky/ui/base.scss';
import '@saintrocky/ui/primitives.scss';
import '@saintrocky/ui/layout.scss';
import '@saintrocky/ui/compounds.scss';
```

`styles.css` remains available as a lightweight compatibility entry, but the shared applications use the layered SCSS entrypoints above so tokens, primitives, layout, and compounds all resolve from the same package-owned styling pipeline.

## Styling hooks

- `Button` uses:
  - `ui-Button`, `ui-Button--{variant}`, `ui-Button--{size}`
- `Input` uses:
  - `ui-Input`, `ui-Input--{size}`, `ui-Input--invalid`
- Base UI compound components (e.g. `Dialog`, `Select`, `Toast`) use a consistent slot pattern:
  - `ui-${Component}${Slot}` (example: `ui-AlertDialogTrigger`, `ui-ToastViewport`)


