/**
 * Automated Scoring Engine & Evaluation Engine Integration for Module 13.5
 * Calculates category breakdown, JD-criticality weighted score, and integrates with Module 20/21.
 */

function calculateResumeAptitudeScore(questions, answers, ladderState) {
  let totalScore = 0.0;
  let maxPossibleScore = 0.0;

  const categoryStats = {
    DSA: { score: 0, max: 0, count: 0, correct: 0 },
    SQL: { score: 0, max: 0, count: 0, correct: 0 },
    CORE_CS: { score: 0, max: 0, count: 0, correct: 0 },
    PROJECT_LADDER: { score: 0, max: 0, count: 0, correct: 0 }
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

    if (ansObj) {
      studentInput = ansObj.studentAnswer || '';
      isCorrect = Boolean(ansObj.isCorrect);
      sqlResult = ansObj.sqlResult || null;

      if (isCorrect) {
        marksObtained = maxMarks;
        categoryStats[cat].correct += 1;
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
      sqlResult
    });
  });

  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const passed = percentage >= 40.0;

  // JD-criticality weighted composite score
  // Weights: Project Ladder (40%), Core CS (25%), SQL Sandbox (20%), DSA (15%)
  const getCatPct = (catKey) => {
    const stat = categoryStats[catKey];
    return stat && stat.max > 0 ? (stat.score / stat.max) * 100 : 100;
  };

  const weightedCompositeScore = Math.round(
    (getCatPct('PROJECT_LADDER') * 0.40) +
    (getCatPct('CORE_CS') * 0.25) +
    (getCatPct('SQL') * 0.20) +
    (getCatPct('DSA') * 0.15)
  );

  return {
    totalScore: parseFloat(totalScore.toFixed(2)),
    maxPossibleScore: parseFloat(maxPossibleScore.toFixed(2)),
    percentage,
    weightedCompositeScore,
    passed,
    categoryBreakdown: {
      dsa: categoryStats.DSA,
      sql: categoryStats.SQL,
      coreCs: categoryStats.CORE_CS,
      projectLadder: categoryStats.PROJECT_LADDER
    },
    gradedAnswers
  };
}

module.exports = {
  calculateResumeAptitudeScore
};
