// ============================================================
// FILE: src/lib/profanity.js
// ============================================================

// Common profanity patterns — checked as whole words, case-insensitive
const WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap',
  'dick', 'piss', 'cock', 'pussy', 'slut', 'whore', 'cunt',
  'fag', 'faggot', 'nigger', 'nigga', 'chink', 'spic', 'kike',
  'retard', 'retarded', 'mongoloid',
  'motherfucker', 'cocksucker', 'dumbass', 'asshole', 'shithead',
  'dipshit', 'fuckface', 'fuckhead', 'dickhead', 'dickface',
  'bastard', 'jackass', 'numbnuts', 'scumbag', 'douchebag',
  'goddamn', 'goddammit', 'gago', 'tarantado', 'tanginamo', 'putanginamo',
  'kinginamo', 'kingina', 'tangina', 'kupal', 'putangina', 'putanginaka', 'mamatay', 'patay',
  'puta', 'bakla', 'bading'
];

// L33t-speak substitution map
const L33T = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's',
  '7': 't', '8': 'b', '@': 'a', '!': 'i', '$': 's',
};

// De-obfuscate a string: replace common l33t chars, remove non-alpha except spaces
function deobfuscate(str) {
  let clean = str.toLowerCase();
  clean = clean.replace(/[0-9!@#$]/g, (ch) => L33T[ch] || '');
  clean = clean.replace(/[^a-z\s]/g, '');
  return clean;
}

export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const clean = deobfuscate(text);

  for (const word of WORDS) {
    // Check original text (with word boundaries)
    const regexOriginal = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    if (regexOriginal.test(lower)) return true;

    // Check de-obfuscated text (handles l33t speak)
    const regexClean = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
    if (regexClean.test(clean)) return true;

    // Check with characters inserted between letters (e.g., f.u.c.k)
    const spaced = word.split('').join('.?\\s*');
    const regexSpaced = new RegExp(spaced, 'i');
    if (regexSpaced.test(lower)) return true;
  }

  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replaces profanity with asterisks for display purposes
export function censorText(text) {
  if (!text) return text;
  let result = text;
  for (const word of WORDS) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    result = result.replace(regex, '*'.repeat(word.length));
  }
  return result;
}