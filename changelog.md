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
