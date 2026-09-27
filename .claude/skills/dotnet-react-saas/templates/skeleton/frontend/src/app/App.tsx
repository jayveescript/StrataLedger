import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { ApiError } from '@/api/http'
import { AuthProvider } from '@/auth/AuthContext'
import { BrandProvider } from '@/brand/BrandContext'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Never hammer the API on client errors (401/403/404/402/429); retry transient failures once.
      retry: (failures, error) => !(error instanceof ApiError && error.status < 500) && failures < 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandProvider>
          <RouterProvider router={router} />
        </BrandProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
