#!/usr/bin/env node
/**
 * Структурная проверка контента (дела/механизмы/категории/сцены).
 * НЕ проверяет правильность французского — это делает ревью носителем/C2.
 * Запуск: `bun run data:check`. Падает с кодом 1 при структурных ошибках.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', 'data');
const casesDir = path.join(dataDir, 'cases');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

const mechanisms = read(path.join(dataDir, 'mechanisms.json'));
const categories = read(path.join(dataDir, 'categories.json'));
const scenes = read(path.join(dataDir, 'scenes.json'));
const mechIds = new Set(mechanisms.map((m) => m.id));
const catIds = new Set(categories.map((c) => c.id));
const sceneIds = new Set(scenes.map((s) => s.id));

/** Виды шагов с одним правильным вариантом (options + correctIndex). */
const CHOICE = new Set([
  'strangeness', 'hypothesis', 'expand', 'fixCalque', 'scene', 'mutation',
  'oddOneOut', 'explainError', 'cloze', 'collapse', 'insight', 'compare', 'trap', 'simpler',
]);

const errors = [];
const caseIds = new Set();
const usedMechanisms = new Set();
const casesPerCategory = new Map(categories.map((c) => [c.id, 0]));
let nCases = 0;
let nSteps = 0;

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
    if (!mechIds.has(c.mechanism)) errors.push(`${at}: неизвестный mechanism «${c.mechanism}»`);
    usedMechanisms.add(c.mechanism);
    if (!catIds.has(c.category)) errors.push(`${at}: неизвестная category «${c.category}»`);
    else casesPerCategory.set(c.category, casesPerCategory.get(c.category) + 1);
    for (const s of c.scenes ?? []) if (!sceneIds.has(s)) errors.push(`${at}: неизвестная scene «${s}»`);
    if (!c.insight) errors.push(`${at}: пустой insight`);
    if (!Array.isArray(c.steps) || c.steps.length === 0) {
      errors.push(`${at}: нет шагов`);
      continue;
    }

    const stepIds = new Set();
    c.steps.forEach((s, i) => {
      nSteps++;
      const w = `${at} › ${s.id ?? `#${i}`}`;
      if (!s.id) errors.push(`${w}: нет id шага`);
      if (stepIds.has(s.id)) errors.push(`${w}: дубликат id шага`);
      stepIds.add(s.id);

      if (CHOICE.has(s.kind) || s.kind === 'debug') {
        if (!Array.isArray(s.options) || s.options.length < 2) errors.push(`${w}: <2 вариантов`);
        else if (typeof s.correctIndex !== 'number' || s.correctIndex < 0 || s.correctIndex >= s.options.length)
          errors.push(`${w}: correctIndex вне диапазона`);
        if (s.kind !== 'debug' && !s.explanation) errors.push(`${w}: нет explanation`);
      }
      if (s.kind === 'compare' && (!Array.isArray(s.phrases) || s.phrases.length < 2))
        errors.push(`${w}: compare требует >=2 phrases`);
      if (s.kind === 'code' && !Array.isArray(s.tokens)) errors.push(`${w}: code без tokens`);
      if (s.kind === 'build') {
        if (!Array.isArray(s.blocks) || !Array.isArray(s.answer)) errors.push(`${w}: build без blocks/answer`);
        else if ([...s.blocks].sort().join('|') !== [...s.answer].sort().join('|'))
          errors.push(`${w}: build answer не является перестановкой blocks`);
      }
      if (s.kind === 'sort') {
        const ids = new Set((s.baskets ?? []).map((b) => b.id));
        for (const it of s.items ?? []) if (!ids.has(it.basket)) errors.push(`${w}: item basket «${it.basket}» не объявлен`);
      }
      if (s.kind === 'order' && (!Array.isArray(s.items) || s.items.length < 2)) errors.push(`${w}: order требует >=2 items`);
      if (s.kind === 'timeline') for (const seg of s.segments ?? []) if (!['fond', 'event'].includes(seg.role)) errors.push(`${w}: timeline role «${seg.role}» неверный`);
      if (s.kind === 'dialogue')
        (s.turns ?? []).forEach((t, ti) => {
          if (typeof t.correctIndex !== 'number' || t.correctIndex < 0 || t.correctIndex >= (t.options ?? []).length)
            errors.push(`${w} turn#${ti}: correctIndex вне диапазона`);
        });
      if (s.kind === 'findMechanisms' && !(s.options ?? []).some((o) => o.present)) errors.push(`${w}: findMechanisms без present-вариантов`);
    });

    if (c.steps.at(-1)?.kind !== 'insight') errors.push(`${at}: последний шаг не insight (${c.steps.at(-1)?.kind})`);
  }
}

// Инвариант продукта: в каждом разделе минимум 5 дел.
for (const [cat, count] of casesPerCategory) if (count < 5) errors.push(`category «${cat}»: только ${count} дел (нужно >=5)`);

const orphanMechs = [...mechIds].filter((id) => !usedMechanisms.has(id));

console.log(`Дела: ${nCases} · шаги: ${nSteps} · механизмы: ${mechIds.size} · разделы: ${catIds.size} · сцены: ${sceneIds.size}`);
if (orphanMechs.length) console.log(`⚠ механизмы без дел (${orphanMechs.length}): ${orphanMechs.join(', ')}`);

if (errors.length) {
  console.error(`\n❌ структурных ошибок: ${errors.length}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('\n✅ структура в порядке');
