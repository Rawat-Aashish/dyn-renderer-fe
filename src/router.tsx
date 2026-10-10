import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { AdminLayout } from './layouts/AdminLayout'
import { FormListPage } from './pages/admin/FormListPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '/admin/login', element: <LoginPage /> },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="forms" replace /> },
      { path: 'forms', element: <FormListPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
