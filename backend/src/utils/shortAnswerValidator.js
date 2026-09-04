/**
 * Short-Answer & Synonym Validation Utility
 * Validates candidate inputs (1-4 words) against pre-validated canonical answer and accepted synonym list.
 */

/**
 * Clean and strip spaces, hyphens, underscores, and special characters for compound tech matching
 */
function stripSpaceAndHyphen(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[\s\-_.,!?;:'"()]/g, '');
}

/**
 * Normalizes input string for short answer comparison
 */
function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';

  let text = str.trim().toLowerCase();

  // Normalize number words to digits
  const numMap = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10'
  };

  Object.keys(numMap).forEach(w => {
    const reg = new RegExp(`\\b${w}\\b`, 'gi');
    text = text.replace(reg, numMap[w]);
  });

  // Common tech abbreviations & synonym normalizations
  const techSynonyms = [
    { regex: /\b(hashmap|hash map|hash-map|hash_map)\b/gi, replacement: 'hashmap' },
    { regex: /\b(hashtable|hash table|hash-table|hash_table)\b/gi, replacement: 'hashtable' },
    { regex: /\b(microservice|micro service|micro-service|microservices|micro services|micro-services)\b/gi, replacement: 'microservices' },
    { regex: /\b(websocket|web socket|web-socket|websockets|web sockets)\b/gi, replacement: 'websocket' },
    { regex: /\b(vectordb|vector db|vector database|vector-database)\b/gi, replacement: 'vectordb' },
    { regex: /\b(postgresql|postgres|postgre sql|postgre-sql)\b/gi, replacement: 'postgresql' },
    { regex: /\b(btree|b tree|b-tree)\b/gi, replacement: 'btree' },
    { regex: /\b(b\+tree|b\+ tree|b\+-tree)\b/gi, replacement: 'bplustree' },
    { regex: /\b(shared memory|sharedmemory|shared-memory)\b/gi, replacement: 'sharedmemory' },
    { regex: /\b(message queue|messagequeue|message-queue)\b/gi, replacement: 'messagequeue' }
  ];

  techSynonyms.forEach(({ regex, replacement }) => {
    text = text.replace(regex, replacement);
  });

  // Remove trailing punctuation, multiple spaces
  text = text.replace(/[.,!?;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();

  // Normalize complexity space formatting e.g. "o(n log n)" -> "o(nlogn)"
  text = text.replace(/o\(\s*n\s*log\s*n\s*\)/gi, 'o(nlogn)');
  text = text.replace(/o\(\s*log\s*n\s*\)/gi, 'o(logn)');
  text = text.replace(/o\(\s*1\s*\)/gi, 'o(1)');
  text = text.replace(/o\(\s*n\s*\)/gi, 'o(n)');
  text = text.replace(/o\(\s*n\s*\^?\s*2\s*\)/gi, 'o(n^2)');
  text = text.replace(/o\s*log\s*n/gi, 'o(logn)');
  text = text.replace(/o\s*n/gi, 'o(n)');

  return text;
}

/**
 * Validates candidate's short answer against canonical answer and accepted synonyms.
 * Includes lowercase normalization, space/hyphen stripping, and token-set matching.
 * @param {string} studentAnswer - Candidate short text answer (1-4 words)
 * @param {string} canonicalAnswer - Canonical ground truth short answer
 * @param {Array<string>} acceptedSynonyms - Pre-validated accepted synonyms
 * @returns {Object} { isCorrect, normStudent, matchedSynonym }
 */
function validateShortAnswer(studentAnswer, canonicalAnswer, acceptedSynonyms = []) {
  if (!studentAnswer || typeof studentAnswer !== 'string' || !studentAnswer.trim()) {
    return { isCorrect: false, normStudent: '', matchedSynonym: null };
  }

  const normStudent = normalizeText(studentAnswer);
  const normCanonical = normalizeText(canonicalAnswer);
  const normSynonyms = (acceptedSynonyms || []).map(s => normalizeText(s));

  const strippedStudent = stripSpaceAndHyphen(studentAnswer);
  const strippedCanonical = stripSpaceAndHyphen(canonicalAnswer);
  const strippedSynonyms = (acceptedSynonyms || []).map(s => stripSpaceAndHyphen(s));

  if (!normStudent && !strippedStudent) {
    return { isCorrect: false, normStudent: '', matchedSynonym: null };
  }

  // 1. Exact normalized string match
  if (normStudent === normCanonical) {
    return { isCorrect: true, normStudent, matchedSynonym: canonicalAnswer };
  }

  // 2. Stripped space & hyphen match (e.g. "hash map" vs "hashmap" vs "hash-map")
  if (strippedStudent && strippedCanonical && strippedStudent === strippedCanonical) {
    return { isCorrect: true, normStudent, matchedSynonym: canonicalAnswer };
  }

  // 3. Match against accepted synonyms (exact, stripped, or containment)
  for (let i = 0; i < acceptedSynonyms.length; i++) {
    const synNorm = normSynonyms[i];
    const synStripped = strippedSynonyms[i];

    if (
      (synNorm && normStudent === synNorm) ||
      (synStripped && strippedStudent === synStripped) ||
      (synNorm && normStudent.includes(synNorm)) ||
      (synNorm && synNorm.includes(normStudent)) ||
      (synStripped && strippedStudent.includes(synStripped))
    ) {
      return { isCorrect: true, normStudent, matchedSynonym: acceptedSynonyms[i] };
    }
  }

  // 4. Word Token-Set Match (word-order agnostic matching e.g. "map hash" vs "hash map")
  const studentTokens = normStudent.split(/\s+/).filter(Boolean).sort().join(' ');
  const canonicalTokens = normCanonical.split(/\s+/).filter(Boolean).sort().join(' ');
  if (studentTokens && canonicalTokens && studentTokens === canonicalTokens) {
    return { isCorrect: true, normStudent, matchedSynonym: canonicalAnswer };
  }

  // 5. Check word-by-word containment if canonical is short
  if (normCanonical.length > 2 && normStudent.includes(normCanonical)) {
    return { isCorrect: true, normStudent, matchedSynonym: canonicalAnswer };
  }

  return { isCorrect: false, normStudent, matchedSynonym: null };
}

module.exports = {
  normalizeText,
  validateShortAnswer
};
