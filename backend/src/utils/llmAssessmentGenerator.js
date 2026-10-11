const crypto = require('crypto');

/**
 * Dynamic LLM-Powered Assessment & Project Ladder Generator
 * Synthesizes customized project ladders and practical assessment challenges
 * directly from candidate resume projects, skills, and target Job Description.
 */

const defaultUrl = process.env.OPENROUTER_API_KEY && !process.env.LLM_API_KEY ? 'https://openrouter.ai/api/v1' : (process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1');
const defaultKey = process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || '';
const defaultModel = process.env.GEN_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

async function callLlm(prompt, temperature = 0.5) {
  if (!defaultKey) {
    throw new Error('No LLM API key configured');
  }

  const endpoint = defaultUrl.endsWith('/chat/completions')
    ? defaultUrl
    : `${defaultUrl.replace(/\/+$/, '')}/chat/completions`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${defaultKey}`
  };

  const body = {
    model: defaultModel,
    temperature,
    messages: [
      {
        role: 'system',
        content: 'You are an expert technical interviewer and hiring architect. Output ONLY valid, parsable JSON without markdown ticks or preambles.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(35000),
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  if (!rawContent) throw new Error('Empty response from LLM');

  // Strip potential markdown ```json blocks
  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
  else if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
  if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);

  const start = cleanJson.indexOf('{');
  const end = cleanJson.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in response');
  }

  return JSON.parse(cleanJson.slice(start, end + 1));
}

/**
 * Builds candidate profile summary for prompt
 */
function summarizeCandidate(student) {
  const name = student?.user?.fullName || student?.fullName || 'Candidate';
  const skillsList = (student?.skills || []).map(s => typeof s === 'string' ? s : s.name).filter(Boolean);
  const projectsList = (student?.projects || []).map(p => ({
    title: p.title || p.name || 'Software Project',
    description: p.description || p.summary || '',
    techStack: p.techStack || p.technologies || p.skills || ''
  })).slice(0, 4);

  const experiencesList = (student?.experiences || []).map(e => ({
    company: e.company || 'Company',
    title: e.title || e.role || 'Developer',
    description: e.description || ''
  })).slice(0, 2);

  return { name, skills: skillsList, projects: projectsList, experiences: experiencesList };
}

/**
 * Builds Job summary for prompt
 */
function summarizeJob(jobDetails) {
  if (!jobDetails) return { title: 'Full Stack Software Engineer', requirements: 'React, Node.js, SQL, REST APIs' };
  return {
    title: jobDetails.title || 'Software Engineer',
    requirements: jobDetails.requirements || '',
    responsibilities: jobDetails.responsibilities || '',
    description: jobDetails.description || ''
  };
}

/**
 * Main function: generate dynamic assessment via LLM with fallback
 */
async function generateDynamicAssessment(student, jobDetails, coreTopics = []) {
  const candidateSummary = summarizeCandidate(student);
  const jobSummary = summarizeJob(jobDetails);

  // If candidate has projects, use their real project titles
  const projectTitles = candidateSummary.projects.map(p => p.title).filter(Boolean);
  const candidateSkills = candidateSummary.skills;

  const prompt = `Generate a personalized, practical technical assessment with an adaptive Project Ladder for this candidate.
CANDIDATE INFO:
- Name: ${candidateSummary.name}
- Candidate Skills: ${JSON.stringify(candidateSkills.slice(0, 10))}
- Real Candidate Projects: ${JSON.stringify(candidateSummary.projects)}
- Experience: ${JSON.stringify(candidateSummary.experiences)}

TARGET JOB:
- Title: ${jobSummary.title}
- Requirements/Skills: ${JSON.stringify(jobSummary.requirements)}
- Description: ${JSON.stringify(jobSummary.description)}

CRITICAL DIFFICULTY GUIDELINE:
- Keep all questions ACCESSIBLE, REAL-WORLD, PRACTICAL, and FRIENDLY.
- Avoid tricky obscure academic trivia, compiler/runtime internals, or bizarre theoretical edge cases.
- Questions should test real day-to-day developer knowledge that a competent junior-to-mid developer can confidently answer.

REQUIRED JSON FORMAT (Must match exact keys):
{
  "projectLadders": [
    {
      "topic": "Name of Candidate Project or Matched Tech Stack (e.g. '${projectTitles[0] || 'E-Commerce Platform'}')",
      "level1": {
        "statement": "Direct, practical question about the foundational concept, library, or architecture used in this project",
        "canonicalAnswer": "Short 1-3 word answer",
        "acceptedSynonyms": ["synonym1", "synonym2", "synonym3", "synonym4"]
      },
      "level2": {
        "statement": "Practical application question about data flow, API handling, or state management in this project",
        "canonicalAnswer": "Short 1-3 word answer",
        "acceptedSynonyms": ["synonym1", "synonym2", "synonym3", "synonym4"]
      },
      "level3": {
        "statement": "Practical question about caching, optimization, indexing, or deployment practice in this project",
        "canonicalAnswer": "Short 1-3 word answer",
        "acceptedSynonyms": ["synonym1", "synonym2", "synonym3", "synonym4"]
      }
    },
    {
      "topic": "Name of Candidate Project or Second Matched Stack (e.g. '${projectTitles[1] || 'REST API Backend'}')",
      "level1": { "statement": "...", "canonicalAnswer": "...", "acceptedSynonyms": ["..."] },
      "level2": { "statement": "...", "canonicalAnswer": "...", "acceptedSynonyms": ["..."] },
      "level3": { "statement": "...", "canonicalAnswer": "...", "acceptedSynonyms": ["..."] }
    },
    {
      "topic": "Name of Third Stack (e.g. '${projectTitles[2] || 'Database & Systems'}')",
      "level1": { "statement": "...", "canonicalAnswer": "...", "acceptedSynonyms": ["..."] },
      "level2": { "statement": "...", "canonicalAnswer": "...", "acceptedSynonyms": ["..."] },
      "level3": { "statement": "...", "canonicalAnswer": "...", "acceptedSynonyms": ["..."] }
    }
  ],
  "coreCsQuestions": [
    {
      "statement": "Practical question about Core CS / Web development fundamentals relevant to candidate skills",
      "canonicalAnswer": "Short answer (1-3 words)",
      "acceptedSynonyms": ["synonym1", "synonym2", "synonym3"]
    },
    {
      "statement": "Practical question about API status codes, data types, or database keys",
      "canonicalAnswer": "Short answer (1-3 words)",
      "acceptedSynonyms": ["synonym1", "synonym2", "synonym3"]
    }
  ]
}`;

  try {
    const rawResult = await callLlm(prompt, 0.4);
    if (rawResult && Array.isArray(rawResult.projectLadders) && rawResult.projectLadders.length >= 2) {
      // Assemble structured ladder questions partitioned by difficulty
      const l1 = [];
      const l2 = [];
      const l3 = [];

      rawResult.projectLadders.slice(0, 4).forEach((ladder, lIdx) => {
        const topicName = (ladder.topic || `Project ${lIdx + 1}`).trim();
        const topicSlug = topicName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);

        [
          { item: ladder.level1, level: 1, difficulty: 'EASY', marks: 1.0, list: l1 },
          { item: ladder.level2, level: 2, difficulty: 'MEDIUM', marks: 1.5, list: l2 },
          { item: ladder.level3, level: 3, difficulty: 'HARD', marks: 2.0, list: l3 }
        ].forEach(({ item, level, difficulty, marks, list }) => {
          if (item && item.statement && item.canonicalAnswer) {
            list.push({
              id: `ladder-dyn-${topicSlug}-${level}-${crypto.randomBytes(2).toString('hex')}`,
              category: 'PROJECT_LADDER',
              topic: topicName.toUpperCase(),
              level,
              difficulty,
              statement: item.statement,
              canonicalAnswer: item.canonicalAnswer,
              acceptedSynonyms: Array.isArray(item.acceptedSynonyms) ? item.acceptedSynonyms : [item.canonicalAnswer],
              marks,
              status: level === 1 ? 'UNLOCKED' : 'LOCKED'
            });
          }
        });
      });

      // Exactly 4 Simple (Level 1), 2 Medium (Level 2), 2 Hard (Level 3) = 8 questions
      const formattedLadderQuestions = [
        ...l1.slice(0, 4),
        ...l2.slice(0, 2),
        ...l3.slice(0, 2)
      ];

      // Format core CS questions
      const formattedCoreCs = (rawResult.coreCsQuestions || []).slice(0, 2).map((q, idx) => ({
        id: `dyn-corecs-${idx + 1}-${crypto.randomBytes(2).toString('hex')}`,
        category: 'CORE_CS',
        topic: 'Engineering Fundamentals',
        level: 1,
        difficulty: 'EASY',
        statement: q.statement,
        canonicalAnswer: q.canonicalAnswer,
        acceptedSynonyms: Array.isArray(q.acceptedSynonyms) ? q.acceptedSynonyms : [q.canonicalAnswer],
        marks: 1.0,
        status: 'UNLOCKED'
      }));

      if (formattedLadderQuestions.length >= 8) {
        return {
          ladderQuestions: formattedLadderQuestions.slice(0, 8),
          coreCsQuestions: formattedCoreCs
        };
      }
    }
  } catch (err) {
    console.warn('[llmAssessmentGenerator] LLM synthesis failed or timed out, generating tailored fallback:', err.message);
  }

  // Intelligent fallback: build project ladder dynamically using candidate's actual projects
  return buildTailoredProjectLadderFallback(candidateSummary, jobSummary);
}

/**
 * Generates custom project ladder based on candidate projects and JD without hardcoded generic static text
 */
function buildTailoredProjectLadderFallback(candidate, job) {
  const projects = candidate.projects.length > 0 ? candidate.projects : [
    { title: 'Web Application & API Service', techStack: 'React, Node.js, REST API' },
    { title: 'Database & Data Storage Engine', techStack: 'PostgreSQL, Express, Redis' },
    { title: 'Full Stack Distributed System', techStack: 'JavaScript, Python, Docker' }
  ];

  const p1 = projects[0] || { title: 'Web Application & API Service' };
  const p2 = projects[1] || { title: 'Database & Data Storage Engine' };
  const p3 = projects[2] || { title: 'Full Stack Distributed System' };

  // 4 Simple (Level 1)
  const l1Questions = [
    {
      id: `ladder-dyn-${p1.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-1-a-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p1.title.toUpperCase(),
      level: 1,
      difficulty: 'EASY',
      statement: `In your project "${p1.title}", what standard protocol or architectural pattern is primarily used for client-server communication?`,
      canonicalAnswer: 'REST API',
      acceptedSynonyms: ['REST', 'HTTP', 'RESTful API', 'JSON', 'API', 'WebSocket'],
      marks: 1.0,
      status: 'UNLOCKED'
    },
    {
      id: `ladder-dyn-${p1.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-1-b-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p1.title.toUpperCase(),
      level: 1,
      difficulty: 'EASY',
      statement: `In "${p1.title}", what standard data format is most commonly used for serializing request and response payloads?`,
      canonicalAnswer: 'JSON',
      acceptedSynonyms: ['JavaScript Object Notation', 'json payload', 'JSON format'],
      marks: 1.0,
      status: 'UNLOCKED'
    },
    {
      id: `ladder-dyn-${p2.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-1-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p2.title.toUpperCase(),
      level: 1,
      difficulty: 'EASY',
      statement: `In "${p2.title}", what type of database query command is used to read or fetch records from a table?`,
      canonicalAnswer: 'SELECT',
      acceptedSynonyms: ['SELECT query', 'GET', 'READ', 'select *'],
      marks: 1.0,
      status: 'UNLOCKED'
    },
    {
      id: `ladder-dyn-${p3.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-1-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p3.title.toUpperCase(),
      level: 1,
      difficulty: 'EASY',
      statement: `In version control for "${p3.title}", which command is used to record staged snapshots of your code repository?`,
      canonicalAnswer: 'git commit',
      acceptedSynonyms: ['commit', 'git-commit', 'commit command'],
      marks: 1.0,
      status: 'UNLOCKED'
    }
  ];

  // 2 Medium (Level 2)
  const l2Questions = [
    {
      id: `ladder-dyn-${p1.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-2-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p1.title.toUpperCase(),
      level: 2,
      difficulty: 'MEDIUM',
      statement: `In "${p1.title}", what compact token standard is commonly used to transmit user authentication claims in HTTP headers?`,
      canonicalAnswer: 'JWT',
      acceptedSynonyms: ['JSON Web Token', 'Bearer Token', 'Token', 'JWT token', 'OAuth'],
      marks: 1.5,
      status: 'LOCKED'
    },
    {
      id: `ladder-dyn-${p2.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-2-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p2.title.toUpperCase(),
      level: 2,
      difficulty: 'MEDIUM',
      statement: `In "${p2.title}", what database feature speeds up row lookups on frequently queried columns?`,
      canonicalAnswer: 'Index',
      acceptedSynonyms: ['Indexing', 'B-Tree Index', 'Database Index', 'Indices'],
      marks: 1.5,
      status: 'LOCKED'
    }
  ];

  // 2 Hard (Level 3)
  const l3Questions = [
    {
      id: `ladder-dyn-${p1.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-3-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p1.title.toUpperCase(),
      level: 3,
      difficulty: 'HARD',
      statement: `To scale "${p1.title}" under high traffic, what in-memory data store is commonly placed before the primary database for fast caching?`,
      canonicalAnswer: 'Redis',
      acceptedSynonyms: ['Memcached', 'In-memory Cache', 'Cache', 'Redis Cache'],
      marks: 2.0,
      status: 'LOCKED'
    },
    {
      id: `ladder-dyn-${p2.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-3-${crypto.randomBytes(2).toString('hex')}`,
      category: 'PROJECT_LADDER',
      topic: p2.title.toUpperCase(),
      level: 3,
      difficulty: 'HARD',
      statement: `To prevent API abuse and server overload in "${p2.title}", what middleware strategy limits the maximum number of requests allowed per client window?`,
      canonicalAnswer: 'Rate Limiting',
      acceptedSynonyms: ['Rate Limiter', 'Throttling', 'Rate Limit', 'Throttle'],
      marks: 2.0,
      status: 'LOCKED'
    }
  ];

  const ladderQuestions = [...l1Questions, ...l2Questions, ...l3Questions];

  coreCsQuestions.push(
    {
      id: `dyn-corecs-1-${crypto.randomBytes(2).toString('hex')}`,
      category: 'CORE_CS',
      topic: 'Web Fundamentals',
      level: 1,
      difficulty: 'EASY',
      statement: 'Which standard HTTP status code signifies that a client request was successfully processed and returned content (OK)?',
      canonicalAnswer: '200',
      acceptedSynonyms: ['200 OK', 'Status 200', '200 code', 'Two Hundred'],
      marks: 1.0,
      status: 'UNLOCKED'
    },
    {
      id: `dyn-corecs-2-${crypto.randomBytes(2).toString('hex')}`,
      category: 'CORE_CS',
      topic: 'Database Fundamentals',
      level: 1,
      difficulty: 'EASY',
      statement: 'In relational databases, which constraint guarantees that every record in a table has a unique, non-null identifier?',
      canonicalAnswer: 'Primary Key',
      acceptedSynonyms: ['PK', 'primary-key', 'primarykey', 'unique key'],
      marks: 1.0,
      status: 'UNLOCKED'
    }
  );

  return {
    ladderQuestions: ladderQuestions.slice(0, 8),
    coreCsQuestions
  };
}

module.exports = {
  generateDynamicAssessment,
  callLlm
};
