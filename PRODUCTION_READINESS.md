# Production Readiness — Remaining Work

This document tracks the engineering work still outstanding before a stable
`1.0.0` release. The items completed so far (Biome lint/format, v8 coverage with
thresholds, the Node 20/22 × React 18/19 CI matrix, and `publint` / `attw`
package checks) are already in place; what follows is what is left.

## 1. Known packaging debt (surfaced by `attw`)

`npm run attw` runs as an **informational** CI step (it does not fail the build
yet). It currently reports two real issues:

- **`Internal resolution error` under `node16`/`nodenext` (from ESM).**
  Every entrypoint's `.d.ts` uses extensionless relative imports
  (`from './components/X'`) because the library is built with
  `moduleResolution: Bundler`. Bundler-mode consumers (Vite, Next.js, webpack —
  the large majority) resolve correctly, but TypeScript users on
  `moduleResolution: node16`/`nodenext` get broken types.
  **Fix path:** emit `.js` extensions in declarations — either switch the lib
  build to `module: nodenext` and add explicit `.js` extensions to all source
  relative imports, or post-process the emitted `.d.ts`. This is invasive and
  deserves its own change.

- **`FalseExportDefault` on the `/data` and `/locales/*` JSON entries.**
  Those entrypoints resolve to raw `.json`, which `node16` treats as
  `export =`, while the `.d.ts` describes `export default`. Bundler users are
  unaffected; nodenext users may need an extra `.default` access.

The package is intentionally **ESM-only / bundler-first** (`"type": "module"`,
only `import`/`node` export conditions, no CJS build). Do **not** add a CJS
build to "fix" the above — the correct resolution is the extension work above.
Once resolved, flip `attw` from informational to a gating CI step.

## 2. Bundle-size budget (`size-limit`)

There is a bundlephobia badge in the README but no CI guard. For an emoji
picker, bundle size is a headline selling point. Add
[`size-limit`](https://github.com/ai/size-limit) with explicit budgets for the
main entry and the `headless` entry, failing CI on regressions.

## 3. Dependency automation

No `dependabot.yml` / Renovate config. Add Dependabot (one file,
`.github/dependabot.yml`) for the npm ecosystem to keep the large dev-dependency
tree (Vite 8, Vitest 3, Playwright, TypeScript 6, Biome) current.

## 4. Stability commitment for `1.0.0`

The README states the generated data contract and package shape may still
change. Before tagging stable `1.0.0`, document explicitly:

- what is covered by semver (public API surface),
- what counts as a breaking change in the emoji **data contract**,
- the support policy for React (18 / 19) and Node (`>=20.19`) versions.

This is the actual blocker for "stable" — a commitment, not code.

## 5. Coverage ratchet

Current thresholds (statements/lines 70, branches 65, functions 72) sit a few
points below the measured numbers (~74 / ~71 / ~77). As coverage improves, raise
the thresholds to lock in the gains.

## 6. Nice-to-haves

- **Visual regression** — Playwright is already a dependency; add
  `toHaveScreenshot()` snapshots for the picker and theme presets.
- **Community health files** — `SECURITY.md`, `CODEOWNERS`, `FUNDING.yml`.
- **Changesets** — replace the manual `CHANGELOG.md` flow if release cadence
  picks up.
