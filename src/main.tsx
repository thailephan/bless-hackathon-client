import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from '@/components/ui/tooltip';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <StrictMode>
      <TooltipProvider delayDuration={100}>
        <App />
        <Toaster />
      </TooltipProvider>
    </StrictMode>
  </Provider>
)
