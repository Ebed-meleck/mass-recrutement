'use client';

import { queryClient } from '@/lib/react-query';
import { QueryClientProvider } from '@tanstack/react-query';

interface ProviderProps {
  children: React.ReactNode;
}

const ProviderApp: React.FC<ProviderProps> = ({ children }) => {

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default ProviderApp;
