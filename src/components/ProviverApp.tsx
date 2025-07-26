'use client';

import { queryClient } from '@/lib/react-query';
import axios from 'axios';
import { QueryClientProvider } from '@tanstack/react-query';

axios.defaults.baseURL = process.env.NEXT_PUBLIC_API
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
