import React from 'react';
import ReactDOM from 'react-dom/client';

import '@saintrocky/ui/base.scss';
import '@saintrocky/ui/primitives.scss';
import '@saintrocky/ui/layout.scss';
import '@saintrocky/ui/compounds.scss';
import '@saintrocky/ui/widgets.scss';

import { App } from './App.jsx';
import { getDesktopThemeState, onDesktopThemeChange } from './bridge.js';
import { registerDesktopBrandFont } from './registerDesktopBrandFont.js';

document.documentElement.setAttribute('data-ui-shell', 'desktop');
registerDesktopBrandFont();
document.body.classList.add('sr-DesktopBody');

getDesktopThemeState()
  .then((payload) => {
    if (payload?.theme) {
      document.documentElement.setAttribute('data-theme', payload.theme);
    }
  })
  .catch(() => {});

onDesktopThemeChange((payload) => {
  if (payload?.theme) {
    document.documentElement.setAttribute('data-theme', payload.theme);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
