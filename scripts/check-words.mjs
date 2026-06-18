#!/usr/bin/env node
/**
 * Structural integrity check for Word Lab content (words / word-mechanics / word-cases).
 * Sibling of check-data.mjs — word-cases have their OWN rules (no grammar step-floor,
 * no insight-last, no category invariant). Does NOT check French correctness (that's
 * the native/C2 review). Run with `bun run words:check`. Exits 1 on structural errors.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', 'data');
const wordsDir = path.join(dataDir, 'words');
const casesDir = path.join(wordsDir, 'word-cases');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

const lexiconDir = path.join(wordsDir, 'lexicon');
const words = readdirSync(lexiconDir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => read(path.join(lexiconDir, f)));
const mechanics = read(path.join(dataDir, 'word-mechanics.json'));
const categories = read(path.join(dataDir, 'word-categories.json'));

const wordIds = new Set(words.map((w) => w.id));
const mechanicIds = new Set(mechanics.map((m) => m.id));
const DIMENSIONS = new Set([
  'visualRecognition',
  'contextualUnderstanding',
  'listeningRecognition',
  'contrastiveUnderstanding',
  'collocationKnowledge',
  'activeRecall',
  'personalUsage',
]);

/** Choice-style kinds: need options + correctIndex (+ explanation). */
const CHOICE = new Set([
  'wordContext', 'wordBridge', 'soundTwin', 'compare', 'trap', 'oddOneOut', 'scene', 'mutation',
  'fixCalque', 'explainError', 'cloze', 'expand', 'collapse', 'simpler', 'hypothesis', 'strangeness',
]);

const errors = [];
const caseIds = new Set();
const curriculumThemes = new Set();
const bossCaseIds = new Set();
let nCases = 0;
let nSteps = 0;

// Duplicate word ids
const seenWord = new Set();
for (const w of words) {
  if (seenWord.has(w.id)) errors.push(`lexicon: дубликат id слова «${w.id}»`);
  seenWord.add(w.id);
}

for (const file of readdirSync(casesDir)) {
  if (!file.endsWith('.json')) continue;
  let cases;
  try {
    cases = read(path.join(casesDir, file));
  } catch (e) {
    errors.push(`${file}: невалидный JSON — ${e.message}`);
    continue;
  }
  for (const c of cases) {
    nCases++;
    const at = `${file} › ${c.id}`;
    if (caseIds.has(c.id)) errors.push(`${at}: дубликат id дела`);
    caseIds.add(c.id);
    if (c.isBoss) bossCaseIds.add(c.id);
    else if (c.theme) curriculumThemes.add(c.theme);
    if (!Array.isArray(c.wordIds) || c.wordIds.length === 0) errors.push(`${at}: нет wordIds`);
    for (const wid of c.wordIds ?? []) {
      if (!wordIds.has(wid)) errors.push(`${at}: неизвестное слово «${wid}»`);
    }
    if (!Array.isArray(c.steps) || c.steps.length < 3) {
      errors.push(`${at}: меньше 3 шагов`);
      continue;
    }

    const stepIds = new Set();
    const trainedWords = new Set();
    c.steps.forEach((s, i) => {
      nSteps++;
      const w = `${at} › ${s.id ?? `#${i}`}`;
      if (!s.id) errors.push(`${w}: нет id шага`);
      if (stepIds.has(s.id)) errors.push(`${w}: дубликат id шага`);
      stepIds.add(s.id);

      if (!s.wordId || !wordIds.has(s.wordId)) errors.push(`${w}: неизвестный wordId «${s.wordId}»`);
      else trainedWords.add(s.wordId);
      if (s.dimension && !DIMENSIONS.has(s.dimension)) errors.push(`${w}: неверная dimension «${s.dimension}»`);
      if (s.mechanic && !mechanicIds.has(s.mechanic)) errors.push(`${w}: неизвестный mechanic «${s.mechanic}»`);

      if (CHOICE.has(s.kind)) {
        if (!Array.isArray(s.options) || s.options.length < 2) errors.push(`${w}: <2 вариантов`);
        else if (typeof s.correctIndex !== 'number' || s.correctIndex < 0 || s.correctIndex >= s.options.length)
          errors.push(`${w}: correctIndex вне диапазона`);
        if (!s.explanation) errors.push(`${w}: нет explanation`);
      }
      if (s.kind === 'wordContext' && (!Array.isArray(s.contexts) || s.contexts.length < 2))
        errors.push(`${w}: wordContext требует >=2 contexts`);
      if (s.kind === 'wordBridge' && (typeof s.bridge !== 'string' || !s.bridge.trim()))
        errors.push(`${w}: wordBridge без bridge`);
      if (s.kind === 'soundTwin' && (typeof s.audioText !== 'string' || !s.audioText.trim()))
        errors.push(`${w}: soundTwin без audioText`);
      if (s.kind === 'wordHint') {
        if (typeof s.answer !== 'string' || !s.answer.trim()) errors.push(`${w}: wordHint без answer`);
        if (!Array.isArray(s.hints) || s.hints.length < 1) errors.push(`${w}: wordHint без hints`);
      }
      if (s.kind === 'compare' && (!Array.isArray(s.phrases) || s.phrases.length < 2))
        errors.push(`${w}: compare требует >=2 phrases`);
      if (s.kind === 'sort') {
        const ids = new Set((s.baskets ?? []).map((b) => b.id));
        for (const it of s.items ?? []) if (!ids.has(it.basket)) errors.push(`${w}: item basket «${it.basket}» не объявлен`);
      }
    });

    for (const wid of c.wordIds ?? []) {
      if (!trainedWords.has(wid)) errors.push(`${at}: слово «${wid}» в wordIds, но без шага`);
    }
  }
}

// Categories must reference real themes + bosses, and cover every curriculum theme.
const categorizedThemes = new Set();
for (const cat of categories) {
  for (const t of cat.themes ?? []) {
    categorizedThemes.add(t);
    if (!curriculumThemes.has(t))
      errors.push(`word-categories: «${cat.id}» ссылается на несуществующую тему «${t}»`);
  }
  if (cat.bossId && !bossCaseIds.has(cat.bossId))
    errors.push(`word-categories: «${cat.id}» ссылается на несуществующего босса «${cat.bossId}»`);
}
for (const t of curriculumThemes) {
  if (!categorizedThemes.has(t))
    errors.push(`word-categories: тема «${t}» не входит ни в одну категорию`);
}

console.log(
  `Слова: ${words.length} · дела о словах: ${nCases} · шаги: ${nSteps} · механики: ${mechanicIds.size} · категории: ${categories.length}`,
);

if (errors.length) {
  console.error(`\n❌ структурных ошибок: ${errors.length}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\n✅ структура Word Lab в порядке');
