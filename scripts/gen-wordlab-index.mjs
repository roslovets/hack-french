#!/usr/bin/env node
/**
 * Generate the lightweight Word Lab index that the app loads eagerly.
 *
 * The full lexicon dossiers (collocations, contrast pairs, …) and the full task
 * steps (options, contexts, explanations) are HEAVY and only needed when a word's
 * dossier is opened or a session/boss is actually played. This index carries only
 * what the overview + the scheduler need — word lemmas and per-case step
 * descriptors — so the `/words` route chunk stays small. The full content is
 * lazy-loaded per file on demand (see src/data/words/index.ts).
 *
 * Run `bun run words:index` after changing lexicon/word-cases. `words:check`
 * fails if the committed index is stale.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wordsDir = path.join(root, 'src', 'data', 'words');
const lexDir = path.join(wordsDir, 'lexicon');
const casesDir = path.join(wordsDir, 'word-cases');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const jsonFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

export function buildIndex() {
  const words = [];
  for (const file of jsonFiles(lexDir)) {
    for (const w of read(path.join(lexDir, file))) {
      const lite = { id: w.id, lemma: w.lemma, level: w.level, frequencyRank: w.frequencyRank, file };
      if (w.displayForm) lite.displayForm = w.displayForm;
      if (w.audio) lite.audio = w.audio;
      words.push(lite);
    }
  }
  const cases = [];
  for (const file of jsonFiles(casesDir)) {
    for (const c of read(path.join(casesDir, file))) {
      cases.push({
        id: c.id,
        title: c.title,
        theme: c.theme,
        level: c.level,
        isBoss: Boolean(c.isBoss),
        wordIds: c.wordIds,
        file,
        steps: c.steps.map((s) => ({
          id: s.id,
          kind: s.kind,
          wordId: s.wordId,
          dimension: s.dimension,
          mechanic: s.mechanic,
        })),
      });
    }
  }
  return { words, cases };
}

export const INDEX_PATH = path.join(wordsDir, 'wordlab-index.json');

// Stable serialisation so the freshness check is deterministic.
export const serializeIndex = (idx) => JSON.stringify(idx, null, 0) + '\n';

// Only write when run directly (not when imported by check-words).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('gen-wordlab-index.mjs')) {
  const idx = buildIndex();
  writeFileSync(INDEX_PATH, serializeIndex(idx));
  const steps = idx.cases.reduce((n, c) => n + c.steps.length, 0);
  console.log(`wordlab-index.json: ${idx.words.length} words · ${idx.cases.length} cases · ${steps} step descriptors`);
}
