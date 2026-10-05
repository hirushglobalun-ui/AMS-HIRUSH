/**
 * File: services/aiQueryNormalizer.ts
 * Purpose: Enterprise query normalization layer for the Hirush AI Copilot.
 * Normalizes punctuation, typos, case, and translates English, Malayalam, and Manglish terms.
 * Author: Hirush Global AMS
 */

export interface NormalizedQuery {
  original: string;
  normalized: string;
  detectedLanguage: 'en' | 'ml' | 'mixed';
  tokens: string[];
}

// Common typo corrections in enterprise HR/CRM queries
const TYPO_MAP: Record<string, string> = {
  attendence: 'attendance',
  atendance: 'attendance',
  attendenc: 'attendance',
  attandance: 'attendance',
  employe: 'employee',
  employes: 'employees',
  emplyee: 'employee',
  emloyee: 'employee',
  absnt: 'absent',
  absented: 'absent',
  leav: 'leave',
  leves: 'leaves',
  requst: 'request',
  requsts: 'requests',
  expir: 'expiry',
  expry: 'expiry',
  develepor: 'developer',
  developr: 'developer',
  develepers: 'developers',
  holidy: 'holiday',
  holidys: 'holidays',
  presnt: 'present',
  prsent: 'present',
  chckin: 'checkin',
  chkout: 'checkout',
};

// Manglish & Malayalam phonetic expressions mapped to canonical semantic terms
const MANGLISH_MAP: [RegExp, string][] = [
  // Malayalam script mappings
  [/ഇന്ന്\s*ആർക്കൊക്കെയാണ്\s*ലീവ്/gi, 'who is on leave today'],
  [/ആർക്കൊക്കെയാണ്\s*ലീവ്/gi, 'who is on leave'],
  [/ആർക്കൊക്കെയാണ്\s*അവധി/gi, 'who is on leave'],
  [/ആർക്കാണ്\s*ലീവ്/gi, 'who is on leave'],
  [/ആർക്കാണ്\s*അവധി/gi, 'who is on leave'],
  [/ഇന്ന്\s*ആർക്കെങ്കിലും\s*ലീവ്\s*ഉണ്ടോ/gi, 'anyone on leave today'],
  [/ആർക്കെങ്കിലും\s*ലീവ്\s*ഉണ്ടോ/gi, 'anyone on leave'],
  [/ഇന്ന്\s*ആരാണ്\s*വന്നത്/gi, 'who is present today'],
  [/ഇന്ന്\s*ആരെല്ലാം\s*വന്നു/gi, 'who is present today'],
  [/ഇന്ന്\s*ആരാണ്\s*ഓഫീസിൽ\s*ഉള്ളത്/gi, 'who is in office today'],
  [/ഇന്ന്\s*ആർക്കെങ്കിലും\s*അവധി\s*ഉണ്ടോ/gi, 'anyone on leave today'],
  [/ഇന്ന്\s*ആബ്സെന്റ്\s*ആണ്/gi, 'who is absent today'],
  [/ആരാണ്\s*/gi, 'who is '],
  [/ആരാണു\s*/gi, 'who is '],
  [/ആരാ\s*/gi, 'who is '],
  [/ആരാണ്/gi, 'who is'],
  [/ആരെല്ലാം/gi, 'who all'],
  [/ആർക്കൊക്കെ/gi, 'who all'],
  [/അനന്യ\s*ശർമ്മ|അനന്യ\s*ശർമ|അനന്യ/gi, 'Ananya Sharma'],
  [/വിക്രമാദിത്യ\s*സിംഘാനിയ|വിക്രമാദിത്യ|വിക്രം\s*സിംഘാനിയ|വിക്രം/gi, 'Vikramaditya Singhania'],
  [/പ്രിയ\s*നമ്പ്യാർ|പ്രിയ/gi, 'Priya Nambiar'],
  [/അർജുൻ\s*സ്വാമിനാഥൻ|അർജുൻ/gi, 'Arjun Swaminathan'],
  [/സിദ്ധാർത്ഥ്\s*മൽഹോത്ര|സിദ്ധാർത്ഥ്/gi, 'Siddharth Malhotra'],
  [/മീര\s*രാജ്പുത്|മീര/gi, 'Meera Rajput'],
  [/ദിവ്യ\s*അയ്യർ|ദിവ്യ/gi, 'Divya Iyer'],
  [/നിഷ\s*സുന്ദരം|നിഷ/gi, 'Nisha Sundaram'],
  [/സ്നേഹ\s*കപൂർ|സ്നേഹ/gi, 'Sneha Kapoor'],
  [/മൈക്കൽ\s*ചെൻ|മൈക്കൽ/gi, 'Michael Chen'],
  [/ഇന്ന്/gi, 'today'],
  [/ഇന്നലെ/gi, 'yesterday'],
  [/നാളെ/gi, 'tomorrow'],
  [/ഹാജർ/gi, 'attendance'],
  [/അവധി/gi, 'leave'],
  [/ലീവ്/gi, 'leave'],
  [/ഡെവലപ്പർ/gi, 'developer'],
  [/ജീവനക്കാർ/gi, 'employees'],

  // Manglish phrases (multi-word first)
  [/\baara\s*vannathu\b/gi, 'who is present'],
  [/\baara\s*vannath\b/gi, 'who is present'],
  [/\baara\s*vannatha\b/gi, 'who is present'],
  [/\baara\s*office\s*il\s*ullath\b/gi, 'who is in office'],
  [/\baaraayirunnu\s*vannathu\b/gi, 'who was present'],
  [/\baarkkokkeyaanu\s*leave\b/gi, 'who is on leave'],
  [/\baarkkokke\s*leave\b/gi, 'who is on leave'],
  [/\baarkkokkeyaanu\s*avathi\b/gi, 'who is on leave'],
  [/\baarkkokke\s*avathi\b/gi, 'who is on leave'],
  [/\baarkkaan\s*leave\b/gi, 'who is on leave'],
  [/\baarkkannu\s*leave\b/gi, 'who is on leave'],
  [/\baarkkannu\s*avathi\b/gi, 'who is on leave'],
  [/\baarkkenkilum\s*avathi\s*undo\b/gi, 'anyone on leave'],
  [/\bavathi\s*undo\b/gi, 'any leave'],
  [/\bleave\s*undo\b/gi, 'any leave'],
  [/\bethra\s*perundu\b/gi, 'how many people'],
  [/\bethra\s*per\b/gi, 'how many'],
  [/\bethra\s*aalukal\b/gi, 'how many people'],
  [/\bkazhinja\s*divasam\b/gi, 'yesterday'],
  [/\bkazhinja\s*azhcha\b/gi, 'last week'],
  [/\bkazhinja\s*aazhcha\b/gi, 'last week'],
  [/\bee\s*azhcha\b/gi, 'this week'],
  [/\bee\s*aazhcha\b/gi, 'this week'],
  [/\bee\s*masam\b/gi, 'this month'],
  [/\bee\s*maasam\b/gi, 'this month'],
  [/\bkazhinja\s*masam\b/gi, 'last month'],
  [/\bkazhinja\s*maasam\b/gi, 'last month'],
  [/\bvellikizham\b/gi, 'friday'],
  [/\bvellikizhaacha\b/gi, 'friday'],
  [/\bvelliyaazhcha\b/gi, 'friday'],
  [/\bvelli\b/gi, 'friday'],
  [/\bthinkalaazhcha\b/gi, 'monday'],
  [/\bthinkal\b/gi, 'monday'],
  [/\bveettil\s*irunnu\s*work\b/gi, 'wfh'],
  [/\bveettil\s*aanu\b/gi, 'wfh'],
  [/\bveettil\b/gi, 'wfh'],
  [/\bpani\s*eduthu\b/gi, 'worked'],
  [/\bwork\s*cheythu\b/gi, 'worked'],
  [/\binnale\b/gi, 'yesterday'],
  [/\binnu\b/gi, 'today'],
  [/\bnale\b/gi, 'tomorrow'],
  [/\bavathi\b/gi, 'leave'],
];

/**
 * Normalizes user queries by cleaning punctuation, correcting enterprise typos,
 * and standardizing Manglish / Malayalam into searchable semantic English terms.
 */
export function normalizeQuery(raw: string): NormalizedQuery {
  if (!raw || typeof raw !== 'string') {
    return {
      original: '',
      normalized: '',
      detectedLanguage: 'en',
      tokens: [],
    };
  }

  const original = raw.trim();

  // Detect script (Malayalam Unicode: \u0D00-\u0D7F)
  const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(original);

  // Check for common Manglish triggers
  const hasManglishWords = /\b(innu|innale|nale|aara|vannathu|avathi|velli|ethra|perundu|undo)\b/i.test(original);

  let detectedLanguage: 'en' | 'ml' | 'mixed' = 'en';
  if (hasMalayalamScript) {
    detectedLanguage = /[a-zA-Z]/.test(original) ? 'mixed' : 'ml';
  } else if (hasManglishWords) {
    detectedLanguage = 'mixed';
  }

  let text = original.toLowerCase();

  // Replace Manglish / Malayalam multi-word patterns
  for (const [pattern, replacement] of MANGLISH_MAP) {
    text = text.replace(pattern, replacement);
  }

  // Remove common punctuation except dashes/slashes inside dates
  text = text.toLowerCase().replace(/[^a-z0-9\s/-]/g, ' ');

  // Split into tokens, perform typo correction
  const rawTokens = text.split(/\s+/).filter(Boolean);
  const correctedTokens = rawTokens.map(t => TYPO_MAP[t] || t);

  const normalized = correctedTokens.join(' ');

  return {
    original,
    normalized,
    detectedLanguage,
    tokens: correctedTokens,
  };
}
