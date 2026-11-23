# Project Memory

Durable product and architecture decisions for future development. The changelog records delivered work; this file records why the project is shaped this way and the constraints future changes should respect.

## Accepted decisions

### 2026-11-23 — Modern frontend baseline

- **Decision:** Use Vue 3, TypeScript, Vite, Vue Router 4, Vuetify 4 and Zod 4. Use composables rather than introducing a global state library until the product needs one.
- **Reason:** The Vue 2 / Vue CLI / Vuex stack is obsolete for the intended TeamMap product, while the app remains a small client-side tool.
- **Implication:** Keep schemas as the source of inferred TypeScript types. Validate untrusted local/imported data at runtime; keep cross-record hierarchy invariants in domain logic rather than in the per-person schema.

### 2026-11-23 — Local-first and GitHub Pages constraints

- **Decision:** The app has no backend in the initial product phase. Build for `/manage-employees-dashboard/` and use hash routing for static GitHub Pages hosting.
- **Reason:** The first intended deployment is the existing public demo URL and a single local browser user.
- **Implication:** Persistence, versioned JSON backup/restore and import validation belong in the client. Do not rely on server-side SPA rewrites.

### 2026-11-23 — GitHub Pages delivery

- **Decision:** Validate every pull request to `main`, but only deploy from `main` (or a manual run targeting `main`) through the `github-pages` environment.
- **Reason:** Keep preview branches from replacing the public demo and ensure only validated production builds are published.
- **Implication:** The repository Pages publishing source must be set to **GitHub Actions**. Vite's base path stays `/manage-employees-dashboard/`; static Pages assets and hash-based routes depend on it.

### 2026-11-23 — Visual baseline

- **Decision:** Use a light-only theme with slate (`#334155`) for primary actions and retain blue for selected chart nodes and supporting accents. Organization is the primary route; People is secondary.
- **Reason:** Slate gives primary buttons a restrained neutral treatment while blue continues to distinguish chart selection and employee accents.
- **Implication:** The desktop sidebar starts collapsed as an icon rail and can be toggled open; mobile navigation remains temporary. Use the primary theme color for the brand mark, Vuetify dialogs for confirmations, and contextual panels for person-level actions. The chart offers fit-to-view and fullscreen controls. Do not introduce a dark-theme toggle in the initial scope.

### 2026-11-23 — Validation and runtime compatibility

- **Decision:** Pin TypeScript to the 5.9 line and use Vitest 4 for the initial test setup.
- **Reason:** `typescript-eslint` currently supports TypeScript below 6.1; Vitest 5's declared Node engine range excludes the development environment's Node 25, while Vitest 4 supports Node 24 and later.
- **Implication:** Keep the repository's supported Node baseline at 22.12 or newer and revisit tool major versions when the deployment runtime is established.

- **Deferred dependency:** Vue Test Utils 2.6.0 currently pulls in `js-beautify` and vulnerable `glob` / `minimatch` transitive dependencies. `npm audit fix` only proposed resolving them with a forced downgrade, so it is deferred until component tests are added and a safe dependency path is available.
- **Test setup note:** Domain and persistence tests run in Vitest's Node environment. The storage service accepts an injected key-value adapter, so its tests do not rely on jsdom or browser globals.
- **Lockfile note:** The original `package-lock.json` was npm lockfile v1 and identified its root as `test@0.0.1`, unrelated to the project manifest. It was regenerated rather than retaining stale resolutions.

### 2026-11-23 — Organization chart and local data

- **Decision:** Build the org chart as a recursive Vue component with CSS connectors; derive its forest from `managerId` and keep data/state in a composable plus a versioned LocalStorage service.
- **Reason:** The product models a simple one-manager hierarchy, so a focused tree UI is easier to understand than a general diagram editor or global store.
- **Implication:** Validate each employee with Zod, then validate duplicate IDs/emails, manager references and cycles against the full collection before save. Search highlights matches and their manager paths; all nodes remain in the hierarchy.
- **Deletion rule:** Deleting a manager is confirmed and moves direct reports up one level to that manager's own manager, preserving valid references and the remaining tree.
- **Recovery rule:** Invalid stored JSON/version/relationships are reported and never silently overwritten. The user must explicitly clear the invalid data or confirm a valid JSON-backup restore before replacing it.

### 2026-11-23 — JSON backup portability

- **Decision:** Export and restore a strict JSON envelope with `format: "teammap-backup"`, `schemaVersion: 1`, `exportedAt` and the complete employee collection.
- **Reason:** Local-first browser storage needs user-controlled backup and restoration without a backend.
- **Implication:** Validate the file schema and the complete manager graph before preview; restore replaces all records only after explicit confirmation and one successful storage write. Unsupported versions and any invalid row reject the whole file, with no partial import.

### 2026-11-23 — CSV import format

- **Decision:** Accept CSV with required `firstName`, `lastName`, `email`, `position` and `department` columns; `managerEmail`, `status`, `joinedAt` and `avatar` are optional. Resolve manager links by email within the same file and generate IDs/timestamps during import.
- **Reason:** CSV should be portable for people data without exposing browser-generated record IDs or timestamps.
- **Implication:** Normalize and validate every row, resolve the full manager graph, then preview and replace the organization all-or-nothing after confirmation. Provide a downloadable header template from the People data menu.

### 2026-11-23 — Compact headers and single brand mark

- **Decision:** Keep view headers compact with inline counts instead of separate summary strips, use 16px spacing between editor fields, and use one slate hierarchy mark for the sidebar, mobile app bar and favicon.
- **Reason:** The previous headers and unused Vue logo wasted space and gave the app two unrelated icons.
- **Implication:** Show only title-level context in headers; keep a "shown" count when filters are active. In the collapsed rail, hide labels, center the icons horizontally and preserve accessible names. Do not reintroduce a second logo asset.

### 2026-11-23 — Vuetify 4 compatibility baseline

- **Decision:** Run Vuetify 4 with explicit light theme, v3 display thresholds, uppercase button defaults and a column-oriented `v-main` layout.
- **Reason:** Vuetify 4 changes the default theme to system, reduces breakpoints, removes uppercase buttons, converts alerts to grid layout, and changes typography/reset/CSS layering. The existing UI depends on the v3 visual baseline.
- **Implication:** Keep `theme.defaultTheme: 'light'`, `display.thresholds` (md 960, lg 1280, xl 1920, xxl 2560) and `defaults.VBtn.class: 'text-uppercase'` in `src/plugins/vuetify.ts`. Keep `.app-main` as a flex column so the storage-recovery alert stacks above views instead of shrinking into a narrow grid item. Vuetify 4 clearable text fields emit `null`, so keep search normalization null-safe (`value ?? ''`) and model types `string | null`. Re-check dialogs, snackbars, tables and mobile overflow after future Vuetify upgrades.

### 2026-11-23 — MIT licensing

- **Decision:** Distribute TeamMap under the MIT License.
- **Reason:** It is a permissive, widely understood license that fits a small local-first demo and allows reuse with minimal friction.
- **Implication:** Keep `LICENSE`, the `license` field in `package.json` and the README license link in sync. Contributors keep attribution and the warranty disclaimer intact.

### 2026-11-23 — README language

- **Decision:** Keep `README.md` in English.
- **Reason:** The public repository README was originally in English; the user corrected a Spanish rewrite.
- **Implication:** Write and maintain user-facing repository documentation in English unless the user explicitly asks for another language. Spanish remains fine for conversation.

### 2026-11-23 — Organization Insights

- **Decision:** Add a read-only Insights page derived from the existing employee collection instead of introducing external data integrations.
- **Reason:** The user asked for a realistic, useful improvement for a small local-first tool. Structure metrics are available locally and do not need a backend, schema migration or new data source.
- **Implication:** Keep insight calculations as pure domain functions over `Employee[]` and preserve the existing validation and storage format. Include active and inactive people in structure counts, show status separately and avoid health scores or inferred reporting relationships. Fullscreen remains a browsing mode: show a notice and keep person-panel access after exiting. Use the current `brand.svg` in empty states and do not reintroduce legacy logo assets.

## Deferred scope

- Organizational cycles, manager reference integrity and duplicate-email rules are enforced by full-collection validation; a single employee Zod schema cannot enforce them alone.
