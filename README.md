# Dynamic Form Builder: Frontend

The web app for a form builder. An admin builds a form (fields, validation rules, conditions), publishes it and shares its link; anyone with the link fills it in without logging in, and the admin reads the submissions.

The backend stores a form as JSON configuration and sends no layout. This app turns that configuration into a working builder, a stepped form for visitors, and the admin screens around them.

## What it does

**Admin (`/admin`, login required)**

- Create, edit, clone, archive and delete forms; list them with search and filters.
- Builder: add fields, headings and sections, reorder by drag and drop, edit settings, validation rules and show/hide, enable/disable, required/optional conditions.
- Field types: text, text area, number, decimal, email, phone, dropdown, radio, checkbox, multi-select, toggle, date, date and time, **file upload** (allowed formats and size), plus sections and headings.
- Versioning: publish a version, create the next one, read old versions (read-only builder and preview).
- Optional **rating** switch per form (in the form header; changeable while the form is a draft).
- Preview of the working copy or any version, fully interactive, nothing is sent.
- Submissions list and detail (answers, ratings, file downloads) and the audit log.

**Visitor (`/f/<form-code>`, no login)**

- One section per step, with progress, back/forward arrows and per-step validation that mirrors the server.
- Answers and position survive a refresh in the same tab.
- File fields upload as soon as a file is chosen; after submitting, an optional 0.5 to 5 star rating (half steps) can be given or skipped.

## Tech stack

| Area | Library |
|---|---|
| UI | React 19, TypeScript (strict), Vite 8 |
| Styling | Tailwind CSS 4 (no inline styles) |
| Routing | react-router-dom 7 |
| Server state | TanStack Query 5 |
| Client state | Zustand (auth session, builder selection) |
| Drag and drop | @hello-pangea/dnd |
| Dropdown / popover | @headlessui/react |
| Icons, toasts | lucide-react, sonner |
| Browser checks | @playwright/test (dev dependency, no test files are kept) |

## Requirements

- **Node.js 20.19 or newer** (22.12+ also fine), and npm.
- The **backend API** running and reachable (default `http://localhost:8080`). This repo is only the frontend; the API contract is in [`handover/`](handover/README.md).

## Getting started

```bash
# 1. install dependencies
npm install

# 2. create your local environment file
cp .env.example .env.local        # on Windows PowerShell: Copy-Item .env.example .env.local

# 3. start the dev server
npm run dev
```

Open <http://localhost:5173>. The root redirects to `/admin`, which asks for a login.

Start the backend first, otherwise every screen shows a connection error.

### Environment variables

Vite only exposes variables that start with `VITE_`. They are read at build time.

| Variable | Required | Example | Meaning |
|---|---|---|---|
| `VITE_API_URL` | yes | `http://localhost:8080` | Base URL of the backend API, without a trailing slash. All requests go to `${VITE_API_URL}/api/...`. |

`.env.local` is git-ignored (`*.local`). `.env.example` is the committed template. To point the app at another environment, change `VITE_API_URL` and restart `npm run dev` (or rebuild).

### Backend requirements

- **CORS:** the backend must allow the frontend's origin (`http://localhost:5173` in development), including the `Authorization` header and `multipart/form-data` for file uploads.
- **Admin account:** the admin screens need a user with the `ADMIN` role. A development backend may ship a seeded account (the one used while building this app was `admin@gmail.com` / `password`). Treat that as a local-only credential and never use it outside development.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload on port 5173 |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | ESLint |

There is no unit-test runner configured; behaviour was verified in a real browser with Playwright against a live backend.

## Project structure

```
src/
  api/          fetch wrapper (envelope handling, auth header, ApiError)
  services/     one file per API area; the only place requests are made
  hooks/        data and flow hooks (form filler, step flow, form detail)
  stores/       Zustand stores (auth session, builder state)
  lib/          pure logic: form-logic (conditions, validation, steps), formatting, file rules
  components/
    ui/               shared primitives (Button, Dialog, Field, selects, ...)
    form-builder/     canvas, outline, settings, validation and logic tabs
    form-renderer/    stepped form, field controls, file upload, rating panel
    forms/            create / edit / clone dialogs, rating switch
    auth/             login form and re-login dialog
  layouts/      admin shell and per-form header with tabs
  pages/        admin, public and auth pages
  router.tsx    route table
```

Rules the code follows (also in [`CLAUDE.md`](CLAUDE.md)):

- Components never call `fetch` directly; they go through `services/`.
- Every API call handles loading, success and error states.
- Every response is the envelope `{ success, message, data, errors? }`.

## Routes

| Path | Who | Screen |
|---|---|---|
| `/admin/login` | anyone | Admin login |
| `/admin/forms` | admin | Forms list |
| `/admin/forms/:id` | admin | Builder (tabs: Versions, Submissions, Audit log) |
| `/admin/forms/:id/preview` | admin | Preview of the working copy |
| `/admin/forms/:id/versions/:version/preview` | admin | Preview of a version |
| `/f/:code` | public | The live form |

## How a session works

- **Admin:** the login token is kept for the tab. When it expires, a login dialog opens over the page, and the interrupted read is repeated after signing in again.
- **Visitor:** the form is started once per tab; the token, answers, current step and rating state are kept in `sessionStorage` under `public_form:<code>`, so a refresh neither loses answers nor starts a second submission.

## Documentation

- [`handover/README.md`](handover/README.md): the product and the exact API contract (source of truth for behaviour and shapes).
- [`SPEC.md`](SPEC.md): decisions taken for the frontend.
- [`docs/`](docs/): one page per module explaining how it works and why (`foundation`, `forms`, `builder`, `validation-logic`, `renderer`, `form-steps`, `publishing`, `public-form`, `submissions-audit`, `app-shell`, `file-upload-rating`) and [`docs/checklist.md`](docs/checklist.md), the build checklist.

## Deploying

`npm run build` produces a static site in `dist/`. Serve it from any static host, with two requirements:

- `VITE_API_URL` must be set to the production API **when building**.
- All paths must fall back to `index.html` (single-page app routing), otherwise a refresh on `/f/<code>` or `/admin/forms/1` returns 404.

## Known limits

- Regular-expression rules are checked in the browser with JavaScript's engine; patterns that only Java understands are skipped in the browser and left to the server, which always has the final word.
- A file removed from a field stays on the server until the submission is made; a rating cannot be changed once sent.
- The bundle is a single chunk (Vite warns above 500 kB); code-splitting has not been done.
