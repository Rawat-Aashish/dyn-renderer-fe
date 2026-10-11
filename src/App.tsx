import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import { ApiError } from './api/client'
import { router } from './router'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    // A mutation says what to tell the admin once it worked with `meta: { toast: 'Field added' }`.
    onSuccess: (_data, _variables, _context, mutation) => {
      const message = mutation.meta?.toast
      if (typeof message === 'string') toast.success(message)
    },
    onError: (error) => {
      // 409 means the form's state is not what this screen thought (published or archived elsewhere):
      // the message is shown by whoever made the call, and the form is read again so the screen catches up.
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ['form'] })
      }
      // Validation and conflict messages belong next to the thing that failed; a dead connection or a server
      // fault is not tied to any input, so it is announced here.
      if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) {
        toast.error(error.message)
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
      <Toaster position="bottom-right" richColors closeButton />
    </QueryClientProvider>
  )
}

export default App
