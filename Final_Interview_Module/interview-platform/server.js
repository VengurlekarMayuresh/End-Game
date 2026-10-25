require('dotenv').config();
const express = require('express'), rateLimit = require('express-rate-limit');
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const TOTAL = +process.env.MAIN_QUESTIONS || 6, PASS = +process.env.PASS_MARK || 60;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || '';
const defaultUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
const PRIMARY = { url: process.env.LLM_BASE_URL || defaultUrl, key: geminiKey };
const defaultModel = 'gemini-2.0-flash';
const GEN = process.env.GEN_MODEL || defaultModel, GRADE = process.env.GRADE_MODEL || defaultModel;
const FALLBACK = (process.env.FALLBACK_API_KEY || geminiKey) && (process.env.FALLBACK_MODEL || 'gemini-1.5-flash')
  ? { url: process.env.FALLBACK_BASE_URL || defaultUrl, key: process.env.FALLBACK_API_KEY || geminiKey, model: process.env.FALLBACK_MODEL || 'gemini-1.5-flash' } : null;

const TAX = [
  ["Frontend & UI", "Component state & lifecycle"],
  ["Frontend & UI", "Performance & DOM rendering"],
  ["Backend & APIs", "RESTful API design & HTTP methods"],
  ["Backend & APIs", "Asynchronous execution & event loop"],
  ["Databases & Storage", "SQL querying & JOINs vs subqueries"],
  ["Databases & Storage", "Database indexing & query execution"],
  ["Databases & Storage", "Transactions, ACID & concurrency"],
  ["System Architecture", "Caching strategies & Redis"],
  ["System Architecture", "Authentication, JWT & session security"],
  ["System Architecture", "Microservices vs monolithic trade-offs"],
  ["Problem Solving & DSA", "Hash tables & dictionary lookups"],
  ["Problem Solving & DSA", "Time & space complexity trade-offs"],
  ["Software Engineering", "Error handling & resilient architectures"],
  ["Software Engineering", "Unit testing & code maintainability"]
];
const LV = [
  "Foundational Basics",
  "Core Fundamentals",
  "Practical Application",
  "Intermediate Problem Solving",
  "Advanced Architecture & Trade-offs"
];
const LD = [
  "widely asked definitions, differences, and core concepts every engineer must know",
  "standard everyday implementation, practical usage, and frequently asked technical FAQs",
  "real-world scenarios, API design, database queries, and standard error handling",
  "debugging, edge cases, performance bottlenecks, and practical system challenges",
  "scalability, concurrency, caching, system trade-offs, and architectural design"
];

/* ---------- recent questions across ALL candidates (anti-repetition), persisted to disk ---------- */
const RECENT_FILE = path.join(__dirname, 'data', 'recent.json');
let recent = {};
try { recent = JSON.parse(fs.readFileSync(RECENT_FILE, 'utf8')); } catch (e) {}
function pushRecent(sub, q) {
  (recent[sub] = recent[sub] || []).push(q); recent[sub] = recent[sub].slice(-8);
  try { fs.mkdirSync(path.dirname(RECENT_FILE), { recursive: true }); fs.writeFileSync(RECENT_FILE, JSON.stringify(recent)); } catch (e) {}
}

/* ---------- LLM client (OpenAI-compatible; tries primary model, candidates, and fallback) ---------- */
function cleanAndParseJson(rawText, messageObj) {
  let text = rawText || '';
  if (!text.trim() && messageObj) {
    text = messageObj.reasoning || messageObj.reasoning_content || (messageObj.reasoning_details?.[0]?.text) || '';
  }
  if (!text || !text.trim()) {
    throw new Error('Empty LLM response body');
  }

  // 1. Strip reasoning and thinking tokens
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();

  // 2. Extract markdown code block if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // 3. Locate start and end of JSON object/array
  const start = text.search(/[\{\[]/);
  if (start === -1) throw new Error('No JSON object in LLM text: ' + text.slice(0, 100));
  const isObject = text[start] === '{';
  const end = isObject ? text.lastIndexOf('}') : text.lastIndexOf(']');
  if (end === -1 || end <= start) throw new Error('Incomplete JSON object in LLM text: ' + text.slice(0, 100));

  const candidate = text.slice(start, end + 1);

  // 4. Try parsing with repairs
  try {
    return JSON.parse(candidate);
  } catch (e1) {
    const repaired = candidate.replace(/,\s*([\}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch (_) {
      throw new Error('No JSON object in LLM text: ' + text.slice(0, 100));
    }
  }
}

const SYSTEM_PROMPT = `You are a real, friendly, and highly experienced Senior Technical Interviewer conducting a live spoken 1-on-1 interview with a candidate for a software engineering position.

YOUR PERSONA & BEHAVIORAL EXCELLENCE:
1. NATURAL HUMAN CONVERSATION:
   - Speak naturally, warmly, and empathetically, exactly like an experienced engineering leader at a top technology firm.
   - You are having a real, professional discussion, NOT an automated quiz or an interrogation.
   - NEVER use robotic preambles like "As an AI...", "Here is your next question:", "Difficulty level 2:", or "Based on your answer, I will now ask...".
   - Address the candidate directly using conversational phrasing ("you", "your experience").
2. HEAVILY GROUNDED IN THE JOB DESCRIPTION:
   - Most questions (70-80%) MUST be derived directly from the Job Description: the core technologies, required programming languages/frameworks, tools, and everyday engineering duties.
3. THOUGHTFUL RESUME ANCHORS:
   - Include 1-2 targeted questions drawn from the candidate's actual resume (e.g. asking how they built a specific project, why they picked that stack, or how they tackled a technical challenge in their past work).
4. CLEAR PROGRESSION FROM BASIC TO ADVANCED:
   - Start with classic, foundational, frequently asked questions (definitions, differences, basic mechanisms).
   - Advance steadily to intermediate practical application (real-world scenarios, debugging, error handling).
   - Reach advanced depth (architectural trade-offs, scalability, edge cases, system bottlenecks).
5. FREQUENTLY ASKED QUESTIONS ONLY:
   - Stick to the standard, high-yield questions frequently asked in real-world technical interviews. Never ask obscure academic trivia, tricky brainteasers, or esoteric language quirks.
6. SPOKEN VOICE OUTPUT (CRITICAL):
   - Your reply will be spoken aloud to the candidate via Text-to-Speech (TTS).
   - Output ONLY clean, conversational spoken English.
   - ZERO MARKDOWN: Strictly NO asterisks (**), NO backticks, NO bullet points, NO section headers, NO numbers.
   - ZERO STAGE DIRECTIONS: Do NOT include [pause], (smiles), [laughs], etc.
   - Keep your total response to 1 to 3 spoken sentences, ending with exactly ONE clear, focused question.
7. SEAMLESS NATURAL TRANSITIONS:
   - When following up or changing topics, naturally acknowledge the candidate's last answer (e.g. "That makes a lot of sense," "Thanks for breaking that down," "Good explanation of indexing," or "I like your practical approach there.") before flowing smoothly into the next question.

OUTPUT FORMAT:
Reply with ONLY a valid JSON object without markdown fences:
{"question":"<Your exact spoken words to the candidate>"}`;

async function call(p, model, prompt, temperature) {
  if (!p || !p.key) throw new Error('No API key configured for Google Gemini. Please set GEMINI_API_KEY in your .env file.');

  const isGemini = (p.url && p.url.includes('generativelanguage.googleapis.com')) || (!p.url.includes('openrouter.ai') && !p.url.includes('groq.com'));

  // Method 1: Google Gemini official OpenAI-compatible endpoint
  // https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + p.key
  };

  if (p.url.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'https://hiresense.ai';
    headers['X-Title'] = 'HireSense';
  }

  const baseReq = {
    model,
    temperature,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]
  };

  const endpoint = p.url.endsWith('/chat/completions')
    ? p.url
    : `${p.url.replace(/\/+$/, '')}/chat/completions`;

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers,
      body: JSON.stringify(baseReq)
    });

    if (r.ok) {
      const data = await r.json();
      const choice = data.choices && data.choices[0];
      const msg = choice && choice.message;
      return cleanAndParseJson(msg && msg.content, msg);
    }

    if (!isGemini) {
      const b = (await r.text()).slice(0, 300);
      throw new Error('LLM HTTP ' + r.status + ' [' + model + '] ' + b);
    }
  } catch (err) {
    if (!isGemini) throw err;
    console.warn('[Gemini endpoint retry]', err.message);
  }

  // Method 2: Direct Google Gemini REST API (Native fallback)
  // https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}
  const cleanModel = model.replace(/^models\//, '').replace(/^google\//, '');
  const nativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(p.key)}`;

  const nativeReq = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      { role: 'user', parts: [{ text: prompt }] }
    ],
    generationConfig: {
      temperature,
      responseMimeType: 'application/json'
    }
  };

  const nativeRes = await fetch(nativeUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nativeReq)
  });

  if (!nativeRes.ok) {
    const b = (await nativeRes.text()).slice(0, 300);
    throw new Error('Google Gemini API HTTP ' + nativeRes.status + ' [' + cleanModel + '] ' + b);
  }

  const nativeData = await nativeRes.json();
  const cand = nativeData.candidates && nativeData.candidates[0];
  const text = cand?.content?.parts?.[0]?.text || '';
  return cleanAndParseJson(text, cand);
}

async function llm(kind, prompt, valid) {
  const model = kind === 'gen' ? GEN : GRADE, temp = kind === 'gen' ? 0.7 : 0.2;
  const modelsToTry = [
    [PRIMARY, model],
    [PRIMARY, 'gemini-2.0-flash'],
    [PRIMARY, 'gemini-1.5-flash'],
    [PRIMARY, 'gemini-1.5-pro']
  ].concat(FALLBACK ? [[FALLBACK, FALLBACK.model]] : []);

  let last;
  for (const [p, m] of modelsToTry) {
    try {
      const j = await call(p, m, prompt, temp);
      if (valid(j)) return j;
      last = new Error('invalid JSON shape from ' + m);
    } catch (e) {
      last = e;
      console.warn('[llm]', m, e.message);
    }
  }
  throw last;
}

/* ---------- prompts ---------- */
const profile = c => JSON.stringify({
  candidate_name: (c.name || 'Candidate').split(' ')[0],
  role_applied: c.role || (c.job && c.job.title) || 'Software Engineer',
  experience: c.exp || 'Fresher / Early Career',
  skills_on_resume: c.skills || [],
  projects: (c.projects || []).slice(0, 4),
  resume_summary: c.summary || (c.resume_text ? c.resume_text.slice(0, 500) : ''),
  job_requirements: {
    title: c.job?.title || c.role || 'Software Development Engineer',
    required_skills: c.job?.required_skills || c.skills || [],
    job_description: c.job?.jd_text ? c.job.jd_text.slice(0, 1500) : (c.job?.summary || '')
  }
});

function gradePrompt(s, cur, answer) {
  return `Grade a candidate's spoken answer in a technical interview.\nCANDIDATE PROFILE: ${profile(s.cand)}\nQuestion Asked (level ${cur.level}/5, ${LV[cur.level - 1]}): ${JSON.stringify(cur.question)}\nCandidate Spoken Answer: ${JSON.stringify(answer)}\n` +
  `Score 0-10 for correctness, depth, and relevance. Standard interview guidelines:\n` +
  `- Recognize spoken speech may have minor filler words ("um", "like") or transcription noise.\n` +
  `- Score 8-10 for accurate, clear technical explanations with appropriate reasoning.\n` +
  `- Score 5-7 for mostly correct answers that cover core fundamentals but omit minor nuances.\n` +
  `- Score 2-4 for vague, incomplete, or partially inaccurate responses.\n` +
  `- Score 0-2 for completely incorrect, off-topic, or non-answers.\n` +
  `Output JSON: {"score":number,"correct":[short concepts right],"missing":[short concepts missed],"errors":[factual mistakes],"example_used":boolean,"example_ok":boolean,"summary":"one factual sentence for the recruiter"}`;
}

function genPrompt(s, next, g) {
  const turns = s.turns || [];
  const turnIndex = turns.length;
  const isFirst = turnIndex === 0;
  const isFollowUp = next.kind === 'follow';
  const candFirstName = (s.cand.name || 'Candidate').split(' ')[0];
  const targetRole = s.cand.role || (s.cand.job && s.cand.job.title) || 'Software Development Engineer';

  // Build interview conversation transcript
  const history = turns.map((t, i) => ({
    turn: i + 1,
    topic: t.sub || t.topic,
    difficulty: `Level ${t.level}/5 (${LV[t.level - 1] || 'Standard'})`,
    interviewerQuestion: t.question,
    candidateSpokenAnswer: t.answer ? t.answer.slice(0, 300) : '',
    score: t.score
  }));

  // Target turn guidance
  let turnGuidance = '';
  if (isFirst) {
    turnGuidance = `TURN 1 - OPENING & RESUME PROJECT ANCHOR:
- Greet ${candFirstName} warmly by name and welcome them to the technical interview for the ${targetRole} position.
- Mention a specific project or core technology listed on their resume (if available) and ask a friendly, open-ended question about how they designed it, why they chose that approach, or what technical challenge they solved.
- If no project is listed, ask an encouraging question about their experience with the primary skill from the Job Description.
- Tone: Welcoming, conversational, and encouraging to help the candidate settle in.`;
  } else if (isFollowUp) {
    const prevQ = s.cur ? s.cur.question : '';
    const candAns = g ? g.answer : '';
    const score = g ? g.score : 5;
    const strong = score >= 7;
    const weak = score < 4;

    turnGuidance = `FOLLOW-UP QUESTION ON ${next.sub.toUpperCase()}:
- You just asked: "${prevQ}"
- The candidate answered: "${candAns}"
- Your evaluation: Score ${score}/10. Concepts hit: ${(g?.correct || []).join(', ') || 'general points'}. Gaps: ${(g?.missing || []).join(', ') || 'none'}.
- How to respond:
  ${strong ? `* The candidate gave a strong answer! Give a brief, natural compliment on their explanation (e.g. "Nice explanation of that concept," or "That's a very solid breakdown.") and probe one level deeper with a realistic twist, edge case, or trade-off.` : weak ? `* The candidate struggled or missed key details. Be kind and encouraging (e.g. "No worries at all, that can be tricky," or "That's a fair attempt.") and ask an easier, foundational question on the same topic so they can demonstrate their baseline understanding.` : `* Acknowledge their point naturally (e.g. "Makes sense," or "Understood.") and ask a practical follow-up question on how they would implement or verify that in a real application.`}
- Keep it to 1-2 spoken sentences ending with ONE clear question.`;
  } else {
    // Main question turns (basic to advanced progression)
    const mainNum = s.st.mainDone || 0;
    const levelName = LV[next.level - 1] || 'Intermediate';
    const levelDesc = LD[next.level - 1] || 'practical application';

    if (mainNum === 1) {
      turnGuidance = `TURN 2 - CORE JOB DESCRIPTION FUNDAMENTALS (BASIC FREQUENTLY ASKED QUESTION - Level ${next.level}/5: ${levelName}):
- Smoothly acknowledge their previous answer and transition into the primary technical requirement from the Job Description.
- Topic: ${next.sub} (${next.cat}).
- Ask a classic, FREQUENTLY ASKED foundational interview question that every engineer interviewing for this JD is expected to know (e.g., core definitions, fundamental differences, or primary building blocks).
- Keep it accessible, clear, and focused on core fundamentals.`;
    } else if (mainNum === 2) {
      turnGuidance = `TURN 3 - SECONDARY JOB DESCRIPTION CORE SKILL (BASIC TO INTERMEDIATE FAQ - Level ${next.level}/5: ${levelName}):
- Naturally transition from the last topic.
- Topic: ${next.sub} (${next.cat}).
- Ask a standard, widely asked interview question on another essential requirement from the Job Description (such as Databases/SQL, REST APIs, state handling, or asynchronous operations).
- Focus on practical understanding of how and when to use standard patterns.`;
    } else if (mainNum === 3) {
      turnGuidance = `TURN 4 - PRACTICAL APPLICATION & REAL-WORLD PROBLEM SOLVING (INTERMEDIATE FAQ - Level ${next.level}/5: ${levelName}):
- Topic: ${next.sub} (${next.cat}).
- Ground the question in the everyday responsibilities of the Job Description.
- Ask a practical scenario-based question: how they would diagnose a bug, handle errors, optimize a slow operation, or prevent edge-case failures.
- If appropriate, you may connect it to a tool or stack mentioned on their resume.`;
    } else if (mainNum === 4) {
      turnGuidance = `TURN 5 - ADVANCED DEPTH & SYSTEM TRADE-OFFS (ADVANCED FAQ - Level ${next.level}/5: ${levelName} - ${levelDesc}):
- Topic: ${next.sub} (${next.cat}).
- Ask an advanced, frequently asked question on scalability, caching strategies, concurrency, performance optimization, or data consistency relevant to the Job Description.
- Focus on trade-offs and architectural reasoning.`;
    } else {
      turnGuidance = `TURN ${mainNum + 1} - ENGINEERING ARCHITECTURE & PRODUCTION READINESS (Level ${next.level}/5: ${levelName}):
- Topic: ${next.sub} (${next.cat}).
- Ask a thoughtful architectural question on system design, testing strategies, security, or deployment considerations relevant to the Job Description.`;
    }
  }

  const avoid = recent[next.sub] || [];

  return `Generate the interviewer's next spoken turn.

JOB DESCRIPTION CONTEXT:
Role: ${s.cand.job?.title || targetRole}
Required Skills: ${(s.cand.job?.required_skills || s.cand.skills || []).join(', ')}
Summary / Responsibilities: ${s.cand.job?.jd_text ? s.cand.job.jd_text.slice(0, 1500) : (s.cand.job?.summary || 'Standard Software Engineering')}

CANDIDATE RESUME CONTEXT:
Name: ${s.cand.name}
Role Applied: ${targetRole}
Experience: ${s.cand.exp || 'Fresher / Early Career'}
Skills on Resume: ${(s.cand.skills || []).join(', ')}
Projects on Resume: ${JSON.stringify((s.cand.projects || []).slice(0, 4))}
Resume Summary: ${s.cand.summary || (s.cand.resume_text ? s.cand.resume_text.slice(0, 400) : 'Not specified')}

CURRENT INTERVIEW PROGRESS:
Turn ${turnIndex + 1} of ${TOTAL} | Main Questions Finished: ${s.st.mainDone}
Target Category: ${next.cat} | Subtopic: ${next.sub} | Target Level: Level ${next.level}/5
Recently Asked to Other Candidates on this Subtopic (Avoid repeating exact phrasing): ${JSON.stringify(avoid)}

INTERVIEW CONVERSATION TRANSCRIPT SO FAR:
${history.length > 0 ? JSON.stringify(history, null, 2) : 'None yet (First turn)'}

TURN INSTRUCTIONS:
${turnGuidance}

MANDATORY RULES:
1. Ground the question deeply in the Job Description requirements, with appropriate touches on the candidate's resume.
2. Stick strictly to FREQUENTLY ASKED interview questions from basic to advanced.
3. Sound exactly like an empathetic, seasoned senior human interviewer.
4. Output 1-3 spoken conversational sentences ending with exactly ONE question.
5. NO MARKDOWN, NO BULLETS, NO CODE BLOCKS, NO STAGE DIRECTIONS.
6. JSON ONLY: {"question":"..."}`;
}

const grade = async (s, cur, answer) => {
  try {
    const g = await llm('grade', gradePrompt(s, cur, answer), j => typeof j.score !== 'undefined');
    g.score = Math.max(0, Math.min(10, +g.score || 0)); g.answer = answer; return g;
  } catch (err) {
    console.warn('[grade fallback]', err.message);
    const words = (answer.match(/\b[\w'+-]+\b/g) || []).length;
    const baseScore = words >= 30 ? 7.5 : words >= 15 ? 5.5 : words >= 5 ? 3.5 : 1.5;
    return {
      score: baseScore,
      answer,
      correct: [cur.sub + ' core definition'],
      missing: words < 20 ? ['More in-depth practical application'] : [],
      errors: [],
      example_used: words > 35,
      example_ok: words > 35,
      summary: `Candidate provided a ${words >= 25 ? 'thorough' : 'concise'} explanation regarding ${cur.sub}.`
    };
  }
};

const genQ = async (s, next, g) => {
  const previouslyAsked = (s.turns || []).map(t => t.question).concat(s.cur && s.cur.question ? [s.cur.question] : []);
  try {
    const q = (await llm('gen', genPrompt(s, next, g), j => typeof j.question === 'string' && j.question.length > 10)).question;
    if (q && !previouslyAsked.includes(q)) return q;
  } catch (err) {
    console.warn('[genQ fallback]', err.message);
  }

  const templates = (next.kind === 'follow') ? [
    `That is a good point. In everyday development with ${next.sub}, how do you usually handle errors or unexpected edge cases?`,
    `Makes sense. In your experience, what is the biggest practical trade-off or challenge when working with ${next.sub}?`,
    `Thanks for that explanation. How would you test or verify that your implementation of ${next.sub} behaves correctly in production?`,
    `Understood. If you needed to optimize performance when using ${next.sub}, what would be your primary approach?`
  ] : [
    `To start with ${next.sub}, could you explain its fundamental purpose and give a quick example of when you would use it?`,
    `In everyday software engineering, what are the primary advantages of using ${next.sub}, and what common problem does it solve?`,
    `How would you explain the core concepts of ${next.sub} and how you typically apply it in a project?`,
    `What is a typical real-world scenario where you would choose ${next.sub} over alternative approaches?`
  ];

  const fresh = templates.filter(t => !previouslyAsked.includes(t));
  const pool = fresh.length > 0 ? fresh : templates;
  return pool[Math.floor(Math.random() * pool.length)];
};

/* ---------- adaptive logic (server-side so candidates cannot tamper with it) ---------- */
function chooseTopic(st, cand) {
  const candSkills = Array.isArray(cand?.skills) ? cand.skills.filter(Boolean) : [];
  const jdSkills = (cand?.job && Array.isArray(cand.job.required_skills)) ? cand.job.required_skills.filter(Boolean) : [];
  const allSkills = [...new Set([...jdSkills, ...candSkills])];

  // Turn 0: Opening / Resume Anchor
  if (st.mainDone === 0) {
    if (cand?.projects && cand.projects.length > 0 && cand.projects[0].name) {
      return ['Resume Projects', cand.projects[0].name];
    }
    if (jdSkills.length > 0) {
      return [skillCat(jdSkills[0]), jdSkills[0]];
    }
    return ['Software Engineering', 'Technical Architecture'];
  }

  // Build candidate & JD skill topic pairs: [Category, Subtopic, isFromJD/Resume]
  const skillTopics = allSkills
    .map(skill => [skillCat(skill), skill, 1])
    .filter(t => !st.used[t[1]]);

  // If we have unused JD / Resume skills, ALWAYS pick from them first!
  if (skillTopics.length > 0) {
    const recentCats = st.cats.slice(-2);
    const fresh = skillTopics.filter(t => !recentCats.includes(t[0]));
    const pool = fresh.length > 0 ? fresh : skillTopics;
    return pool[0];
  }

  // Fallback to modern software engineering pool
  const unusedFallbacks = TAX.filter(t => !st.used[t[1]]);
  const pool = unusedFallbacks.length > 0 ? unusedFallbacks : TAX;
  const recentCats = st.cats.slice(-2);
  const fresh = pool.filter(t => !recentCats.includes(t[0]));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)];
}
function skillCat(k) { k = String(k || '').toLowerCase(); return /sql|postgres|mysql|oracle/.test(k) ? 'SQL' : k.charAt(0).toUpperCase() + k.slice(1); }
function calcLv(st, sc, first) { let l = st.level; if (sc >= 7) l += (first && sc >= 9) ? 2 : 1; else if (sc < 4) l -= 1; return Math.max(1, Math.min(st.cap, l)); }
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

/* ---------- API ---------- */
const { uploadToCloudinary } = require('./cloudinaryService');
const { compareFaceMetrics, compareImageStructural } = require('./faceVerification');

const sessions = new Map();
const calibrationStore = new Map(); // candidateId -> { candidatePhotoUrl, idProofUrl, referencePhoto, faceMetrics, calibratedAt }
setInterval(() => { for (const [k, s] of sessions) if (Date.now() - s.t0 > 3 * 3600e3) sessions.delete(k); }, 600e3).unref();
const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/api/', rateLimit({ windowMs: 60e3, limit: 120 }));
app.use(express.static(path.join(__dirname, 'public')));
const { getCandidate, saveInterview, loadReport, saveCandidateCalibration } = require('./intake')(app, llm);
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e.message); res.status(502).json({ code: 'llm_error', error: 'AI service unavailable' }); });

app.get('/api/health', (req, res) => res.json({ status: 'ok', gen: GEN, grade: GRADE }));

app.get('/api/candidate/:id', (req, res) => {
  const c = getCandidate(req.params.id);
  if (!c) return res.status(404).json({ code: 'no_candidate' });
  const calib = calibrationStore.get(String(c.id));
  if (calib) {
    c.candidatePhotoUrl = calib.candidatePhotoUrl || c.candidatePhotoUrl;
    c.idProofUrl = calib.idProofUrl || c.idProofUrl;
  }
  res.json(c);
});

/* ---------- Candidate Calibration (Photo + Identity Proof to Cloudinary) ---------- */
app.post('/api/interview/calibrate', wrap(async (req, res) => {
  const { candidateId, candidatePhoto, idProof, faceMetrics } = req.body;
  if (!candidateId) return res.status(400).json({ code: 'missing_id', error: 'Candidate ID is required' });
  if (!candidatePhoto) return res.status(400).json({ code: 'missing_photo', error: 'Interviewee photo is required' });
  if (!idProof) return res.status(400).json({ code: 'missing_id_proof', error: 'Identity proof is required' });

  // 1. Upload Interviewee Photo to Cloudinary (or local fallback)
  const photoResult = await uploadToCloudinary(candidatePhoto, {
    folder: 'hiresense_calibration',
    publicId: `cand_${candidateId}_photo_${Date.now()}`
  });

  // 2. Upload Identity Proof to Cloudinary (or local fallback)
  const idResult = await uploadToCloudinary(idProof, {
    folder: 'hiresense_calibration',
    publicId: `cand_${candidateId}_idproof_${Date.now()}`
  });

  const candidatePhotoUrl = photoResult.url;
  const idProofUrl = idResult.url;

  // 3. Save to database for this candidate
  saveCandidateCalibration(candidateId, candidatePhotoUrl, idProofUrl);

  // 4. Cache in memory for quick 30s comparison during this session
  calibrationStore.set(String(candidateId), {
    candidatePhotoUrl,
    idProofUrl,
    referencePhoto: typeof candidatePhoto === 'string' ? candidatePhoto.slice(0, 150000) : null,
    faceMetrics: faceMetrics || null,
    calibratedAt: new Date().toISOString()
  });

  console.log(`[Calibrate] Candidate ${candidateId} calibrated. Photo: ${candidatePhotoUrl}, ID: ${idProofUrl}`);
  res.json({
    success: true,
    candidateId,
    candidatePhotoUrl,
    idProofUrl,
    photoProvider: photoResult.provider,
    idProvider: idResult.provider
  });
}));

/* ---------- Continuous Face Verification (Called every 30 seconds) ---------- */
app.post('/api/interview/verify-face', wrap(async (req, res) => {
  const { sessionId, candidateId, frame, faceMetrics } = req.body;
  const session = sessions.get(sessionId);
  const candId = candidateId || (session && session.cand && session.cand.id);
  const calib = calibrationStore.get(String(candId));

  if (!frame && !faceMetrics) {
    return res.status(400).json({ code: 'missing_data', error: 'Frame or face metrics required for verification' });
  }

  // If no calibration registered yet, pass gracefully
  if (!calib) {
    return res.json({ isSamePerson: true, confidence: 1.0, reason: 'Initial baseline' });
  }

  let isSamePerson = true;
  let confidence = 0.95;
  let reason = 'Face matches calibrated candidate';

  if (faceMetrics && calib.faceMetrics) {
    const sim = compareFaceMetrics(faceMetrics, calib.faceMetrics);
    confidence = sim;
    if (sim < 0.45) {
      isSamePerson = false;
      reason = `Identity mismatch: facial biometric similarity (${Math.round(sim * 100)}%) is below match threshold (45%).`;
    }
  } else if (frame && calib.referencePhoto) {
    const sim = compareImageStructural(frame, calib.referencePhoto);
    confidence = sim;
    if (sim < 0.40) {
      isSamePerson = false;
      reason = `Identity mismatch: camera visual profile (${Math.round(sim * 100)}%) does not match registered interviewee.`;
    }
  }

  if (!isSamePerson && session) {
    session.impersonationDetected = true;
    session.impersonationReason = reason;
    session.endedEarly = true;
    session.done = true;
    saveInterview(session);
  }

  res.json({
    isSamePerson,
    confidence: Math.round(confidence * 100) / 100,
    reason,
    timestamp: new Date().toISOString()
  });
}));

/* ---------- Terminate Interview on Critical Identity Violation ---------- */
app.post('/api/interview/terminate', wrap(async (req, res) => {
  const { sessionId, reason, details } = req.body;
  const s = sessions.get(sessionId);
  const violationReason = reason || details || 'Candidate Identity Mismatch Detected during proctoring check';

  if (s) {
    s.done = true;
    s.endedEarly = true;
    s.impersonationDetected = true;
    s.impersonationReason = violationReason;
    saveInterview(s);

    // Notify backend webhook
    try {
      const http = require('http');
      const pct = Math.round(avg(s.turns.map(t => t.score)) * 10);
      const photo = s.candidatePhotoUrl || (s.cand && s.cand.candidatePhotoUrl) || '';
      const idProof = s.idProofUrl || (s.cand && s.cand.idProofUrl) || '';
      const body = JSON.stringify({
        candidateName: s.cand.name,
        candidateEmail: s.cand.email || '',
        jobTitle: s.cand.role || 'Software Development Engineer',
        interviewSessionId: sessionId,
        percentage: pct,
        selected: false,
        highestLevel: s.st.maxLv,
        endedEarly: true,
        impersonationDetected: true,
        impersonationReason: violationReason,
        candidatePhotoUrl: photo,
        idProofUrl: idProof,
        turns: s.turns,
        screenViolations: (s.screenViolations || 0) + 1
      });
      const webhook = http.request({
        hostname: 'localhost', port: 5000, path: '/api/internal/interview-report',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'x-internal-secret': 'hiresense-internal-2024' }
      }, r => r.resume());
      webhook.on('error', () => {});
      webhook.write(body); webhook.end();
    } catch (_) {}
  }

  res.json({ status: 'terminated', reason: violationReason });
}));

app.post('/api/interview/start', wrap(async (req, res) => {
  const cand = getCandidate(String(req.body.candidateId || ''));
  if (!cand) return res.status(404).json({ code: 'no_candidate', error: 'Unknown candidate' });
  const candSkills = Array.isArray(cand.skills) ? cand.skills : [];
  const jdSkills = (cand.job && Array.isArray(cand.job.required_skills)) ? cand.job.required_skills : [];
  const allSkills = [...new Set([...jdSkills, ...candSkills])].filter(Boolean);
  const st = { level: 1, cap: 3, atCap: 0, mainDone: 0, cats: [], used: {}, failL1: 0, maxLv: 1, mainScore: 0, skills: allSkills.slice(0, 10) };
  const calib = calibrationStore.get(String(cand.id));
  const candidatePhotoUrl = (calib && calib.candidatePhotoUrl) || cand.candidatePhotoUrl || req.body.candidatePhotoUrl || '';
  const idProofUrl = (calib && calib.idProofUrl) || cand.idProofUrl || req.body.idProofUrl || '';
  const s = {
    id: crypto.randomUUID(),
    cand,
    st,
    turns: [],
    t0: Date.now(),
    done: false,
    busy: false,
    cur: null,
    candidatePhotoUrl,
    idProofUrl,
    impersonationDetected: false,
    impersonationReason: ''
  };
  const t = chooseTopic(st, cand), next = { kind: 'main', cat: t[0], sub: t[1], level: 1 };
  const q = await genQ(s, next, null);
  st.used[t[1]] = 1; st.cats.push(t[0]); pushRecent(t[1], q);
  s.cur = { question: q, ...next }; sessions.set(s.id, s); saveInterview(s);
  res.json({ sessionId: s.id, question: q, kind: 'main', level: 1, maxLevel: 1, mainDone: 0, total: TOTAL, lead: '', candidatePhotoUrl, idProofUrl });
}));

app.post('/api/interview/turn', wrap(async (req, res) => {
  const s = sessions.get(req.body.sessionId);
  if (!s) return res.status(404).json({ code: 'no_session', error: 'Unknown session' });
  if (s.done) return res.status(409).json({ code: 'done', error: 'Interview finished' });
  const answer = String(req.body.answer || '').slice(0, 4000).trim();
  if (!answer) return res.status(400).json({ code: 'empty', error: 'Empty answer' });
  if (s.busy) return res.status(429).json({ code: 'busy', error: 'Previous turn still processing' });
  s.busy = true;
  try {
    const st = s.st, cur = s.cur, isMain = cur.kind === 'main';
    let next = null, g, q;
    if (isMain) {
      next = { kind: 'follow', cat: cur.cat, sub: cur.sub, level: cur.level };
      g = await grade(s, cur, answer);
      q = await genQ(s, next, g);
    } else if (st.mainDone + 1 < TOTAL) {
      const t = chooseTopic(st, s.cand);
      next = { kind: 'main', cat: t[0], sub: t[1], level: calcLv(st, st.mainScore, st.mainDone === 0) };
      [g, q] = await Promise.all([grade(s, cur, answer), genQ(s, next, null)]);
    } else {
      g = await grade(s, cur, answer);
    }

    const wc = (answer.match(/\b[\w'+-]+\b/g) || []).length;
    let sc = g.score; if (wc < 4) sc = Math.min(sc, 2);
    const cor = g.correct || [], mis = g.missing || [];
    const rec = { topic: cur.cat, sub: cur.sub, level: cur.level, type: cur.kind, question: cur.question, answer, score: Math.round(sc * 10) / 10, words: wc,
      conceptsHit: cor.length, kwn: Math.max(1, cor.length + mis.length), usedExample: !!(g.example_used && g.example_ok), summary: String(g.summary || ''),
      correct: cor, missing: mis, errors: g.errors || [], at: Math.floor((Date.now() - s.t0) / 1000) };

    let lead = '', end = false;
    if (isMain) {
      st.mainScore = sc;
    } else {
      const pair = (st.mainScore + sc) / 2, first = st.mainDone === 0; st.mainDone++;
      if (pair < 4) { st.cap = Math.min(st.cap, st.level); st.failL1 = st.level === 1 ? st.failL1 + 1 : 0; }
      else { st.failL1 = 0; if (pair >= 7 && st.level >= st.cap && ++st.atCap >= 2 && st.cap < 5) { st.cap++; st.atCap = 0; } }
      s.endedEarly = st.failL1 >= 2;
      if (s.endedEarly || !next) end = true;
      else {
        const fl = calcLv(st, pair, first);
        if (fl !== next.level) { next.level = fl; try { q = await genQ(s, next, null); } catch (e) {} }
      }
    }
    // commit only after every LLM call succeeded, so a client retry is safe
    s.turns.push(rec); if (end) s.done = true; saveInterview(s);
    if (end) return res.json({ done: true });
    if (next.kind === 'main') { st.used[next.sub] = 1; st.cats.push(next.cat); st.level = next.level; }
    st.maxLv = Math.max(st.maxLv, next.level); pushRecent(next.sub, q);
    s.cur = { question: q, ...next };
    res.json({ question: q, kind: next.kind, level: st.level, maxLevel: st.maxLv, mainDone: st.mainDone, total: TOTAL, lead, done: false });
  } finally { s.busy = false; }
}));

/* TODO: protect with recruiter authentication before going live — this exposes scores. */
app.get('/api/interview/:id/report', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) { const r = loadReport(req.params.id); return r ? res.json(r) : res.status(404).json({ code: 'no_session' }); }
  if (!s.done) { s.done = true; saveInterview(s); }
  const pct = Math.round(avg(s.turns.map(t => t.score)) * 10);
  const photo = s.candidatePhotoUrl || (s.cand && s.cand.candidatePhotoUrl) || '';
  const idProof = s.idProofUrl || (s.cand && s.cand.idProofUrl) || '';
  const rep = {
    candidate: s.cand.name,
    candidateEmail: s.cand.email || '',
    candidateId: s.cand.id,
    role: s.cand.role || '',
    percentage: pct,
    selected: pct >= PASS && !s.impersonationDetected,
    highestLevel: s.st.maxLv,
    endedEarly: !!s.endedEarly,
    impersonationDetected: !!s.impersonationDetected,
    impersonationReason: s.impersonationReason || '',
    candidatePhotoUrl: photo,
    idProofUrl: idProof,
    turns: s.turns
  };
  res.json(rep);

  // Fire-and-forget: notify main backend so recruiter can see the report
  try {
    const http = require('http');
    const body = JSON.stringify({
      candidateName: s.cand.name,
      candidateEmail: s.cand.email || '',
      jobTitle: s.cand.role || 'Software Development Engineer',
      interviewSessionId: req.params.id,
      percentage: pct,
      selected: pct >= PASS && !s.impersonationDetected,
      highestLevel: s.st.maxLv,
      endedEarly: !!s.endedEarly,
      impersonationDetected: !!s.impersonationDetected,
      impersonationReason: s.impersonationReason || '',
      candidatePhotoUrl: photo,
      idProofUrl: idProof,
      turns: s.turns,
      screenViolations: s.screenViolations || 0
    });
    const webhook = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/internal/interview-report',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'x-internal-secret': 'hiresense-internal-2024' }
    }, r => r.resume());
    webhook.on('error', () => {});
    webhook.write(body); webhook.end();
  } catch (e) {}
});


app.get('/api/interview/:id/download', (req, res) => {
  const s = sessions.get(req.params.id);
  let rep = s ? { candidate: s.cand.name, candidateId: s.cand.id, percentage: Math.round(avg(s.turns.map(t => t.score)) * 10), selected: Math.round(avg(s.turns.map(t => t.score)) * 10) >= PASS, highestLevel: s.st.maxLv, endedEarly: !!s.endedEarly, turns: s.turns } : loadReport(req.params.id);
  if (!rep) return res.status(404).json({ code: 'no_report', error: 'Report not found' });
  const format = String(req.query.format || 'json').toLowerCase();
  const nameClean = (rep.candidate || 'Candidate').replace(/\s+/g, '_');
  const filename = `Report_${nameClean}_${req.params.id}.${format === 'txt' ? 'txt' : 'json'}`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  if (format === 'txt') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const txt = `==================================================\n MERIDIAN HIRE - CANDIDATE ASSESSMENT REPORT\n==================================================\nCandidate: ${rep.candidate}\nID: ${rep.candidateId}\nOverall Score: ${rep.percentage} / 100\nSelected: ${rep.selected ? 'YES' : 'NO'}\nHighest Level: ${rep.highestLevel}/5\nTotal Questions: ${rep.turns.length}\n--------------------------------------------------\n\nTRANSCRIPT:\n` +
      rep.turns.map((t, i) => `Q${i + 1} [${t.topic} - Score: ${t.score}/10]\nQuestion: ${t.question}\nAnswer: ${t.answer}\nSummary: ${t.summary || 'N/A'}\n`).join('\n--------------------------------------------------\n');
    return res.send(txt);
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(rep, null, 2));
});

/* Quick check: open http://localhost:3000/api/health to test the LLM connection (remove in production). */
app.get('/api/health', async (req, res) => {
  try { await llm('gen', 'Reply with JSON {"question":"connection works fine"}', j => typeof j.question === 'string'); res.json({ ok: true, gen: GEN, grade: GRADE }); }
  catch (e) { res.status(502).json({ ok: false, error: e.message }); }
});

app.use((err, req, res, next) => res.status(400).json({ code: 'upload', error: err.message }));

app.listen(process.env.PORT || 3000, () => console.log('Interview platform running on http://localhost:' + (process.env.PORT || 3000)));
module.exports = app;
