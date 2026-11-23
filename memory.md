# Project Memory

Durable product and architecture decisions for future development. The changelog records delivered work; this file records why the project is shaped this way and the constraints future changes should respect.

## Accepted decisions

### 2026-11-23 — Modern frontend baseline

- **Decision:** Use Vue 3, TypeScript, Vite, Vue Router 4, Vuetify 3 and Zod 4. Use composables rather than introducing a global state library until the product needs one.
- **Reason:** The Vue 2 / Vue CLI / Vuex stack is obsolete for the intended TeamMap product, while the app remains a small client-side tool.
- **Implication:** Keep schemas as the source of inferred TypeScript types. Validate untrusted local/imported data at runtime; keep cross-record hierarchy invariants in domain logic rather than in the per-person schema.

### 2026-11-23 — Local-first and GitHub Pages constraints

- **Decision:** The app has no backend in the initial product phase. Build for `/manage-employees-dashboard/` and use hash routing for static GitHub Pages hosting.
- **Reason:** The first intended deployment is the existing public demo URL and a single local browser user.
- **Implication:** Persistence, versioned JSON backup/restore and import validation belong in the client. Do not rely on server-side SPA rewrites.

### 2026-11-23 — Visual baseline

- **Decision:** Start with a light-only theme, keep the current blue as the primary accent, and use neutral surfaces. Organization is the primary route; People is secondary.
- **Reason:** The organization chart is the product's core experience, while existing blue styling is the current recognizable accent.
- **Implication:** Use the sidebar for main navigation and contextual panels for person-level actions. Do not introduce a dark-theme toggle in the initial scope.

### 2026-11-23 — Validation and runtime compatibility

- **Decision:** Pin TypeScript to the 5.9 line and use Vitest 4 for the initial test setup.
- **Reason:** `typescript-eslint` currently supports TypeScript below 6.1; Vitest 5's declared Node engine range excludes the development environment's Node 25, while Vitest 4 supports Node 24 and later.
- **Implication:** Keep the repository's supported Node baseline at 22.12 or newer and revisit tool major versions when the deployment runtime is established.

- **Deferred dependency:** Vue Test Utils 2.6.0 currently pulls in `js-beautify` and vulnerable `glob` / `minimatch` transitive dependencies. `npm audit fix` only proposed resolving them with a forced downgrade, so it is deferred until component tests are added and a safe dependency path is available.
- **Runtime note:** The development environment is Node 25. The newest jsdom line declares an engine range that skips Node 25, so this scaffold uses jsdom 27, which supports Node 24+ and avoids engine warnings on the current runtime.
- **Lockfile note:** The original `package-lock.json` was npm lockfile v1 and identified its root as `test@0.0.1`, unrelated to the project manifest. It was regenerated rather than retaining stale resolutions.

## Deferred scope

- CSV import is phase two and is not part of the initial organization-chart milestone.
- Organizational cycles, manager reference integrity and duplicate-email rules require validation across the full employee collection; a single employee Zod schema cannot enforce them alone.
