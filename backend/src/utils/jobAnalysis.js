const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'a', 'an', 'the',
  'and', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off',
  'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'is', 'am',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
  'does', 'did', 'doing', 'would', 'could', 'should', 'ought', 'i\'m', 'you\'re',
  'he\'s', 'she\'s', 'it\'s', 'we\'re', 'they\'re', 'i\'ve', 'you\'ve', 'we\'ve',
  'they\'ve', 'i\'d', 'you\'d', 'he\'d', 'she\'d', 'we\'d', 'they\'d', 'isn\'t',
  'aren\'t', 'wasn\'t', 'weren\'t', 'haven\'t', 'hasn\'t', 'hadn\'t', 'doesn\'t',
  'don\'t', 'didn\'t', 'won\'t', 'wouldn\'t', 'shouldn\'t', 'couldn\'t', 'that\'s',
  'who\'s', 'what\'s', 'where\'s', 'when\'s', 'why\'s', 'how\'s', 'there\'s',
  'here\'s', 'let\'s', 'i\'ll', 'you\'ll', 'he\'ll', 'she\'ll', 'it\'ll', 'we\'ll',
  'they\'ll', 'i\'ve', 'you\'ve', 'we\'ve', 'they\'ve', 'must', 'might', 'may',
  'might', 'shall', 'ought', 'used', 'need', 'dare'
]);

/**
 * Tokenizer - splits text into tokens
 */
function tokenize(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  return lower
    .replace(/[/\\`~@#$%^&*()+=[\]{}|;:"<>?,._-]+/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Remove stop words from token array
 */
function removeStopWords(tokens) {
  return tokens.filter(token => !STOP_WORDS.has(token) && token.length > 2);
}

/**
 * Extract terms from text (tokenize + remove stop words)
 */
function extractTerms(text) {
  const tokens = tokenize(text);
  return removeStopWords(tokens);
}

/**
 * Simple stemmer using Porter stemming rules (simplified)
 * This reduces words to their root form
 */
function simpleStem(word) {
  let stem = word.toLowerCase();

  // Handle common suffixes
  const suffixes = [
    { suffix: 'ing', replacement: '' },
    { suffix: 'edly', replacement: 'e' },
    { suffix: 'ed', replacement: '' },
    { suffix: 'ly', replacement: '' },
    { suffix: 'ies', replacement: 'y' },
    { suffix: 'es', replacement: 'e' },
    { suffix: 's', replacement: '' },
  ];

  for (const { suffix, replacement } of suffixes) {
    if (stem.endsWith(suffix) && stem.length - suffix.length >= 3) {
      stem = stem.slice(0, -suffix.length) + replacement;
      break;
    }
  }

  return stem;
}

/**
 * TF-IDF Vectorizer for computing document similarity
 */
class TFIDFVectorizer {
  constructor() {
    this.vocab = new Map();
    this.idf = new Map();
    this.docCount = 0;
  }

  fit(documents) {
    this.docCount = documents.length;
    const termDocCount = new Map();

    documents.forEach(doc => {
      const terms = extractTerms(doc);
      const uniqueTerms = new Set(terms);
      uniqueTerms.forEach(term => {
        termDocCount.set(term, (termDocCount.get(term) || 0) + 1);
      });
    });

    termDocCount.forEach((count, term) => {
      const idfValue = Math.log((this.docCount + 1) / (count + 1)) + 1;
      this.idf.set(term, idfValue);
      if (!this.vocab.has(term)) {
        this.vocab.set(term, this.vocab.size);
      }
    });
  }

  transform(text) {
    const terms = extractTerms(text);
    const termCount = new Map();
    terms.forEach(term => {
      termCount.set(term, (termCount.get(term) || 0) + 1);
    });

    const vector = new Array(this.vocab.size).fill(0);
    const totalTerms = terms.length || 1;

    for (const [term, count] of termCount) {
      if (this.vocab.has(term)) {
        const idx = this.vocab.get(term);
        const tf = count / totalTerms;
        const idfVal = this.idf.get(term) || 1;
        vector[idx] = tf * idfVal;
      }
    }

    return vector;
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Compute TF-IDF cosine similarity between two texts
 */
function computeTFIDFSimilarity(textA, textB) {
  if (!textA || !textB) return 0;
  const vectorizer = new TFIDFVectorizer();
  vectorizer.fit([textA, textB]);
  const vecA = vectorizer.transform(textA);
  const vecB = vectorizer.transform(textB);
  return vectorizer.cosineSimilarity(vecA, vecB);
}

/**
 * Extract n-grams from text (for phrase extraction)
 */
function extractNgrams(text, n = 2) {
  if (!text) return [];
  const tokens = tokenize(text).filter(t => t.length > 2);
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Extract candidate keywords/phrases from text using simple frequency analysis
 */
function extractKeyPhrases(text, topK = 15) {
  if (!text) return [];

  const lower = String(text).toLowerCase();

  // Tokenize
  const tokens = tokenize(text).filter(t => t.length > 2 && !STOP_WORDS.has(t));
  
  // Compute term frequencies
  const freqMap = new Map();
  tokens.forEach(token => {
    freqMap.set(token, (freqMap.get(token) || 0) + 1);
  });

  // Sort by frequency
  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([term]) => term);

  return sorted;
}

/**
 * Identify technical skills mentioned in text using regex patterns
 */
const TECH_CATEGORIES = {
  languages: [
    { pattern: /python/i, name: 'Python' },
    { pattern: /\bjavascript\b|(?<!\.)\bjs\b/i, name: 'JavaScript' },
    { pattern: /\btypescript\b|\bts\b/i, name: 'TypeScript' },
    { pattern: /(?:^|\W)java(?:\W|$)/i, name: 'Java' },
    { pattern: /c\+\+/i, name: 'C++' },
    { pattern: /c#/i, name: 'C#' },
    { pattern: /ruby/i, name: 'Ruby' },
    { pattern: /php/i, name: 'PHP' },
    { pattern: /go(?:\s|lang)/i, name: 'Go' },
    { pattern: /swift/i, name: 'Swift' },
    { pattern: /kotlin/i, name: 'Kotlin' },
    { pattern: /(?:^|\W)r(?:\W|$)/i, name: 'R' },
    { pattern: /\bscala\b/i, name: 'Scala' },
    { pattern: /\bsql\b/i, name: 'SQL' },
  ],
  frameworks: [
    { pattern: /react/i, name: 'React' },
    { pattern: /vue/i, name: 'Vue' },
    { pattern: /angular/i, name: 'Angular' },
    { pattern: /spring/i, name: 'Spring' },
    { pattern: /django/i, name: 'Django' },
    { pattern: /flask/i, name: 'Flask' },
    { pattern: /express/i, name: 'Express' },
    { pattern: /laravel/i, name: 'Laravel' },
    { pattern: /tensorflow/i, name: 'TensorFlow' },
    { pattern: /pytorch/i, name: 'PyTorch' },
    { pattern: /node\s*\.?\s*js/i, name: 'Node.js' },
    { pattern: /next\s*\.?\s*js/i, name: 'Next.js' },
  ],
  databases: [
    { pattern: /mysql/i, name: 'MySQL' },
    { pattern: /postgresql|postgres/i, name: 'PostgreSQL' },
    { pattern: /mongo(?:db)?/i, name: 'MongoDB' },
    { pattern: /redis/i, name: 'Redis' },
    { pattern: /oracle/i, name: 'Oracle' },
    { pattern: /sql\s+server/i, name: 'SQL Server' },
  ],
  cloudDevops: [
    { pattern: /\baws\b/i, name: 'AWS' },
    { pattern: /\bazure\b/i, name: 'Azure' },
    { pattern: /\bgcp\b/i, name: 'GCP' },
    { pattern: /docker/i, name: 'Docker' },
    { pattern: /kubernetes|k8s/i, name: 'Kubernetes' },
    { pattern: /jenkins/i, name: 'Jenkins' },
    { pattern: /github\s+actions/i, name: 'GitHub Actions' },
    { pattern: /\bterraform\b/i, name: 'Terraform' },
    { pattern: /\bansible\b/i, name: 'Ansible' },
    { pattern: /\bargo\b/i, name: 'Argo' },
    { pattern: /\bserverless\b/i, name: 'Serverless' },
    { pattern: /ci\s*\/\s*cd/i, name: 'CI/CD' },
  ],
  mobile: [
    { pattern: /\bandroid\b/i, name: 'Android' },
    { pattern: /react\s+native/i, name: 'React Native' },
    { pattern: /flutter/i, name: 'Flutter' },
  ],
};

function identifySkills(text) {
  if (!text) return { hardSkills: [], softSkills: [], technologies: [] };
  const lower = text.toLowerCase();
  const hardSkills = new Set();
  const technologies = new Set();
  const softSkills = new Set();

  // Check each category
  Object.entries(TECH_CATEGORIES).forEach(([category, items]) => {
    items.forEach(item => {
      const matches = lower.match(new RegExp(item.pattern.source, item.pattern.flags));
      if (matches) {
        hardSkills.add(item.name);
        technologies.add(item.name);
      }
    });
  });

  // Extract soft skills from context patterns
  const softSkillContexts = [
    'communication', 'teamwork', 'leadership', 'problem-solving', 'time management',
    'critical thinking', 'adaptability', 'creativity', 'attention to detail',
    'project management', 'customer service', 'negotiation', 'collaboration',
  ];

  softSkillContexts.forEach(skill => {
    if (lower.includes(skill)) {
      softSkills.add(skill);
    }
  });

  return {
    hardSkills: Array.from(hardSkills),
    softSkills: Array.from(softSkills),
    technologies: Array.from(technologies),
  };
}

/**
 * Identify experience requirements from job description
 */
function identifyExperienceRequirements(text) {
  if (!text) return { minYears: 0, maxYears: null, experienceLevel: null };
  const lower = text.toLowerCase();

  // Extract minimum years
  const minMatch = lower.match(/(?:minimum|min|at least|over|more than)\s+(\d+)\s*(?:\+)?\s*(?:yrs?\.?|years?)/i)
    || lower.match(/(\d+)\+\s*(?:yrs?\.?|years?)/i)
    || lower.match(/(\d+)\s*(?:yrs?\.?|years?)\s+or\s+more/i)
    || lower.match(/\b(\d+)\s*(?:\+)?\s*(?:yrs?\.?|years?)\s+(?:of\s+)?(?:experience|exp)\b/i);
  let minYears = minMatch ? parseInt(minMatch[1]) : 0;

  // Extract maximum years (less common, but handle "up to X years")
  const maxMatch = lower.match(/(?:maximum|max|up\s+to)\s+(\d+)\s*(?:\+)?\s*(?:yrs?\.?|years?)/i)
    || lower.match(/(\d+)\s*[–-]\s*(\d+)\s+(?:yrs?\.?|years?)/i);
  let maxYears = maxMatch ? parseInt(maxMatch[1] || maxMatch[2]) : null;

  // Handle "X-Y years experience" range
  const rangeMatch = lower.match(/(\d+)\s*[–-]\s*(\d+)\s+(?:yrs?\.?|years?)/i);
  if (rangeMatch) {
    const rangeMin = parseInt(rangeMatch[1]);
    const rangeMax = parseInt(rangeMatch[2]);
    minYears = Math.max(minYears, rangeMin);
    maxYears = rangeMax;
  }

  // Identify experience level from context
  let experienceLevel = null;
  if (/senior|lead|principal|staff/i.test(lower)) {
    experienceLevel = 'senior';
  } else if (/junior|entry.?level|0.*year/i.test(lower)) {
    experienceLevel = 'junior';
  } else if (/mid(?:dle)?/i.test(lower)) {
    experienceLevel = 'mid';
  }

  return { minYears, maxYears, experienceLevel };
}

/**
 * Identify education requirements
 */
function identifyEducationRequirements(text) {
  if (!text) return { degrees: [], requiredFields: [] };
  const lower = text.toLowerCase();
  const degrees = new Set();
  const requiredFields = new Set();

  // Degree patterns
  const degreeMatches = lower.match(/bachelor[’'"]?\s*i?\s?degree|bachelor[’'"]?s|master[’'"]?\s*i?\s?degree|master[’'"]?s|ph\.?d|doctorate|associate[’'"]?\s*degree|diploma/i);
  if (degreeMatches) {
    degreeMatches.forEach(match => degrees.add(match.toLowerCase()));
  }

  // Also check for specific patterns
  if (/bachelor/i.test(lower)) degrees.add('bachelor');
  if (/master/i.test(lower)) degrees.add('master');
  if (/phd|doctorate/i.test(lower)) degrees.add('phd');
  if (/associate/i.test(lower)) degrees.add('associate');
  if (/diploma/i.test(lower)) degrees.add('diploma');

  // Required fields/majors
  const fieldPatterns = [
    /degree\s+in\s+([a-z]+(?:[-\s][a-z]+){0,2}?)(?=\s+(?:is|are|will|was|were|required|preferred|prefer|must|or|,|\.|$))/gi,
    /major\s+in\s+([a-z]+(?:[-\s][a-z]+){0,2}?)(?=\s+(?:is|are|will|was|were|required|preferred|prefer|must|or|,|\.|$))/gi,
    /speciali[sz]ation?\s+in\s+([a-z]+(?:[-\s][a-z]+){0,2}?)(?=\s+(?:is|are|will|was|were|required|preferred|prefer|must|or|,|\.|$))/gi,
    /field\s+of\s+study\s*:\s*([a-z]+(?:[-\s][a-z]+){0,2}?)(?=\s*(?:;|\.|$))/gi,
  ];

  for (const pattern of fieldPatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const field = match[1].trim();
      if (field.length > 2 && field.length <= 40) {
        requiredFields.add(field);
      }
    }
  }

  return {
    degrees: Array.from(degrees),
    requiredFields: Array.from(requiredFields),
  };
}

/**
 * Identify certification requirements
 */
function identifyCertificationsRequirements(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const certifications = new Set();

  // Words that indicate the captured phrase is not really a certification name
  const fillerWords = new Set([
    'is', 'are', 'was', 'were', 'will', 'be', 'been', 'being', 'have', 'has', 'had',
    'preferred', 'prefer', 'required', 'must', 'should', 'would', 'could', 'good',
    'nice', 'plus', 'a', 'an', 'the', 'or', 'and', 'of', 'with', 'for', 'on', 'can',
    'could', 'candidate', 'candidates', 'are', 'you', 'your', 'we', 'our',
  ]);

  const cleanCert = (raw) => {
    const tokens = raw.trim().split(/\s+/).filter(word => !fillerWords.has(word));
    if (tokens.length === 0) return null;
    return tokens.join(' ');
  };

  // Look for certification patterns
  const certPatterns = [
    /((?!is\b|are\b|was\b|were\b|will\b|be\b|must\b|should\b|could\b|preferred\b|prefer\b|required\b|good\b|nice\b|plus\b|a\b|an\b|the\b)[a-z][a-z0-9+]*(?:\s+[a-z][a-z0-9]*){0,2})\s+certification/gi,
    /certification\s+in\s+([a-z][a-z0-9+.-]*(?:\s+[a-z][a-z0-9+.-]*){0,3})/gi,
    /certified\s+((?!is\b|are\b|was\b|were\b|will\b|be\b|must\b|should\b|could\b|preferred\b|prefer\b|required\b|good\b|nice\b|plus\b)[a-z][a-z0-9+]*(?:\s+[a-z][a-z0-9]*){0,2})(?=\s+(?:in|by|with|is|are|was|were|will|\.|,|$))/gi,
    /([a-z][a-z0-9+]*(?:\s+[a-z][a-z0-9]*){0,2})\s+certified\b/gi,
  ];

  for (const pattern of certPatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const raw = match[1];
      const cleaned = cleanCert(raw);
      if (cleaned && cleaned.split(' ').length <= 4) {
        certifications.add(cleaned);
      }
    }
  }

  return Array.from(certifications);
}

/**
 * Identify key responsibilities from job description
 */
function identifyResponsibilities(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const responsibilities = new Set();

  // Look for sentence beginnings with action verbs
  const sentences = text.split(/[.!?]+/);
  const actionVerbs = [
    'manage', 'develop', 'design', 'create', 'build', 'lead', 'coordinate',
    'implement', 'maintain', 'optimize', 'responsible', 'work', 'conduct',
    'perform', 'execute', 'analyze', 'evaluate', 'manage', 'supervise',
    'collaborate', 'partner', 'communicate', 'mentor', 'train', 'support',
  ];

  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    if (trimmed.length > 20) {
      for (const verb of actionVerbs) {
        if (trimmed.startsWith(verb)) {
          responsibilities.add(trimmed);
          break;
        }
      }
    }
  }

  return Array.from(responsibilities);
}

/**
 * Main function to analyze a job description and extract all requirements
 */
function analyzeJobDescription(description) {
  if (!description) {
    return {
      skills: { hardSkills: [], softSkills: [], technologies: [] },
      experience: { minYears: 0, maxYears: null, experienceLevel: null },
      education: { degrees: [], requiredFields: [] },
      certifications: [],
      responsibilities: [],
      keywords: [],
      rawDescription: '',
    };
  }

  const skills = identifySkills(description);
  const experience = identifyExperienceRequirements(description);
  const education = identifyEducationRequirements(description);
  const certifications = identifyCertificationsRequirements(description);
  const responsibilities = identifyResponsibilities(description);
  const keywords = extractKeyPhrases(description, 25);

  return {
    skills,
    experience,
    education,
    certifications,
    responsibilities,
    keywords,
    rawDescription: description,
  };
}

module.exports = {
  STOP_WORDS,
  tokenize,
  removeStopWords,
  extractTerms,
  simpleStem,
  TFIDFVectorizer,
  computeTFIDFSimilarity,
  extractNgrams,
  extractKeyPhrases,
  identifySkills,
  identifyExperienceRequirements,
  identifyEducationRequirements,
  identifyCertificationsRequirements,
  identifyResponsibilities,
  analyzeJobDescription,
  TECH_CATEGORIES,
};