# Changelog

Project evolution notes, including the scope of each milestone and its verification.

## 2026-11-23 — Toolchain foundation

- Replaced the Vue 2 / Vue CLI / Vuex / Vuetify 2 foundation with Vue 3, TypeScript, Vite, Vue Router 4 and Vuetify 3.
- Added Zod 4 as the runtime schema and inferred-type foundation for domain data.
- Added a light-only TeamMap shell with the existing blue accent and a responsive navigation drawer.
- Configured Vite's GitHub Pages project base and hash-based routing in preparation for the deployment workflow.
- Removed the Random User demo service and Vue 2 CRUD implementation; product behavior will be rebuilt around the organization chart.
- Added Vitest, `vue-tsc` and ESLint tooling. Vue Test Utils is deferred until component tests are introduced because its current release pulls in vulnerable transitive packages.
- Added the initial Zod employee schema and tests for email normalization, status validation and date validation.
- Regenerated the obsolete npm v1 lockfile as a current lockfile.
- **Verification:** `npm run lint`, `npm run typecheck`, `npm test` (3 passing) and `npm run build` pass. `npm audit` reports 0 vulnerabilities. Browser smoke check passed at the GitHub Pages project base; mobile navigation starts collapsed and there were no console errors.

## 2026-11-23 — GitHub Pages workflow

- Added `.github/workflows/deploy-pages.yml` to run install, lint, typecheck, tests and production build on pull requests targeting `main`.
- Configured pushes to `main` and manual runs on `main` to deploy the Pages artifact to the `github-pages` environment. Pull requests validate but do not deploy.
- The workflow reads Node from `.nvmrc`, caches npm dependencies, uses minimal token permissions and uploads only `dist`.
- **Deployment prerequisite:** Set the repository Pages publishing source to **GitHub Actions** after this branch is integrated.
- **Local verification:** Workflow YAML syntax is valid, `npm ci`, lint, typecheck, tests (3 passing), production build and `npm audit` (0 vulnerabilities) pass. The built HTML points to assets under `/manage-employees-dashboard/`.
- A hosted deployment cannot be verified until the branch is integrated and Pages is configured.

## 2026-11-23 — Organization chart and local directory

- Replaced both placeholder views with a chart-first organization view and a searchable, sortable, filterable people directory.
- Added a recursive left-to-right chart with connected people cards, active/inactive state, branch controls, search highlighting, zoom controls and contextual profile/editor drawers.
- Added fictional sample data, manual create/edit/delete, manager selection, status/date fields and local persistence using a versioned LocalStorage envelope.
- Added Zod input/persisted-data validation and collection-level rules for unique IDs/emails, existing manager references and acyclic reporting relationships.
- Deleting a manager asks for confirmation and promotes their direct reports one level; invalid stored data remains untouched until the user explicitly clears it or restores a valid JSON backup.
- Added domain and storage tests for forests, cycles, missing managers, duplicate emails, manager candidate filtering, persistence round-trips and invalid versions/data.
- CSV import remains follow-up work; versioned JSON backup/restore is implemented in the next milestone below.
- **Verification:** `npm run lint`, `npm run typecheck`, `npm test` (16 passing), `npm run build`, `npm audit` (0 vulnerabilities) and `git diff --check` pass. Browser smoke checks covered sample loading, create/edit and manager assignment, persistence after reload, search/path expansion, directory search/filtering, invalid-storage recovery, and mobile layout; no console errors were reported.

## 2026-11-23 — Versioned JSON backup and restore

- Added a strict `teammap-backup` JSON format with schema version, export timestamp and complete employee records.
- Added JSON export and restore actions to the People view. Restore previews people/active/department counts and requires confirmation before replacing local data.
- Zod validates the envelope and employees; full-collection validation rejects unsupported versions, duplicate data, missing managers and reporting cycles as an all-or-nothing import.
- A valid explicit restore can recover from invalid local data; malformed/invalid files leave the existing data untouched.
- **Verification:** `npm ci`, lint, typecheck, `npm test` (20 passing), production build, `npm audit` (0 vulnerabilities) and `git diff --check` pass. Browser checks covered export, valid restore/replacement, rejection of a backup with a missing manager without changing existing records, and restore from a corrupt local-storage state.

## 2026-11-23 — Navigation and chart layout refinements

- Replaced browser-native confirmation prompts with a reusable Vuetify confirmation dialog for deleting people, loading sample data, restoring backups and clearing invalid local data.
- Changed primary action buttons to slate (`#334155`) while retaining blue chart and profile accents.
- Made the desktop navigation drawer start collapsed as an icon rail, with a state-aware expand/collapse icon and accessible labels; mobile navigation remains temporary.
- Reduced the height of all people-editor inputs with compact density and automatic detail display; prevented flex layout from stretching fields vertically.
- Made the organization chart fill the remaining viewport height and scroll within the chart area.
- **Verification:** `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` (22 passing), `npm run build`, `npm audit` (0 vulnerabilities) and `git diff --check` pass. Browser checks confirmed Vuetify confirmations, desktop rail toggling and icon changes, compact 40–42 px editor fields, chart viewport sizing/internal scrolling, and preserved directory scrolling.
