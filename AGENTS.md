# AGENTS.md — Hack French

Guidance for coding agents (Claude Code, Codex, etc.) working in this repo. Read this before making changes.

## What this is

**Hack French** (interface name; no "The") is a game-lab web app that teaches French to **Russian speakers** by "reverse engineering" the language. The learner works through detective **cases** (_дела_): spot a strange French phrase → collect clues → crack the **mechanism** → apply it in a real-life scene → end on a short **insight** (_озарение_). There is no backend — all content ships as JSON and all progress lives in `localStorage`.

- **UI and content language: Russian.** The **target language being taught is French.** Code comments are in **English** — match the surrounding style. (UI strings, error messages, and JSON content stay Russian; only comments are English.)
- French correctness is non-negotiable: the product must never teach wrong French ("не учить людей неправильному"). See [Editing content](#editing-content).

## Stack & runtime

- **bun** is the package manager and runtime (`bun.lock`). Do **not** use npm/yarn/pnpm.
- React **19.2** · TypeScript **6** (strict) · MUI **9** (+ Emotion) · Vite **8** · React Router **7** · ESLint **10** (flat config) · Prettier **3**.
- State: React Context + `useReducer`, persisted to `localStorage`. No backend, no network calls.
- **No test suite** is configured. Verification = the checks below + the browser preview.

## Commands

```bash
bun install            # install deps (CI uses --frozen-lockfile)
bun run dev            # Vite dev server → http://localhost:5173
bun run build          # tsc -b && vite build → dist/
bun run preview        # serve the production build
bun run lint           # eslint . (type-checked, flat config)
bun run format         # prettier --write
bun run format:check   # prettier --check (CI-safe)
bun run typecheck      # tsc -b --noEmit
bun run data:check     # structural integrity of the JSON content (see scripts/check-data.mjs)
```

### Definition of done (the gate)

Before considering any change complete, all of these must pass:

```bash
bun run typecheck && bun run lint && bun run format:check && bun run build
```

If you touched anything under `src/data/`, **also** run `bun run data:check`. If the change is observable in the browser, verify it in the dev server (preview tools / manual) — don't ask the user to check manually.

## Project structure

```
src/
  data/                  # ALL content lives here, as JSON
    categories.json      # 19 sections (разделы) — id, title, subtitle, order
    mechanisms.json      # ~94 grammar/usage mechanisms — id, token, name, blurb
    scenes.json          # everyday scenes (boulangerie, médecin, …) — id, name, emoji
    cases/*.json         # cases grouped by category (one file per category)
    index.ts             # typed loader; the ONLY place that casts JSON → domain types
  types/index.ts         # domain model: Case, TaskStep union, 24 TaskKind, etc.
  components/
    tasks/               # one renderer per task mechanic + TaskRenderer + taskMeta + parts
    review/              # ReviewItem (spaced-repetition card)
    layout/              # AppLayout (top bar, nav, XP chip, gear→/settings), BrandMark
    CaseCard.tsx
  pages/                 # HomePage, CasePage, ReviewPage, InsightsPage, MissionsPage, SettingsPage
  state/                 # progress-context (types+reducer), ProgressProvider, useProgress
  lib/                   # storage, shuffle (seededShuffle), review, save-transfer, useNow
  theme.ts               # MUI dark theme; exports `display`, `mono`, default `theme`
  main.tsx               # entry: BrowserRouter (basename from BASE_URL) + providers
scripts/check-data.mjs   # content integrity checker (bun run data:check)
.github/workflows/deploy.yml  # GitHub Pages deploy (build + SPA fallback)
```

## Domain model (how content works)

A **case** (`src/types/index.ts → Case`) has: `id`, `mechanism`, `category`, `title`, `question`, `strangeness`, `difficulty` (`easy|medium|hard`), optional `isBoss`, `scenes: string[]`, `insight`, and `steps: TaskStep[]`.

`TaskStep` is a **discriminated union** keyed by `kind` (24 `TaskKind`s). Most are "choice" steps (`options: string[]` + `correctIndex` + `explanation`); others are structured (`code`, `build`, `sort`, `order`, `timeline`, `dialogue`, `findMechanisms`, `ownPhrase`, `catch`). Each kind has a dedicated renderer wired through `components/tasks/TaskRenderer.tsx` and registered in `taskMeta.ts`.

Conventions enforced by `data:check`:

- Unique case ids and step ids; every `mechanism`/`category`/`scene` must resolve.
- The **last step of every case is `kind: "insight"`**, and its correct option restates the case `insight`.
- `correctIndex` in range; `compare` needs ≥2 `phrases`; `build.answer` is a permutation of `build.blocks`; `sort` items reference declared baskets; `dialogue` turn `correctIndex` in range.
- **Every category has ≥5 cases** (product invariant).
- **Minimum steps per case, scaled by difficulty:** `easy` ≥7, `medium` ≥8, `hard` ≥9, `isBoss` ≥10 (the `insight` step counts). Depth should grow with difficulty — but never pad: every step must teach or test something real (see [Editing content](#editing-content), point 5).

## Editing content

This is the most common and most sensitive task. Follow this exactly:

1. **French must be correct** (target register ~A1–B1, but flawless). Treat every French string — prompts, options (including distractors), `code` tokens, `result`, `explanation` examples — as needing native/C2-level correctness. After writing, **validate with an independent French review** (e.g. a fresh agent/subagent acting as a C2 proofreader) that checks: spelling/accents/agreement/elision, that each `correctIndex` is genuinely the only correct option, that distractors are genuinely wrong, and that the stated grammar rule is true. Fix everything it flags. This step has caught real errors — do not skip it.
2. **Reuse existing `TaskKind`s.** Do not invent a new mechanic without also adding its renderer + `taskMeta` entry + `TaskRenderer` route. The 24 kinds already cover most needs.
3. **Adding a case:** put it in the right `cases/<category>.json`; ensure its `mechanism` exists in `mechanisms.json` (add it if new), `category` exists, and `scenes` resolve. New case files must be imported and added to `caseFiles` in `src/data/index.ts`.
4. **Run `bun run data:check`**, then the full gate, then browser-verify a sample case.
5. Keep content **interesting and useful**, never padding. Don't pad a case with filler steps just to hit a count.

## Conventions & gotchas (hard-won)

- **MUI v9** dropped system-prop passthrough on `Stack`/`Typography`. Put layout/typography props (`alignItems`, `justifyContent`, `flexWrap`, `gap`, `fontWeight`, …) **inside `sx`**, not as bare props.
- **Do not enable** `cssVariables: true` on the theme — it breaks `alpha()`.
- **`react-hooks` purity (ESLint 10 / plugin v7):** never call `Date.now()` / `Math.random()` during render. Use the effect-backed `lib/useNow.ts`, or compute in event handlers. Also: never call `setState` synchronously inside an effect body.
- **React Router v7:** `navigate()` returns a Promise — call it as `void navigate(...)`.
- **`CasePage` is keyed by `:id`** (`KeyedCasePage` in `App.tsx`) so its internal step state resets between cases. Keep that wrapper.
- Task **option elements are `role="button"` divs**, not `<button>` — relevant when scripting/testing clicks.
- **Vite 8:** `build.rollupOptions.output.manualChunks` must be the **function** form (already set in `vite.config.ts`).
- No ref mutation during render (react-hooks/refs).

## State & persistence

- `localStorage` key `hack-french:progress:v1`, `PROGRESS_VERSION = 1`. `init()` does `{ ...initialProgress, ...stored }` so new fields default cleanly for older saves — prefer additive changes; bump `PROGRESS_VERSION` only for breaking shape changes.
- All mutations go through the reducer in `state/progress-context.ts` (`COMPLETE_STEP`, `COMPLETE_CASE`, `REVIEW_GRADE`, `IMPORT`, `RESET`, …) via the `useProgress()` hook.
- **Spaced repetition** ("Летучка") lives in `lib/review.ts` (pure functions) + the review reducer state.
- **Save transfer** (`lib/save-transfer.ts`, Settings page): export/import progress as a `.json` file. The codec **prunes derivable data** (insight text, steps of completed cases) and **rehydrates from `caseId`** on import, validating and dropping unknown ids — so old save files survive new content. Keep that property.

## Design system ("Dossier forensique")

Forensic-dossier aesthetic. Fonts: **Playfair Display** (`display`) for headings, **Manrope** for body, **JetBrains Mono** (`mono`) for French/code tokens. Palette: amber "evidence marker" accent on warm ink, sharp red for "bugs", sage green for "solved". **Avoid AI-slop tells**: no card hover-lift, no purple gradients, no generic Inter. The `frontend-design` skill is available for UI work.

## Deployment

GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`): Bun build, then `cp dist/index.html dist/404.html` for SPA deep-link fallback. Project sites are served from `/<repo>/`, so the workflow sets `VITE_BASE=/<repo>/`; `vite.config.ts` reads `process.env.VITE_BASE` (defaults to `/` locally) and `main.tsx` feeds `BASE_URL` to the router `basename`. For a user/org site or custom domain, set `VITE_BASE` to `/`.

## Working agreement

- Branch off `main`; **commit or push only when asked.** The user controls repo creation, pushes, and deploys.
- **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):** `type(scope): summary`, where `type` is one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`; `scope` is optional (e.g. `content`, `review`, `theme`). Keep the summary imperative and lowercase. Example: `feat(content): add reflexive-verbs boss case`.
- Match existing code style and comment density (English comments). Keep diffs focused.
- When unsure about a French rule, verify with an independent review rather than guessing — correctness beats speed here.
