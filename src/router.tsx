import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { AdminLayout } from './layouts/AdminLayout'
import { FormLayout } from './layouts/FormLayout'
import { AuditPage } from './pages/admin/AuditPage'
import { BuilderPage } from './pages/admin/BuilderPage'
import { FormListPage } from './pages/admin/FormListPage'
import { PreviewPage } from './pages/admin/PreviewPage'
import { SubmissionDetailPage } from './pages/admin/SubmissionDetailPage'
import { SubmissionsPage } from './pages/admin/SubmissionsPage'
import { VersionPreviewPage } from './pages/admin/VersionPreviewPage'
import { VersionsPage } from './pages/admin/VersionsPage'
import { VersionViewPage } from './pages/admin/VersionViewPage'
import { LoginPage } from './pages/LoginPage'
import { PublicFormPage } from './pages/public/PublicFormPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '/admin/login', element: <LoginPage /> },
  { path: '/f/:code', element: <PublicFormPage /> },
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
      { path: 'forms/:id/preview', element: <PreviewPage /> },
      { path: 'forms/:id/versions/:version/preview', element: <VersionPreviewPage /> },
      { path: 'forms/:id', element: <FormLayout />, children: [
          { index: true, element: <BuilderPage /> },
          { path: 'versions', element: <VersionsPage /> },
          { path: 'versions/:version', element: <VersionViewPage /> },
          { path: 'submissions', element: <SubmissionsPage /> },
          { path: 'submissions/:submissionId', element: <SubmissionDetailPage /> },
          { path: 'audit', element: <AuditPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
