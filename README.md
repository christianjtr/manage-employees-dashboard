# TeamMap

TeamMap is a lightweight, local-first way to understand who belongs to an organization, what they do and how people connect. The interactive organization chart is the primary experience, with a people directory for managing individual records.

The repository is evolving in reviewable milestones. The current implementation includes the organization chart, people directory, browser persistence, fictional sample data, versioned JSON backup/restore and CSV import.

## Requirements

- Node.js 22.12 or newer (Node 24 is the recommended baseline; see `.nvmrc`).
- npm.

## Getting started

```sh
npm ci
npm run dev
```

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

## Technology

- Vue 3 and TypeScript
- Vite
- Vuetify 3 (light theme)
- Vue Router 4
- Zod 4 for runtime validation and inferred domain types
- Vitest

## Project notes

- The app runs locally in the browser without a backend; changes are saved in `localStorage`.
- The organization chart is generated from `managerId`; invalid references, duplicate IDs/emails and reporting cycles are rejected.
- Deleting a manager asks for confirmation and promotes direct reports to that manager's own manager (or to the top level).
- A fictional organization can be loaded for exploration; replacing existing records requires confirmation.
- The light-only interface uses slate for primary actions and blue for chart/profile accents, with a responsive sidebar and contextual detail/editor panels.
- Import and export versioned JSON backups from the People view. Restore validates the whole file and confirms before replacing local data.
- Import CSV files from People → Data, or download the CSV template there. Required columns are `firstName`, `lastName`, `email`, `position` and `department`; optional columns are `managerEmail`, `status`, `joinedAt` and `avatar`.
- CSV manager links use email addresses within the same file. `status` accepts `active` or `inactive` and defaults to `active`; `joinedAt` uses `YYYY-MM-DD`; `avatar` must be a URL. IDs and timestamps are generated during import. The whole file and reporting hierarchy are validated before preview and explicit replacement confirmation.
- `changelog.md` records implementation milestones and verification results.
- `memory.md` records durable product and architecture decisions.

The public demo is <https://christianjtr.github.io/manage-employees-dashboard>. GitHub Pages publishes from GitHub Actions, so pushes to `main` deploy automatically after validation.
