import { StrictMode } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';
import { ProgressProvider } from './state/ProgressProvider';
import theme from './theme';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// Under GitHub Pages the app lives in a subfolder /<repo>/. Vite puts this
// prefix into BASE_URL — we hand it to the router as basename (without a trailing slash).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProgressProvider>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </ProgressProvider>
    </ThemeProvider>
  </StrictMode>,
);
