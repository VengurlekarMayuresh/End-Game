/**
 * Scoring Engine for Module 13.5 — Role-Specific Aptitude Round
 *
 * Question breakdown (total 15):
 *   DSA_CODE      → 2 questions × 2 marks each (based on test case pass rate)
 *   SQL           → 3 questions × 1.5 marks each
 *   CORE_CS       → 2 questions × 1.0 mark each
 *   PROJECT_LADDER→ 8 questions × variable marks (1.0 / 1.5 / 2.0 per level)
 *
 * DSA scoring: full marks if all 5 hidden test cases pass,
 *   else proportional (e.g. 3/5 passing → 60% of marks).
 */

function calculateResumeAptitudeScore(questions, answers, ladderState) {
  let totalScore = 0.0;
  let maxPossibleScore = 0.0;

  const categoryStats = {
    DSA_CODE: { score: 0, max: 0, count: 0, correct: 0, partialCredit: 0 },
    DSA:      { score: 0, max: 0, count: 0, correct: 0 }, // legacy compatibility
    SQL:      { score: 0, max: 0, count: 0, correct: 0 },
    CORE_CS:  { score: 0, max: 0, count: 0, correct: 0 },
    PROJECT_LADDER: { score: 0, max: 0, count: 0, correct: 0 },
  };

  const gradedAnswers = [];

  questions.forEach(q => {
    const qId = q.id;
    const cat = q.category || 'CORE_CS';
    const maxMarks = parseFloat(q.marks || 1.0);

    if (!categoryStats[cat]) {
      categoryStats[cat] = { score: 0, max: 0, count: 0, correct: 0 };
    }

    categoryStats[cat].count += 1;
    categoryStats[cat].max += maxMarks;
    maxPossibleScore += maxMarks;

    const ansObj = (answers || []).find(a => a.questionId === qId);
    let isCorrect = false;
    let marksObtained = 0.0;
    let studentInput = '';
    let sqlResult = null;
    let codeResult = null;
    let testCasesResult = null;

    if (ansObj) {
      studentInput = ansObj.studentAnswer || '';
      sqlResult = ansObj.sqlResult || null;
      codeResult = ansObj.codeResult || null;
      testCasesResult = ansObj.testCasesResult || null;

      if (cat === 'DSA_CODE') {
        // Score based on proportion of hidden test cases passed
        if (testCasesResult && testCasesResult.hiddenTotal > 0) {
          const passedHidden = testCasesResult.hiddenPassed || 0;
          const ratio = passedHidden / testCasesResult.hiddenTotal;
          marksObtained = parseFloat((maxMarks * ratio).toFixed(2));
          isCorrect = ratio >= 1.0;
          categoryStats[cat].partialCredit = (categoryStats[cat].partialCredit || 0) + marksObtained;
        } else if (ansObj.isCorrect) {
          // Fallback: if isCorrect was set manually
          marksObtained = maxMarks;
          isCorrect = true;
        }
      } else {
        isCorrect = Boolean(ansObj.isCorrect);
        if (isCorrect) {
          marksObtained = maxMarks;
        }
      }

      if (isCorrect || (cat === 'DSA_CODE' && marksObtained > 0)) {
        if (cat !== 'DSA_CODE') categoryStats[cat].correct += 1;
        else if (isCorrect) categoryStats[cat].correct += 1;
        categoryStats[cat].score += marksObtained;
        totalScore += marksObtained;
      }
    }

    gradedAnswers.push({
      questionId: qId,
      category: cat,
      topic: q.topic,
      level: q.level || 1,
      statement: q.statement,
      canonicalAnswer: q.canonicalAnswer,
      acceptedSynonyms: q.acceptedSynonyms,
      studentAnswer: studentInput,
      isCorrect,
      marksObtained,
      maxMarks,
      sqlResult,
      codeResult,
      testCasesResult,
    });
  });

  const percentage = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;
  const passed = percentage >= 40.0;

  // JD-criticality weighted composite score
  // Weights: Project Ladder (40%), Core CS (20%), SQL Sandbox (20%), DSA Code (20%)
  const getCatPct = (catKey) => {
    const stat = categoryStats[catKey] || categoryStats['DSA'];
    return stat && stat.max > 0 ? (stat.score / stat.max) * 100 : 100;
  };

  const dsaPct = getCatPct('DSA_CODE');

  const weightedCompositeScore = Math.round(
    (getCatPct('PROJECT_LADDER') * 0.40) +
    (getCatPct('CORE_CS')        * 0.20) +
    (getCatPct('SQL')            * 0.20) +
    (dsaPct                      * 0.20)
  );

  return {
    totalScore: parseFloat(totalScore.toFixed(2)),
    maxPossibleScore: parseFloat(maxPossibleScore.toFixed(2)),
    percentage,
    weightedCompositeScore,
    passed,
    categoryBreakdown: {
      dsaCode: categoryStats.DSA_CODE,
      sql: categoryStats.SQL,
      coreCs: categoryStats.CORE_CS,
      projectLadder: categoryStats.PROJECT_LADDER,
    },
    gradedAnswers,
  };
}

module.exports = {
  calculateResumeAptitudeScore,
};
