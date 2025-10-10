import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './providers/theme/theme-provider.tsx';
import { ConfigProvider } from './providers/config/configProvider.tsx';
import { setApiBase } from './lib/http.ts';

const fetchConfig = async () => {
  try {
    const response = await fetch(`/api/config`);
    const config = await response.json();
    return config;
  } catch (error) {
    console.error("Failed to fetch config:", error);
    return {};
  }
};

fetchConfig().then((config) => {
  setApiBase(config.REACT_APP_SERVER_URL);

  const BASENAME = config.VITE_APP_BASENAME ?? "/new-portal";

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider config={config}>
        <ThemeProvider>
          <BrowserRouter basename={BASENAME}>
            <App />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </ThemeProvider>
      </ConfigProvider>
    </StrictMode>,
  );
});
