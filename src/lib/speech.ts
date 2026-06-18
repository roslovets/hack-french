/**
 * Browser text-to-speech (Web Speech API). No bundled assets and no network of
 * our own — it uses the voices already installed in the user's browser/OS (on
 * Chrome/Android that is typically a Google French voice). Degrades gracefully:
 * if speech synthesis is unavailable, `speak` is a no-op and `speechAvailable`
 * returns false so callers can hide the control.
 */

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Speak French text. Cancels any in-flight utterance first. Call from an event handler. */
export function speak(text: string, opts: { rate?: number } = {}): void {
  if (!speechAvailable() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = opts.rate ?? 1;
  // Prefer an explicit French voice when the list is loaded; otherwise the
  // lang hint alone lets the browser choose one.
  const fr = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('fr'));
  if (fr) u.voice = fr;
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel();
}
