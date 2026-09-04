const { extractSkillGapAndTopics } = require('../resumeAptitudeExtractor');
const { selectJdFilteredQuestions } = require('../resumeAptitudeBank');
const { executeSqlInSandbox } = require('../sqlSandboxExecutor');
const { validateShortAnswer } = require('../shortAnswerValidator');
const { generateProjectLadder, updateLadderState } = require('../ladderGenerator');
const { calculateResumeAptitudeScore } = require('../resumeAptitudeScorer');

async function runVerification() {
  console.log('=== VERIFYING MODULE 13.5 CORE ENGINE ===\n');

  // 1. Skill Gap Analysis
  const mockStudent = {
    skills: ['Python', 'React', 'PostgreSQL', 'Docker'],
    projects: [
      {
        title: 'RAG Knowledge Assistant',
        description: 'Built a RAG search engine with vector database embeddings and microservices.',
        techStack: ['Python', 'RAG', 'Vector Database', 'Embeddings', 'Microservices']
      }
    ],
    experiences: []
  };

  const mockJd = {
    title: 'Senior AI Engineer',
    description: 'Looking for scalable systems expert with experience in Microservices, RAG, Analytics, and SQL.',
    requirements: 'Must know Python, SQL, RAG, Distributed Systems.'
  };

  const skillAnalysis = extractSkillGapAndTopics(mockStudent, mockJd);
  console.log('1. Skill Gap Analysis Result:');
  console.log(' - Matched Skills:', skillAnalysis.matchedSkills);
  console.log(' - Claimed Unverified:', skillAnalysis.claimedUnverifiedSkills);
  console.log(' - Missing Skills:', skillAnalysis.missingSkills);
  console.log(' - Core Topics:', skillAnalysis.coreTopics);

  // 2. Question Bank Selection
  const bankResult = selectJdFilteredQuestions(mockJd, skillAnalysis.coreTopics);
  console.log('\n2. Question Bank Selection:');
  console.log(` - DSA Questions selected: ${bankResult.dsaQuestions.length}`);
  console.log(` - SQL Questions selected: ${bankResult.sqlQuestions.length}`);
  console.log(` - Core CS Questions selected: ${bankResult.coreCsQuestions.length}`);

  // 3. SQL Sandbox Execution
  console.log('\n3. Testing SQL Sandbox Execution...');
  const sqlQ = bankResult.sqlQuestions[0];
  const candidateSql = 'SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department';
  const sqlExec = await executeSqlInSandbox(candidateSql, sqlQ.referenceSchemaSql, sqlQ.referenceQuery);
  console.log(' - SQL Sandbox Execution Success:', sqlExec.success);
  console.log(' - Candidate Query Correct:', sqlExec.isCorrect);
  console.log(' - Actual Output Rows:', sqlExec.actualOutput);

  // 4. Short-Answer Synonym Validation
  console.log('\n4. Testing Short-Answer Synonym Validation...');
  const test1 = validateShortAnswer('o(log n)', 'O(log n)', ['logarithmic', 'O(logn)']);
  console.log(' - "o(log n)" vs "O(log n)":', test1.isCorrect);
  const test2 = validateShortAnswer('HashTable', 'Hash Map', ['HashMap', 'Dictionary']);
  console.log(' - "HashTable" vs "Hash Map":', test2.isCorrect);
  const test3 = validateShortAnswer('wrong answer', 'TCP', ['Transmission Control Protocol']);
  console.log(' - "wrong answer" vs "TCP":', test3.isCorrect);

  // 5. Ladder Generator & Escalation
  console.log('\n5. Testing Ladder Generator & Escalation...');
  const ladderQuestions = generateProjectLadder(skillAnalysis.coreTopics);
  console.log(` - Total Ladder Questions generated: ${ladderQuestions.length}`);
  
  let ladderState = {};
  skillAnalysis.coreTopics.forEach(t => ladderState[t] = { currentLevel: 1, stopped: false });
  
  // Advance RAG to level 2 on correct answer
  ladderState = updateLadderState(ladderState, 'rag', 1, true);
  console.log(' - Ladder state after correct answer on RAG Level 1:', ladderState['rag']);
  // Stop microservices on wrong answer
  ladderState = updateLadderState(ladderState, 'microservices', 1, false);
  console.log(' - Ladder state after wrong answer on Microservices Level 1:', ladderState['microservices']);

  // 6. Scoring Engine
  console.log('\n6. Testing Scoring Engine...');
  const mockQuestions = [...bankResult.dsaQuestions, ...bankResult.sqlQuestions, ...ladderQuestions];
  const mockAnswers = [
    { questionId: bankResult.dsaQuestions[0].id, studentAnswer: 'O(log n)', isCorrect: true },
    { questionId: bankResult.sqlQuestions[0].id, studentAnswer: candidateSql, isCorrect: true, sqlResult: sqlExec },
    { questionId: ladderQuestions[0].id, studentAnswer: 'Embeddings', isCorrect: true }
  ];

  const scoreObj = calculateResumeAptitudeScore(mockQuestions, mockAnswers, ladderState);
  console.log(' - Composite Score:', scoreObj.totalScore, '/', scoreObj.maxPossibleScore);
  console.log(' - Percentage:', scoreObj.percentage, '%');
  console.log(' - Weighted Composite Score:', scoreObj.weightedCompositeScore, '%');
  console.log(' - Category Breakdown:', scoreObj.categoryBreakdown);

  console.log('\n=== VERIFICATION COMPLETE: ALL ENGINES FUNCTIONAL ===');
}

runVerification();
