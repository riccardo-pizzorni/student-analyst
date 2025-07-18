import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const now = new Date().toISOString();
    console.log(`[App][DEBUG][${now}] MOUNT`);
    return () => {
      const now = new Date().toISOString();
      console.log(`[App][DEBUG][${now}] UNMOUNT`);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AnalysisProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AnalysisProvider>
    </QueryClientProvider>
  );
};

export default App;
