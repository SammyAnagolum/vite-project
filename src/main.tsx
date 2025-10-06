import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './providers/theme/theme-provider.tsx';

const BASENAME = import.meta.env.VITE_APP_BASENAME ?? "/";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter basename={BASENAME}>
        <App />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
