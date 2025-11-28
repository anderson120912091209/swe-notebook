'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance per component mount (Next.js best practice)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data remains fresh for 2 minutes before being considered stale
            staleTime: 2 * 60 * 1000,
            // Cache data for 5 minutes before garbage collection
            gcTime: 5 * 60 * 1000,
            // Retry failed requests 1 time only
            retry: 1,
            // Don't refetch on window focus by default (reduces unnecessary requests)
            refetchOnWindowFocus: false,
            // Refetch on mount only if data is stale
            refetchOnMount: true,
            // Don't refetch on reconnect unless stale
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry failed mutations 1 time
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

