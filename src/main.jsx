import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { ensureAdmin } from './lib/auth.js';
import './styles/index.css';

ensureAdmin()
  .catch((err) => console.error('Não foi possível preparar o acesso do admin:', err))
  .finally(() => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  });
