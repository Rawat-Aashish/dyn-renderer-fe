import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ApiError } from './api/client'
import { router } from './router'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      // 409 means the form's state is not what this screen thought (published or archived elsewhere):
      // the message is shown by whoever made the call, and the form is read again so the screen catches up.
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['form'] })
      }
    },
  }),
  defaultOptions: {
    queries: {
      // A 4xx will not change on a retry; failed loads show an error state with a Retry button instead.
      retry: false,
      // Refetching when the tab regains focus would replace data under an admin who is mid-edit.
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App
