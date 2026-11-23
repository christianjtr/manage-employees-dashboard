# TeamMap

TeamMap is evolving into a lightweight, local-first way to understand who is in an organization and how people connect. The organization chart will be the primary experience, with a people directory for managing individual records.

The repository is being modernized in reviewable milestones. The current branch establishes automated GitHub Pages validation and deployment; product functionality is being built in subsequent milestones.

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

- The app is designed to run locally in the browser without a backend.
- The initial visual shell keeps the existing blue accent and uses a light theme.
- CSV import is planned for a later phase.
- `changelog.md` records implementation milestones and verification results.
- `memory.md` records durable product and architecture decisions.

The public demo is <https://christianjtr.github.io/manage-employees-dashboard>. After this branch is integrated, configure the repository's Pages publishing source to **GitHub Actions** to enable automatic deployment from `main`.
