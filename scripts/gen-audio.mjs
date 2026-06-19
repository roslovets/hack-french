#!/usr/bin/env node
/**
 * Generate French audio clips for Word Lab words.
 *
 * By default this uses Google Translate's public web TTS endpoint so the
 * repository can be filled without project credentials. If GOOGLE_TTS_KEY is
 * set (or AUDIO_PROVIDER=google-cloud), it uses Google Cloud Text-to-Speech
 * instead for a more controllable production voice. Until you run it, the app
 * simply falls back to browser speech synthesis (no files needed).
 *
 * Usage (PowerShell):
 *   bun scripts/gen-audio.mjs
 *   $env:GOOGLE_TTS_KEY="<your-api-key>"; bun scripts/gen-audio.mjs
 * Usage (bash):
 *   bun scripts/gen-audio.mjs
 *   GOOGLE_TTS_KEY=<your-api-key> bun scripts/gen-audio.mjs
 *
 * Options (env):
 *   AUDIO_PROVIDER     auto | google-translate | google-cloud (default auto)
 *   GOOGLE_TTS_VOICE   voice name (default fr-FR-Standard-A)
 *   WORDS_LIMIT        only process the first N words (for a test batch)
 *   FORCE=1            regenerate even if a clip already exists
 *   TTS_DELAY_MS       delay between requests (default 150 for google-translate)
 *
 * Writes mp3s to public/audio/<id>.mp3 and fills each word's `audio.isolated`
 * field in src/data/words/lexicon/<theme>.json. It also links each soundTwin
 * step to the same word clip via `audioSrc`. Re-run after adding words.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lexiconDir = path.join(root, 'src', 'data', 'words', 'lexicon');
const wordCasesDir = path.join(root, 'src', 'data', 'words', 'word-cases');
const outDir = path.join(root, 'public', 'audio');

const KEY = process.env.GOOGLE_TTS_KEY;
const PROVIDER = process.env.AUDIO_PROVIDER || (KEY ? 'google-cloud' : 'google-translate');
if (!['auto', 'google-cloud', 'google-translate'].includes(PROVIDER)) {
  console.error('AUDIO_PROVIDER must be auto, google-cloud, or google-translate.');
  process.exit(1);
}
const ACTIVE_PROVIDER =
  PROVIDER === 'auto' ? (KEY ? 'google-cloud' : 'google-translate') : PROVIDER;
if (ACTIVE_PROVIDER === 'google-cloud' && !KEY) {
  console.error('Set GOOGLE_TTS_KEY (Google Cloud Text-to-Speech API key) and re-run.');
  process.exit(1);
}
const VOICE = process.env.GOOGLE_TTS_VOICE || 'fr-FR-Standard-A';
const LIMIT = process.env.WORDS_LIMIT ? Number(process.env.WORDS_LIMIT) : Infinity;
const FORCE = process.env.FORCE === '1';
const DELAY_MS = process.env.TTS_DELAY_MS
  ? Number(process.env.TTS_DELAY_MS)
  : ACTIVE_PROVIDER === 'google-translate'
    ? 150
    : 0;
const RETRIES = process.env.TTS_RETRIES ? Number(process.env.TTS_RETRIES) : 3;

mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(url, options, label) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
      return res;
    } catch (e) {
      lastError = e;
      if (attempt < RETRIES) await sleep(350 * attempt);
    }
  }
  throw new Error(`${label}: ${lastError.message}`);
}

async function synthGoogleCloud(text) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'fr-FR', name: VOICE },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const { audioContent } = await res.json();
  return Buffer.from(audioContent, 'base64');
}

async function synthGoogleTranslate(text) {
  if (text.length > 200) throw new Error('Google Translate TTS supports only short clips');
  const url = new URL('https://translate.google.com/translate_tts');
  url.searchParams.set('ie', 'UTF-8');
  url.searchParams.set('q', text);
  url.searchParams.set('tl', 'fr');
  url.searchParams.set('client', 'tw-ob');

  const res = await fetchWithRetries(
    url,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      },
    },
    text,
  );
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('audio')) throw new Error(`Unexpected TTS content type: ${type}`);
  return Buffer.from(await res.arrayBuffer());
}

const synth = ACTIVE_PROVIDER === 'google-cloud' ? synthGoogleCloud : synthGoogleTranslate;

let made = 0;
let done = 0;
let failed = 0;
let linked = 0;
const wordAudioById = new Map();
const files = readdirSync(lexiconDir)
  .filter((f) => f.endsWith('.json'))
  .sort();
console.log(`Audio provider: ${ACTIVE_PROVIDER}`);
for (const file of files) {
  if (done >= LIMIT) break;
  const filePath = path.join(lexiconDir, file);
  const words = JSON.parse(readFileSync(filePath, 'utf8'));
  let changed = false;
  for (const w of words) {
    if (done >= LIMIT) break;
    done++;
    const isoFile = `${w.id}.mp3`;
    const isolated = `audio/${isoFile}`;
    const isoPath = path.join(outDir, isoFile);
    if (!FORCE && existsSync(isoPath)) {
      if (w.audio?.isolated !== isolated) {
        w.audio = { ...(w.audio ?? {}), isolated };
        changed = true;
      }
      wordAudioById.set(w.id, isolated);
      continue;
    }
    try {
      writeFileSync(isoPath, await synth(w.lemma));
      if (DELAY_MS) await sleep(DELAY_MS);
      w.audio = { ...(w.audio ?? {}), isolated };
      wordAudioById.set(w.id, isolated);
      made++;
      changed = true;
      console.log(`✓ ${w.lemma}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${w.lemma}: ${e.message}`);
    }
  }
  if (changed) writeFileSync(filePath, JSON.stringify(words, null, 2) + '\n');
}

for (const file of readdirSync(wordCasesDir)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const filePath = path.join(wordCasesDir, file);
  const cases = JSON.parse(readFileSync(filePath, 'utf8'));
  let changed = false;
  for (const c of cases) {
    for (const step of c.steps ?? []) {
      if (step.kind !== 'soundTwin') continue;
      const src = wordAudioById.get(step.wordId);
      if (!src) continue;
      if (FORCE || step.audioSrc !== src) {
        step.audioSrc = src;
        linked++;
        changed = true;
      }
    }
  }
  if (changed) writeFileSync(filePath, JSON.stringify(cases, null, 2) + '\n');
}

console.log(`\nGenerated ${made} clip(s). Linked ${linked} soundTwin step(s).`);
if (failed) {
  console.error(`Failed clip set(s): ${failed}`);
  process.exit(1);
}
