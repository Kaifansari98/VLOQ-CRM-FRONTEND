"use client"

import { Provider } from "react-redux"
import { store } from "@/redux/store"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  )
}