#!/usr/bin/env node
/**
 * Generate French audio clips for Word Lab words via Google Cloud Text-to-Speech.
 *
 * This is a CONTENT-PREP tool you run yourself — it needs network access and a
 * Google Cloud TTS API key, which the build agent does not have. Until you run
 * it, the app simply falls back to browser speech synthesis (no files needed).
 *
 * Usage (PowerShell):
 *   $env:GOOGLE_TTS_KEY="<your-api-key>"; bun scripts/gen-audio.mjs
 * Usage (bash):
 *   GOOGLE_TTS_KEY=<your-api-key> bun scripts/gen-audio.mjs
 *
 * Options (env):
 *   GOOGLE_TTS_VOICE   voice name (default fr-FR-Standard-A)
 *   WORDS_LIMIT        only process the first N words (for a test batch)
 *   FORCE=1            regenerate even if a clip already exists
 *
 * Writes mp3s to public/audio/<id>.mp3 (+ <id>.slow.mp3) and fills each word's
 * `audio` field in src/data/words/lexicon/<theme>.json. Re-run after adding words.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lexiconDir = path.join(root, 'src', 'data', 'words', 'lexicon');
const outDir = path.join(root, 'public', 'audio');

const KEY = process.env.GOOGLE_TTS_KEY;
if (!KEY) {
  console.error('Set GOOGLE_TTS_KEY (Google Cloud Text-to-Speech API key) and re-run.');
  process.exit(1);
}
const VOICE = process.env.GOOGLE_TTS_VOICE || 'fr-FR-Standard-A';
const LIMIT = process.env.WORDS_LIMIT ? Number(process.env.WORDS_LIMIT) : Infinity;
const FORCE = process.env.FORCE === '1';

mkdirSync(outDir, { recursive: true });

async function synth(text, rate) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'fr-FR', name: VOICE },
      audioConfig: { audioEncoding: 'MP3', speakingRate: rate },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const { audioContent } = await res.json();
  return Buffer.from(audioContent, 'base64');
}

let made = 0;
let done = 0;
const files = readdirSync(lexiconDir)
  .filter((f) => f.endsWith('.json'))
  .sort();
for (const file of files) {
  if (done >= LIMIT) break;
  const filePath = path.join(lexiconDir, file);
  const words = JSON.parse(readFileSync(filePath, 'utf8'));
  let changed = false;
  for (const w of words) {
    if (done >= LIMIT) break;
    done++;
    const isoFile = `${w.id}.mp3`;
    const slowFile = `${w.id}.slow.mp3`;
    if (!FORCE && w.audio?.isolated && existsSync(path.join(outDir, isoFile))) continue;
    try {
      writeFileSync(path.join(outDir, isoFile), await synth(w.lemma, 1));
      writeFileSync(path.join(outDir, slowFile), await synth(w.lemma, 0.7));
      w.audio = { ...(w.audio ?? {}), isolated: `audio/${isoFile}`, slow: `audio/${slowFile}` };
      made++;
      changed = true;
      console.log(`✓ ${w.lemma}`);
    } catch (e) {
      console.error(`✗ ${w.lemma}: ${e.message}`);
    }
  }
  if (changed) writeFileSync(filePath, JSON.stringify(words, null, 2) + '\n');
}

console.log(`\nGenerated ${made} clip set(s). Run \`bun run format\` to tidy lexicon files.`);
