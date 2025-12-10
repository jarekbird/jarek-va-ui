import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { detectBasename } from './utils/basename';

const basename = detectBasename();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
