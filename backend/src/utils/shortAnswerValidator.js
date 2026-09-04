/**
 * Short-Answer & Synonym Validation Utility
 * Validates candidate inputs (1-4 words) against pre-validated canonical answer and accepted synonym list.
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

  // Remove trailing punctuation, multiple spaces
  text = text.replace(/[.,!?;:'"()]/g, ' ').replace(/\s+/g, ' ').trim();

  // Normalize complexity space formatting e.g. "o(n log n)" -> "o(nlogn)"
  text = text.replace(/o\(\s*n\s*log\s*n\s*\)/gi, 'o(nlogn)');
  text = text.replace(/o\(\s*log\s*n\s*\)/gi, 'o(logn)');
  text = text.replace(/o\(\s*1\s*\)/gi, 'o(1)');
  text = text.replace(/o\(\s*n\s*\)/gi, 'o(n)');

  return text;
}

/**
 * Validates candidate's short answer against canonical answer and accepted synonyms.
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

  if (!normStudent) {
    return { isCorrect: false, normStudent: '', matchedSynonym: null };
  }

  // Exact match against canonical
  if (normStudent === normCanonical) {
    return { isCorrect: true, normStudent, matchedSynonym: canonicalAnswer };
  }

  // Substring containment or match against accepted synonyms
  for (let i = 0; i < normSynonyms.length; i++) {
    const syn = normSynonyms[i];
    if (syn && (normStudent === syn || normStudent.includes(syn) || syn.includes(normStudent))) {
      return { isCorrect: true, normStudent, matchedSynonym: acceptedSynonyms[i] };
    }
  }

  // Check word-by-word containment if canonical is short
  if (normCanonical.length > 2 && normStudent.includes(normCanonical)) {
    return { isCorrect: true, normStudent, matchedSynonym: canonicalAnswer };
  }

  return { isCorrect: false, normStudent, matchedSynonym: null };
}

module.exports = {
  normalizeText,
  validateShortAnswer
};
