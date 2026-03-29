import React from 'react';
import ReactDOM from 'react-dom/client';

import '@saintrocky/ui/base.scss';
import '@saintrocky/ui/primitives.scss';
import '@saintrocky/ui/layout.scss';
import '@saintrocky/ui/compounds.scss';

import { App } from './App.jsx';

document.documentElement.setAttribute('data-ui-shell', 'desktop');
document.body.classList.add('sr-DesktopBody');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
