/**
 * Hack French domain model.
 *
 * Product entities (see docs): Mechanism, Case, Clue, Autopsy, Hack,
 * Anti-hack, Scene, Mission, Insight. A case consists of ordered steps —
 * each step implements one of the task mechanics.
 */

/** Task step type (mechanic). */
export type TaskKind =
  | 'strangeness' // 1. Find the oddity
  | 'hypothesis' // 2. Pick a hypothesis
  | 'code' // 3. Break down like code
  | 'build' // 4. Build the phrase from blocks
  | 'collapse' // 12. Collapse the phrase
  | 'expand' // 13. Expand the phrase
  | 'fixCalque' // 16. Fix the calque
  | 'scene' // 30. Scene with a reaction choice
  | 'mutation' // 10. Phrase mutation
  | 'ownPhrase' // 34. Compose your own phrase from life
  | 'catch' // 35. Catch it in real life
  | 'insight' // 36. "Insight" card
  | 'oddOneOut' // 7. Find the odd phrase out
  | 'explainError' // 17. Explain the error
  | 'cloze' // 23. Guess the missing mechanism
  | 'sort' // 45. Sort into baskets
  | 'order' // 33. Level of directness / register
  | 'debug' // 18. French Debug Mode
  | 'compare' // 19. Compare two phrases
  | 'trap' // 44. Translator's trap (false friends)
  | 'simpler' // 49. Say it simpler
  | 'timeline' // 25. Event timeline: background or click
  | 'dialogue' // 31. Dialogue quest
  | 'findMechanisms' // 46. Find mechanisms in a live phrase
  | 'wordContext' // 50. Word Lab — guess the word from three contexts
  | 'wordBridge' // 51. Word Lab — English cognate bridge
  | 'wordHint' // 52. Word Lab — hint-ladder active recall
  | 'wordMnemonic' // 53. Word Lab — personal mnemonic (free input)
  | 'soundTwin'; // 54. Word Lab — hear it, pick the right spelling (M10)

/** Case difficulty. */
export type Difficulty = 'easy' | 'medium' | 'hard';

interface BaseStep {
  id: string;
  kind: TaskKind;
  /** Word Lab only: which word this step trains (grammar cases omit these). */
  wordId?: string;
  /** Word Lab only: which mastery dimension this step grades. */
  dimension?: WordDimension;
  /** Word Lab only: the learning-mechanic id (M01–M30) for variety scheduling. */
  mechanic?: MechanicId;
}

/** Mechanic kinds that reduce to picking one correct option. */
export type ChoiceKind =
  | 'strangeness'
  | 'hypothesis'
  | 'expand'
  | 'fixCalque'
  | 'scene'
  | 'mutation'
  | 'oddOneOut'
  | 'explainError'
  | 'cloze'
  | 'collapse'
  | 'insight'
  | 'compare'
  | 'trap'
  | 'simpler';

/** A step with one correct answer out of several options. */
export interface ChoiceStep extends BaseStep {
  kind: ChoiceKind;
  prompt: string;
  /** The phrase under investigation (the clue). */
  phrase?: string;
  /** Two or more phrases to compare (the "compare two phrases" mechanic). */
  phrases?: string[];
  /** List of clues (for a hypothesis / mini-investigation). */
  clues?: string[];
  /** Description of an everyday situation (for a scene). */
  situation?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** The full "correct" phrase shown after answering (collapse / cloze). */
  result?: string;
}

/** A single "autopsy" block of a phrase. */
export interface CodeToken {
  fr: string;
  ru: string;
  role?: string;
}

/** Breaking a phrase down like code. */
export interface CodeStep extends BaseStep {
  kind: 'code';
  prompt?: string;
  phrase: string;
  tokens: CodeToken[];
  note?: string;
}

/** Building a phrase from blocks. */
export interface BuildStep extends BaseStep {
  kind: 'build';
  prompt: string;
  translation?: string;
  blocks: string[];
  answer: string[];
  explanation?: string;
}

/** Compose your own phrase from life (free input). */
export interface OwnPhraseStep extends BaseStep {
  kind: 'ownPhrase';
  prompt: string;
  pattern: string;
  examples: string[];
  minCount: number;
}

/** Catch the mechanism in real life (a mission outside the app). */
export interface CatchStep extends BaseStep {
  kind: 'catch';
  prompt: string;
  targets: string[];
  hint?: string;
}

export interface SortBasket {
  id: string;
  label: string;
}

export interface SortItem {
  text: string;
  basket: string;
}

/** Sorting phrases into mechanism baskets. */
export interface SortStep extends BaseStep {
  kind: 'sort';
  prompt: string;
  baskets: SortBasket[];
  items: SortItem[];
  explanation?: string;
}

/** Order phrases along a scale (directness / politeness). */
export interface OrderStep extends BaseStep {
  kind: 'order';
  prompt: string;
  scaleLow: string;
  scaleHigh: string;
  /** Already in the correct order (low to high); shuffled when shown. */
  items: string[];
  explanation?: string;
}

/** French Debug Mode — find and fix a bug in a phrase. */
export interface DebugStep extends BaseStep {
  kind: 'debug';
  buggy: string;
  bugReport: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  fixNote: string;
  explanation?: string;
}

/** Timeline segment: background (imparfait) or a "click" event (passé composé). */
export interface TimelineSegment {
  text: string;
  role: 'fond' | 'event';
}

/** Event timeline — mark parts of a phrase as background or click. */
export interface TimelineStep extends BaseStep {
  kind: 'timeline';
  prompt: string;
  segments: TimelineSegment[];
  explanation?: string;
}

/** A single turn of a dialogue quest. */
export interface DialogueTurn {
  npc: string;
  npcRu?: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/** Dialogue quest — a mini-dialogue of several turns. */
export interface DialogueStep extends BaseStep {
  kind: 'dialogue';
  prompt: string;
  scene?: string;
  intro?: string;
  turns: DialogueTurn[];
  explanation?: string;
}

/** A candidate mechanism for the "find mechanisms in a live phrase" mechanic. */
export interface MechanismTag {
  label: string;
  present: boolean;
}

/** Find mechanisms in a live phrase — select all the hidden mechanisms. */
export interface FindMechanismsStep extends BaseStep {
  kind: 'findMechanisms';
  prompt: string;
  phrase: string;
  options: MechanismTag[];
  explanation?: string;
}

export type TaskStep =
  | ChoiceStep
  | CodeStep
  | BuildStep
  | OwnPhraseStep
  | CatchStep
  | SortStep
  | OrderStep
  | DebugStep
  | TimelineStep
  | DialogueStep
  | FindMechanismsStep
  | WordContextStep
  | WordBridgeStep
  | WordHintStep
  | WordMnemonicStep
  | SoundTwinStep;

/** Mechanism — a specific French thing that gets hacked. */
export interface Mechanism {
  id: string;
  token: string;
  name: string;
  blurb: string;
}

/** A section of the topic map (for grouping cases). */
export interface Category {
  id: string;
  title: string;
  subtitle: string;
  order: number;
}

/** An everyday scene. */
export interface Scene {
  id: string;
  name: string;
  emoji: string;
}

/** Case — the investigation of a single mechanism. */
export interface Case {
  id: string;
  mechanism: string;
  category: string;
  title: string;
  question: string;
  strangeness: string;
  difficulty: Difficulty;
  isBoss?: boolean;
  scenes: string[];
  steps: TaskStep[];
  insight: string;
}

// ── Word Lab (vocabulary trainer) ───────────────────────────────────────────
// A separate content world that reuses the TaskStep renderer engine. Word-cases
// are NOT mixed into the grammar `cases` array (different invariants + state).

/** Independent mastery dimensions tracked per word (Word Lab spec §5). */
export type WordDimension =
  | 'visualRecognition'
  | 'contextualUnderstanding'
  | 'listeningRecognition' // declared but not scheduled yet (audio deferred)
  | 'contrastiveUnderstanding'
  | 'collocationKnowledge'
  | 'activeRecall'
  | 'personalUsage';

/** Learning-mechanic id from the Word Lab spec (M01–M30). */
export type MechanicId =
  | 'M01'
  | 'M02'
  | 'M03'
  | 'M04'
  | 'M05'
  | 'M06'
  | 'M07'
  | 'M08'
  | 'M09'
  | 'M10'
  | 'M11'
  | 'M12'
  | 'M13'
  | 'M14'
  | 'M15'
  | 'M16'
  | 'M17'
  | 'M18'
  | 'M19'
  | 'M20'
  | 'M21'
  | 'M22'
  | 'M23'
  | 'M24'
  | 'M25'
  | 'M26'
  | 'M27'
  | 'M28'
  | 'M29'
  | 'M30';

export type WordLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type Pos = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'conj' | 'pron' | 'expr';

/** A typical word combination (Word Lab spec §9.4 / mechanic M12). */
export interface Collocation {
  fr: string;
  ru: string;
}

/** A confusable word/expression (false friend, near-synonym, register twin). */
export interface ContrastPair {
  with: string;
  note: string; // RU explanation of the distinction
  wordId?: string; // optional cross-link to another Word
}

/** Pre-recorded audio clips for a word (Word Lab spec §9.2). Optional — when a
 *  clip is absent the UI falls back to browser text-to-speech. Paths are relative
 *  to the app base (e.g. "audio/wl-cafe-cafe.mp3"). */
export interface AudioSet {
  isolated?: string;
  slow?: string;
  shortPhrase?: string;
  naturalPhrase?: string;
}

/** A vocabulary word — a multi-layer dossier, not a flat translation pair. */
export interface Word {
  id: string;
  lemma: string;
  displayForm?: string;
  pos: Pos;
  gender?: 'm' | 'f';
  ipa?: string;
  audio?: AudioSet; // optional pre-recorded clips; UI falls back to TTS
  translationsRu: string[];
  translationsEn: string[];
  semanticCore: string; // RU: the meaning beneath the translations
  collocations: Collocation[];
  contrastPairs: ContrastPair[];
  frequencyRank: number; // drives intro order
  level: WordLevel;
  tags: string[];
  caseIds: string[];
}

/** A word-case: a themed cluster of words + the steps that train them. */
export interface WordCase {
  id: string;
  title: string;
  theme: string; // free-text theme, NOT a grammar category id
  level: WordLevel;
  isBoss?: boolean;
  wordIds: string[];
  steps: TaskStep[]; // reuses the same TaskStep union + renderers
}

/** Word Lab mechanic registry entry (analogue of Mechanism for grammar). */
export interface WordMechanic {
  id: MechanicId;
  token: string;
  label: string;
  primaryDimension: WordDimension;
}

/** Groups themes (and their domain boss) into one section of the «Слова» screen,
 *  so the theme list stays navigable as the lexicon scales toward 1000 words. */
export interface WordCategory {
  id: string;
  title: string;
  themes: string[]; // curriculum case `theme` values in this category
  bossId?: string; // the domain boss that covers these themes
}

/** M01 — guess the word from three contexts before seeing the translation. */
export interface WordContextStep extends BaseStep {
  kind: 'wordContext';
  prompt: string;
  contexts: string[]; // three French sentences featuring the hidden word
  options: string[]; // candidate lemmas / meanings
  correctIndex: number;
  explanation: string;
}

/** M06 — use an English cognate as a bridge to the French word. */
export interface WordBridgeStep extends BaseStep {
  kind: 'wordBridge';
  prompt: string;
  bridge: string; // the English anchor / cognate note
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** M29 — recall the word with a progressive hint ladder. */
export interface WordHintStep extends BaseStep {
  kind: 'wordHint';
  prompt: string;
  answer: string; // target lemma (matched accent-/case-insensitively)
  hints: string[]; // progressive hints, revealed one at a time
  explanation: string;
}

/** M09 — capture a personal mnemonic for the word (free input, always passes). */
export interface WordMnemonicStep extends BaseStep {
  kind: 'wordMnemonic';
  prompt: string;
  examples?: string[]; // optional suggestion chips
}

/** M10 — play audio, pick which similar-sounding spelling was heard. */
export interface SoundTwinStep extends BaseStep {
  kind: 'soundTwin';
  prompt: string;
  audioText: string; // the French text that is spoken (never shown before answering)
  audioSrc?: string; // optional clip path; otherwise synthesized
  options: string[]; // candidate spellings (minimal pairs / sound-alikes)
  correctIndex: number;
  explanation: string;
}
