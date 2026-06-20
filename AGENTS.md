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
bun run data:check     # structural integrity of the grammar-case JSON (scripts/check-data.mjs)
bun run words:check    # structural integrity of Word Lab content + index freshness (scripts/check-words.mjs)
bun run words:index    # regenerate src/data/words/wordlab-index.json after editing Word Lab content
bun run audio:gen      # generate per-word audio clips into public/audio (owner-run; see Word Lab)
```

### Definition of done (the gate)

Before considering any change complete, all of these must pass:

```bash
bun run typecheck && bun run lint && bun run format:check && bun run build
```

If you touched grammar content under `src/data/` (categories/mechanisms/scenes/cases), **also** run `bun run data:check`. If you touched **Word Lab** content under `src/data/words/` (or `word-categories.json`/`word-mechanics.json`), run `bun run words:index` **then** `bun run words:check` (the latter fails if the index is stale). If the change is observable in the browser, verify it in the dev server (preview tools / manual) — don't ask the user to check manually.

## Project structure

```
src/
  data/                  # ALL content lives here, as JSON
    categories.json      # 19 grammar sections (разделы) — id, title, subtitle, order
    mechanisms.json      # ~94 grammar/usage mechanisms — id, token, name, blurb
    scenes.json          # everyday scenes (boulangerie, médecin, …) — id, name, emoji
    cases/*.json         # grammar cases grouped by category (one file per category)
    index.ts             # typed grammar loader; the ONLY place that casts JSON → domain types
    word-categories.json # Word Lab: 12 categories — id, title, themes[], bossId
    word-mechanics.json  # Word Lab: 11 word mechanics (M01…M30) — id, token, name
    words/               # Word Lab content (SEPARATE system; see "Word Lab" below)
      lexicon/*.json     # word dossiers, one file per theme
      word-cases/*.json  # word-cases per theme + boss-<domain>.json (arrays of WordCase)
      wordlab-index.json # GENERATED light eager index — regen via `bun run words:index`
      index.ts           # Word Lab loader: light meta eager, full content lazy-per-file
  types/index.ts         # domain model: Case, TaskStep union, TaskKind, Word, WordCase, dimensions
  components/
    tasks/               # one renderer per task mechanic + TaskRenderer + taskMeta + parts
    review/              # ReviewItem (spaced-repetition card)
    words/               # WordDossier, SpeakButton (Word Lab UI)
    layout/              # AppLayout (top bar, nav, XP chip, gear→/settings), BrandMark
    CaseCard.tsx
  pages/                 # HomePage, CasePage, ReviewPage, InsightsPage, MissionsPage, SettingsPage,
                         #   WordLabPage, WordSessionPage, WordBossPage (Word Lab)
  state/                 # progress-context (types+reducer), ProgressProvider, useProgress
  lib/                   # storage, shuffle (seededShuffle), review, word-lab (scheduling), save-transfer, useNow
  theme.ts               # MUI dark theme; exports `display`, `mono`, default `theme`
  main.tsx               # entry: BrowserRouter (basename from BASE_URL) + providers
scripts/check-data.mjs        # grammar content checker (bun run data:check)
scripts/check-words.mjs       # Word Lab content checker + index-freshness guard (bun run words:check)
scripts/gen-wordlab-index.mjs # regenerates wordlab-index.json (bun run words:index)
scripts/gen-audio.mjs         # generates public/audio clips (bun run audio:gen)
.github/workflows/deploy.yml  # GitHub Pages deploy (build + SPA fallback)
```

## Domain model (how content works)

A **case** (`src/types/index.ts → Case`) has: `id`, `mechanism`, `category`, `title`, `question`, `strangeness`, `difficulty` (`easy|medium|hard`), optional `isBoss`, `scenes: string[]`, `insight`, and `steps: TaskStep[]`.

`TaskStep` is a **discriminated union** keyed by `kind` (29 `TaskKind`s — 24 grammar + 5 Word Lab; see the **Word Lab** section). Most are "choice" steps (`options: string[]` + `correctIndex` + `explanation`); others are structured (`code`, `build`, `sort`, `order`, `timeline`, `dialogue`, `findMechanisms`, `ownPhrase`, `catch`). Each kind has a dedicated renderer wired through `components/tasks/TaskRenderer.tsx` and registered in `taskMeta.ts`.

Conventions enforced by `data:check`:

- Unique case ids and step ids; every `mechanism`/`category`/`scene` must resolve.
- The **last step of every case is `kind: "insight"`**, and its correct option restates the case `insight`.
- `correctIndex` in range; `compare` needs ≥2 `phrases`; `build.answer` is a permutation of `build.blocks`; `sort` items reference declared baskets; `dialogue` turn `correctIndex` in range.
- **Every category has ≥5 cases** (product invariant).
- **Minimum steps per case, scaled by difficulty:** `easy` ≥7, `medium` ≥8, `hard` ≥9, `isBoss` ≥10 (the `insight` step counts). Depth should grow with difficulty — but never pad: every step must teach or test something real (see [Editing content](#editing-content), point 5).

## Editing content

This is the most common and most sensitive task. Follow this exactly:

1. **French must be correct** (target register ~A1–B1, but flawless). Treat every French string — prompts, options (including distractors), `code` tokens, `result`, `explanation` examples — as needing native/C2-level correctness. After writing, **validate with an independent French review** (e.g. a fresh agent/subagent acting as a C2 proofreader) that checks: spelling/accents/agreement/elision, that each `correctIndex` is genuinely the only correct option, that distractors are genuinely wrong, and that the stated grammar rule is true. Fix everything it flags. This step has caught real errors — do not skip it.
2. **Reuse existing `TaskKind`s.** Do not invent a new mechanic without also adding its renderer + `taskMeta` entry + `TaskRenderer` route. The 29 kinds already cover most needs.
3. **Adding a case:** put it in the right `cases/<category>.json`; ensure its `mechanism` exists in `mechanisms.json` (add it if new), `category` exists, and `scenes` resolve. New case files must be imported and added to `caseFiles` in `src/data/index.ts`.
4. **Run `bun run data:check`**, then the full gate, then browser-verify a sample case.
5. Keep content **interesting and useful**, never padding. Don't pad a case with filler steps just to hit a count.

## Word Lab (Словарный тренажёр — the `/words` section)

A **second, parallel content system** that teaches French **vocabulary**. It is **separate** from the grammar **cases** above — its own types (`Word`, `WordCase`), loader (`src/data/words/index.ts`), validator (`words:check`), and progress slice (`wordMastery`) — but it drives the **same task renderers**. Its unit of mastery is the **word**, not the mechanism. Grammar `src/data/index.ts` and `data:check` never touch it, and vice versa.

**Mastery model:** each word has **7 dimensions** (`visualRecognition`, `contextualUnderstanding`, `listeningRecognition`, `contrastiveUnderstanding`, `collocationKnowledge`, `activeRecall`, `personalUsage`); the scheduler (`lib/word-lab.ts`) targets the weakest. Tiers: `locked → fresh (<0.34) → learning (0.34–0.74) → solid (≥0.75 = «закреплено»)`. Word steps carry optional `wordId`/`dimension`/`mechanic` on `BaseStep` (grammar cases leave them unset).

**Word TaskKinds:** word-specific kinds are `wordContext` (M01), `wordBridge` (M06), `soundTwin` (M10), `wordHint` (M29), `wordMnemonic` (M09); the rest **reuse** grammar kinds (`compare`/M18, `trap`/M07, `sort`/M12, `oddOneOut`/M17, `dialogue`/M22). The existing kinds cover all current needs.

**Lazy-load + the generated index — DON'T break this:** the lexicon and full task steps are **not bundled eagerly** (that was a ~2 MB chunk). `words/wordlab-index.json` (light words + per-case step *descriptors*) loads eagerly to drive the overview and scheduler; full dossiers/steps load **lazily per file** via `loadWordFull`/`loadCaseSteps`/`loadSteps`. So **after ANY edit under `src/data/words/`, run `bun run words:index`** to regenerate the index — `words:check` fails the gate if it's stale. Never reintroduce eager imports of lexicon/word-case JSON, and never hand-edit `wordlab-index.json`.

### Adding vocabulary (the proven batch recipe)

New words are added in **batches of ~5 themes × 8 words** via an **author→C2-review multi-agent workflow**: one agent drafts a theme's 8 word dossiers + 1 curriculum word-case; a second, **independent C2 proofreader** fixes the French and writes the files. The C2 pass catches real errors **every** batch (agreement, homophones, false friends, anglicisms, IPA) — never skip it (this is [Editing content](#editing-content) #1 applied to vocabulary).

1. **Pick fresh themes:** lemma-overlap-check candidates against the existing lexicon first; swap out duplicates. (Ids are theme-prefixed so technically unique, but duplicate *lemmas* create redundant dossiers.)
2. The workflow writes drafts to `tmp/words/<theme>.json` (a words **array**) and `tmp/cases/<theme>.json` (a single case **object**). `tmp/` is gitignored.
3. **Merge:** copy each `tmp/words/<t>.json` → `lexicon/<t>.json` as-is; **wrap each case object in an array** when writing `word-cases/<t>.json` (`[obj]`) — the loader and index expect an array. *(Copying the bare object is the #1 footgun: it breaks `words:index` with "not iterable".)*
4. **Route** every new theme into `word-categories.json` (a theme in no category fails `words:check`).
5. Run **`bun run words:index`**, then the full gate **+ `bun run words:check`**.
6. **Restart the dev server** before browser-verifying — Vite `import.meta.glob` does **not** hot-add new files. Verify: overview total, a new word's dossier lazy-loads, a themed session plays.
7. Commit, e.g. `feat(wordlab): add 5 themes — <names> (<N> words)`.

**Audio** (optional, lazy): per-word clips (`audio.isolated` on the lexicon, `audioSrc` on `soundTwin` steps) + `public/audio/*.mp3` are produced **together** by `bun run audio:gen` (owner-run). New content ships **without** audio refs; don't hand-add `audio.isolated`/`audioSrc` without the matching mp3 (the player falls back to browser TTS regardless). Note: `audioText` on a `soundTwin` step is the word to **speak**, not a file ref — keep it.

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
- **No AI attribution in commits.** Do not add a `Co-Authored-By` trailer or any "generated by"/agent line. The repository owner is the sole author — write the commit as them.
- Match existing code style and comment density (English comments). Keep diffs focused.
- When unsure about a French rule, verify with an independent review rather than guessing — correctness beats speed here.
