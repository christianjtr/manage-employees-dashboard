# TeamMap

TeamMap is a lightweight, local-first way to understand who belongs to an organization, what they do and how people connect. The interactive organization chart is the primary experience, with a people directory for managing individual records.

The repository is evolving in reviewable milestones. The current implementation includes the organization chart, people directory, browser persistence and fictional sample data. CSV import and JSON backup/restore are subsequent milestones.

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
- The light-only interface keeps the existing blue accent and uses a responsive sidebar and contextual detail/editor panels.
- CSV import is planned for phase two. Versioned JSON backup/restore remains a follow-up.
- `changelog.md` records implementation milestones and verification results.
- `memory.md` records durable product and architecture decisions.

The public demo is <https://christianjtr.github.io/manage-employees-dashboard>. After this branch is integrated, configure the repository's Pages publishing source to **GitHub Actions** to enable automatic deployment from `main`.
