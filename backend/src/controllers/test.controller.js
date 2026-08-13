const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hasMailerConfig, sendMail, buildDecisionEmail } = require('../utils/mailer');
const proctoringCtrl = require('./proctoring.controller');

// Helper to shuffle array (Fisher-Yates)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[arr[j]]] = [arr[arr[j]], arr[i]];
  }
  return arr;
};

// ─── IN-MEMORY MOCK STORE FOR GRACEFUL DATABASE FALLBACKS ────────────────────
let mockQuestions = [
  {
    id: 'mock-q-1',
    recruiterId: 'mock-recruiter-id',
    statement: 'If a worker can build a wall in 5 hours, how many hours would it take 3 workers working at the same pace to build the same wall?',
    options: ['1.67 hours', '2.5 hours', '15 hours', '5 hours'],
    correctAnswer: '1.67 hours',
    explanation: 'Time taken = Total Work / Number of workers. So 5 / 3 = 1.67 hours.',
    category: 'Quantitative Aptitude',
    topic: 'Time and Work',
    difficulty: 'EASY',
    tags: ['math', 'work', 'speed'],
    marks: 1.0,
    negativeMarks: 0.25,
    estimatedTime: 60,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-q-2',
    recruiterId: 'mock-recruiter-id',
    statement: 'Which of the following is an antonym of "Diligent"?',
    options: ['Lazy', 'Hardworking', 'Careful', 'Smart'],
    correctAnswer: 'Lazy',
    explanation: 'Diligent means showing care and conscientiousness in ones work or duties. Lazy is the opposite.',
    category: 'Verbal Ability',
    topic: 'Antonyms',
    difficulty: 'EASY',
    tags: ['english', 'vocabulary'],
    marks: 1.0,
    negativeMarks: 0.25,
    estimatedTime: 30,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mock-q-3',
    recruiterId: 'mock-recruiter-id',
    statement: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?',
    options: ['(1/3)', '(1/8)', '(2/8)', '(1/16)'],
    correctAnswer: '(1/8)',
    explanation: 'This is a simple division series; each number is one-half of the previous number.',
    category: 'Logical Reasoning',
    topic: 'Number Series',
    difficulty: 'MEDIUM',
    tags: ['reasoning', 'math'],
    marks: 2.0,
    negativeMarks: 0.5,
    estimatedTime: 45,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let mockTests = [];
let mockTestAttempts = [];

// Helper to check if error is due to missing tables or columns
const isDbTableMissingError = (err) => {
  return err.code === 'P2021' || err.code === 'P2022' || err.message?.includes('relation') || err.message?.includes('does not exist');
};

// Proctoring: exam starts with this many total "strikes". Every tab-switch /
// window-switch / fullscreen-exit event consumes one. When the count hits 0,
// the exam is auto-submitted, disqualified, and scored as zero.
const MAX_VIOLATIONS = 5;

const buildViolationRemark = (tabViolations, fullscreenViolations) =>
  `Violation of exam rules: auto-submitted after ${tabViolations + fullscreenViolations} tab/window-switch violation(s) (limit ${MAX_VIOLATIONS}). Score recorded as zero.`;

// ─── QUESTIONS CRUD ───────────────────────────────────────────────────────────

const createQuestion = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

    const {
      statement, options, correctAnswer, explanation,
      category, topic, difficulty, tags, marks, negativeMarks,
      estimatedTime, status
    } = req.body;

    if (!statement || !options || options.length !== 4 || !correctAnswer || !category || !difficulty) {
      return res.status(400).json({ message: 'Missing required question fields (statement, 4 options, correctAnswer, category, difficulty)' });
    }

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const question = await prisma.question.create({
        data: {
          recruiterId: recruiter.id,
          statement,
          options,
          correctAnswer,
          explanation: explanation || null,
          category,
          topic: topic || null,
          difficulty,
          tags: tags || [],
          marks: parseFloat(marks) || 1.0,
          negativeMarks: parseFloat(negativeMarks) || 0.0,
          estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
          status: status || 'ACTIVE'
        }
      });
      return res.status(201).json(question);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table Question missing. Creating question in in-memory Mock store.');
        const question = {
          id: 'mock-q-' + Date.now(),
          recruiterId: recruiter?.id || 'mock-recruiter-id',
          statement,
          options,
          correctAnswer,
          explanation: explanation || null,
          category,
          topic: topic || null,
          difficulty,
          tags: tags || [],
          marks: parseFloat(marks) || 1.0,
          negativeMarks: parseFloat(negativeMarks) || 0.0,
          estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
          status: status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockQuestions.push(question);
        return res.status(201).json(question);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const bulkCreateQuestions = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'questions array is required' });
    }

    const results = {
      created: [],
      failed: []
    };

    for (const q of questions) {
      try {
        const {
          statement, options, correctAnswer, explanation,
          category, topic, difficulty, tags, marks, negativeMarks,
          estimatedTime, status
        } = q;

        if (!statement || !options || options.length !== 4 || !correctAnswer || !category || !difficulty) {
          results.failed.push({ question: q.statement || 'unknown', error: 'Missing required fields (statement, 4 options, correctAnswer, category, difficulty)' });
          continue;
        }

        if (!options.includes(correctAnswer)) {
          results.failed.push({ question: q.statement || 'unknown', error: 'correctAnswer must be one of the provided options' });
          continue;
        }

        if (!recruiter) {
          results.failed.push({ question: q.statement || 'unknown', error: 'Recruiter profile not found' });
          continue;
        }

        const question = await prisma.question.create({
          data: {
            recruiterId: recruiter.id,
            statement,
            options,
            correctAnswer,
            explanation: explanation || null,
            category,
            topic: topic || null,
            difficulty,
            tags: tags || [],
            marks: parseFloat(marks) || 1.0,
            negativeMarks: parseFloat(negativeMarks) || 0.0,
            estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
            status: status || 'ACTIVE'
          }
        });
        results.created.push(question);
      } catch (err) {
        results.failed.push({ question: q.statement || 'unknown', error: err.message });
      }
    }

    return res.status(201).json(results);
  } catch (error) { next(error); }
};

const getQuestions = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

    const { category, difficulty, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const where = { recruiterId: recruiter.id };

      // Auto-seed mock questions if database Question bank is empty for this recruiter
      const count = await prisma.question.count({ where: { recruiterId: recruiter.id } });
      if (count === 0) {
        console.log('Seeding mock questions into empty database Question table...');
        const seededQuestions = mockQuestions.map(q => ({
          statement: q.statement,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          category: q.category,
          topic: q.topic,
          difficulty: q.difficulty,
          tags: q.tags,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          estimatedTime: q.estimatedTime,
          recruiterId: recruiter.id
        }));
        await prisma.question.createMany({ data: seededQuestions });
      }

      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;
      if (search) {
        where.OR = [
          { statement: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      const [questions, total] = await prisma.$transaction([
        prisma.question.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: parseInt(limit)
        }),
        prisma.question.count({ where })
      ]);

      return res.json({
        questions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table Question missing. Listing from in-memory Mock store.');
        
        const filtered = mockQuestions.filter(q => {
          if (category && q.category !== category) return false;
          if (difficulty && q.difficulty !== difficulty) return false;
          if (search) {
            return q.statement.toLowerCase().includes(search.toLowerCase()) ||
                   q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
          }
          return true;
        });

        const paginated = filtered.slice(offset, offset + parseInt(limit));

        return res.json({
          questions: paginated,
          pagination: {
            total: filtered.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(filtered.length / parseInt(limit))
          }
        });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const getQuestionById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const question = await prisma.question.findFirst({
        where: { id, recruiterId: recruiter.id }
      });
      if (!question) return res.status(404).json({ message: 'Question not found' });
      return res.json(question);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const question = mockQuestions.find(x => x.id === id);
        if (!question) return res.status(404).json({ message: 'Question not found (Mock)' });
        return res.json(question);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    const {
      statement, options, correctAnswer, explanation,
      category, topic, difficulty, tags, marks, negativeMarks,
      estimatedTime, status
    } = req.body;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.question.findFirst({
        where: { id, recruiterId: recruiter.id }
      });
      if (!existing) return res.status(404).json({ message: 'Question not found' });

      const question = await prisma.question.update({
        where: { id },
        data: {
          statement: statement !== undefined ? statement : existing.statement,
          options: options !== undefined ? options : existing.options,
          correctAnswer: correctAnswer !== undefined ? correctAnswer : existing.correctAnswer,
          explanation: explanation !== undefined ? explanation : existing.explanation,
          category: category !== undefined ? category : existing.category,
          topic: topic !== undefined ? topic : existing.topic,
          difficulty: difficulty !== undefined ? difficulty : existing.difficulty,
          tags: tags !== undefined ? tags : existing.tags,
          marks: marks !== undefined ? parseFloat(marks) : existing.marks,
          negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : existing.negativeMarks,
          estimatedTime: estimatedTime !== undefined ? (estimatedTime ? parseInt(estimatedTime) : null) : existing.estimatedTime,
          status: status !== undefined ? status : existing.status
        }
      });
      return res.json(question);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockQuestions.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ message: 'Question not found (Mock)' });

        const updated = {
          ...mockQuestions[idx],
          statement: statement !== undefined ? statement : mockQuestions[idx].statement,
          options: options !== undefined ? options : mockQuestions[idx].options,
          correctAnswer: correctAnswer !== undefined ? correctAnswer : mockQuestions[idx].correctAnswer,
          explanation: explanation !== undefined ? explanation : mockQuestions[idx].explanation,
          category: category !== undefined ? category : mockQuestions[idx].category,
          topic: topic !== undefined ? topic : mockQuestions[idx].topic,
          difficulty: difficulty !== undefined ? difficulty : mockQuestions[idx].difficulty,
          tags: tags !== undefined ? tags : mockQuestions[idx].tags,
          marks: marks !== undefined ? parseFloat(marks) : mockQuestions[idx].marks,
          negativeMarks: negativeMarks !== undefined ? parseFloat(negativeMarks) : mockQuestions[idx].negativeMarks,
          estimatedTime: estimatedTime !== undefined ? (estimatedTime ? parseInt(estimatedTime) : null) : mockQuestions[idx].estimatedTime,
          status: status !== undefined ? status : mockQuestions[idx].status,
          updatedAt: new Date()
        };
        mockQuestions[idx] = updated;
        return res.json(updated);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.question.findFirst({
        where: { id, recruiterId: recruiter.id }
      });
      if (!existing) return res.status(404).json({ message: 'Question not found' });

      await prisma.question.delete({ where: { id } });
      return res.json({ message: 'Question deleted successfully from Question Bank' });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockQuestions.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ message: 'Question not found (Mock)' });
        mockQuestions.splice(idx, 1);
        return res.json({ message: 'Question deleted successfully from in-memory Mock store' });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

// ─── TESTS CRUD ───────────────────────────────────────────────────────────────

const createTest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

    const {
      name, description, instructions, duration, passingPercentage,
      maxAttempts, negativeMarking, marksPerQuestion, randomQuestionOrder,
      randomOptionOrder, numQuestions, startDate, endDate, status, questionIds
    } = req.body;

    if (!name || !duration) {
      return res.status(400).json({ message: 'Missing required test fields (name, duration)' });
    }

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const test = await prisma.test.create({
        data: {
          recruiterId: recruiter.id,
          name,
          description: description || null,
          instructions: instructions || null,
          duration: parseInt(duration),
          passingPercentage: parseFloat(passingPercentage) || 40.0,
          maxAttempts: parseInt(maxAttempts) || 1,
          negativeMarking: negativeMarking === true || negativeMarking === 'true',
          marksPerQuestion: parseFloat(marksPerQuestion) || 1.0,
          randomQuestionOrder: randomQuestionOrder === true || randomQuestionOrder === 'true',
          randomOptionOrder: randomOptionOrder === true || randomOptionOrder === 'true',
          numQuestions: numQuestions ? parseInt(numQuestions) : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: status || 'DRAFT'
        }
      });

      if (questionIds && Array.isArray(questionIds)) {
        const testQuestionsData = questionIds.map(qId => ({
          testId: test.id,
          questionId: qId
        }));
        if (testQuestionsData.length > 0) {
          await prisma.testQuestion.createMany({ data: testQuestionsData });
        }
      }

      return res.status(201).json(test);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table Test missing. Creating test in in-memory Mock store.');
        const test = {
          id: 'mock-t-' + Date.now(),
          recruiterId: recruiter?.id || 'mock-recruiter-id',
          name,
          description: description || null,
          instructions: instructions || null,
          duration: parseInt(duration),
          passingPercentage: parseFloat(passingPercentage) || 40.0,
          maxAttempts: parseInt(maxAttempts) || 1,
          negativeMarking: negativeMarking === true || negativeMarking === 'true',
          marksPerQuestion: parseFloat(marksPerQuestion) || 1.0,
          randomQuestionOrder: randomQuestionOrder === true || randomQuestionOrder === 'true',
          randomOptionOrder: randomOptionOrder === true || randomOptionOrder === 'true',
          numQuestions: numQuestions ? parseInt(numQuestions) : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: status || 'DRAFT',
          questionIds: questionIds || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          // mock relations
          jobs: [],
          _count: { testQuestions: (questionIds || []).length, attempts: 0 }
        };
        mockTests.push(test);
        return res.status(201).json(test);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const getTests = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const tests = await prisma.test.findMany({
        where: { recruiterId: recruiter.id },
        include: {
          jobs: { select: { id: true, title: true } },
          _count: { select: { testQuestions: true, attempts: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(tests);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table Test missing. Listing from in-memory Mock store.');
        return res.json(mockTests);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const getTestById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const test = await prisma.test.findFirst({
        where: { id, recruiterId: recruiter.id },
        include: {
          jobs: { select: { id: true, title: true } },
          testQuestions: { include: { question: true } }
        }
      });
      if (!test) return res.status(404).json({ message: 'Test not found' });
      return res.json(test);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const test = mockTests.find(x => x.id === id);
        if (!test) return res.status(404).json({ message: 'Test not found (Mock)' });
        
        // Populate selected questions from mock bank
        const populatedQuestions = test.questionIds.map(qId => {
          const q = mockQuestions.find(x => x.id === qId);
          return q ? { question: q } : null;
        }).filter(Boolean);

        return res.json({
          ...test,
          testQuestions: populatedQuestions
        });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const updateTest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    const {
      name, description, instructions, duration, passingPercentage,
      maxAttempts, negativeMarking, marksPerQuestion, randomQuestionOrder,
      randomOptionOrder, numQuestions, startDate, endDate, status, questionIds
    } = req.body;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.test.findFirst({
        where: { id, recruiterId: recruiter.id }
      });
      if (!existing) return res.status(404).json({ message: 'Test not found' });

      const test = await prisma.test.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existing.name,
          description: description !== undefined ? description : existing.description,
          instructions: instructions !== undefined ? instructions : existing.instructions,
          duration: duration !== undefined ? parseInt(duration) : existing.duration,
          passingPercentage: passingPercentage !== undefined ? parseFloat(passingPercentage) : existing.passingPercentage,
          maxAttempts: maxAttempts !== undefined ? parseInt(maxAttempts) : existing.maxAttempts,
          negativeMarking: negativeMarking !== undefined ? (negativeMarking === true || negativeMarking === 'true') : existing.negativeMarking,
          marksPerQuestion: marksPerQuestion !== undefined ? parseFloat(marksPerQuestion) : existing.marksPerQuestion,
          randomQuestionOrder: randomQuestionOrder !== undefined ? (randomQuestionOrder === true || randomQuestionOrder === 'true') : existing.randomQuestionOrder,
          randomOptionOrder: randomOptionOrder !== undefined ? (randomOptionOrder === true || randomOptionOrder === 'true') : existing.randomOptionOrder,
          numQuestions: numQuestions !== undefined ? (numQuestions ? parseInt(numQuestions) : null) : existing.numQuestions,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
          status: status !== undefined ? status : existing.status
        }
      });

      if (questionIds && Array.isArray(questionIds)) {
        await prisma.testQuestion.deleteMany({ where: { testId: id } });
        const testQuestionsData = questionIds.map(qId => ({
          testId: id,
          questionId: qId
        }));
        if (testQuestionsData.length > 0) {
          await prisma.testQuestion.createMany({ data: testQuestionsData });
        }
      }

      return res.json(test);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockTests.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ message: 'Test not found (Mock)' });

        const updated = {
          ...mockTests[idx],
          name: name !== undefined ? name : mockTests[idx].name,
          description: description !== undefined ? description : mockTests[idx].description,
          instructions: instructions !== undefined ? instructions : mockTests[idx].instructions,
          duration: duration !== undefined ? parseInt(duration) : mockTests[idx].duration,
          passingPercentage: passingPercentage !== undefined ? parseFloat(passingPercentage) : mockTests[idx].passingPercentage,
          maxAttempts: maxAttempts !== undefined ? parseInt(maxAttempts) : mockTests[idx].maxAttempts,
          negativeMarking: negativeMarking !== undefined ? (negativeMarking === true || negativeMarking === 'true') : mockTests[idx].negativeMarking,
          marksPerQuestion: marksPerQuestion !== undefined ? parseFloat(marksPerQuestion) : mockTests[idx].marksPerQuestion,
          randomQuestionOrder: randomQuestionOrder !== undefined ? (randomQuestionOrder === true || randomQuestionOrder === 'true') : mockTests[idx].randomQuestionOrder,
          randomOptionOrder: randomOptionOrder !== undefined ? (randomOptionOrder === true || randomOptionOrder === 'true') : mockTests[idx].randomOptionOrder,
          numQuestions: numQuestions !== undefined ? (numQuestions ? parseInt(numQuestions) : null) : mockTests[idx].numQuestions,
          startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : mockTests[idx].startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : mockTests[idx].endDate,
          status: status !== undefined ? status : mockTests[idx].status,
          questionIds: questionIds !== undefined ? questionIds : mockTests[idx].questionIds,
          updatedAt: new Date()
        };
        updated._count = { testQuestions: updated.questionIds.length, attempts: 0 };
        mockTests[idx] = updated;
        return res.json(updated);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const deleteTest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.test.findFirst({
        where: { id, recruiterId: recruiter.id }
      });
      if (!existing) return res.status(404).json({ message: 'Test not found' });

      await prisma.test.delete({ where: { id } });
      return res.json({ message: 'Test deleted successfully' });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockTests.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ message: 'Test not found (Mock)' });
        mockTests.splice(idx, 1);
        return res.json({ message: 'Test deleted successfully from in-memory Mock store' });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const duplicateTest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.test.findFirst({
        where: { id, recruiterId: recruiter.id },
        include: { testQuestions: true }
      });
      if (!existing) return res.status(404).json({ message: 'Test not found' });

      const test = await prisma.test.create({
        data: {
          recruiterId: recruiter.id,
          name: `${existing.name} (Copy)`,
          description: existing.description,
          instructions: existing.instructions,
          duration: existing.duration,
          passingPercentage: existing.passingPercentage,
          maxAttempts: existing.maxAttempts,
          negativeMarking: existing.negativeMarking,
          marksPerQuestion: existing.marksPerQuestion,
          randomQuestionOrder: existing.randomQuestionOrder,
          randomOptionOrder: existing.randomOptionOrder,
          numQuestions: existing.numQuestions,
          status: 'DRAFT'
        }
      });

      const testQuestionsData = existing.testQuestions.map(q => ({
        testId: test.id,
        questionId: q.questionId
      }));

      if (testQuestionsData.length > 0) {
        await prisma.testQuestion.createMany({ data: testQuestionsData });
      }

      return res.status(201).json(test);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const existing = mockTests.find(x => x.id === id);
        if (!existing) return res.status(404).json({ message: 'Test not found (Mock)' });

        const duplicated = {
          ...existing,
          id: 'mock-t-' + Date.now(),
          name: `${existing.name} (Copy)`,
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { testQuestions: existing.questionIds.length, attempts: 0 }
        };
        mockTests.push(duplicated);
        return res.status(201).json(duplicated);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const publishTest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.test.findFirst({ where: { id, recruiterId: recruiter.id } });
      if (!existing) return res.status(404).json({ message: 'Test not found' });

      const updated = await prisma.test.update({
        where: { id },
        data: { status: 'PUBLISHED' }
      });
      return res.json(updated);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockTests.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ message: 'Test not found (Mock)' });
        mockTests[idx].status = 'PUBLISHED';
        return res.json(mockTests[idx]);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const archiveTest = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const existing = await prisma.test.findFirst({ where: { id, recruiterId: recruiter.id } });
      if (!existing) return res.status(404).json({ message: 'Test not found' });

      const updated = await prisma.test.update({
        where: { id },
        data: { status: 'ARCHIVED' }
      });
      return res.json(updated);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockTests.findIndex(x => x.id === id);
        if (idx === -1) return res.status(404).json({ message: 'Test not found (Mock)' });
        mockTests[idx].status = 'ARCHIVED';
        return res.json(mockTests[idx]);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const assignTestToJobs = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params; // testId
    const { jobIds } = req.body; // array of jobIds

    if (!Array.isArray(jobIds)) {
      return res.status(400).json({ message: 'jobIds must be an array' });
    }

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const test = await prisma.test.findFirst({ where: { id, recruiterId: recruiter.id } });
      if (!test) return res.status(404).json({ message: 'Test not found' });

      await prisma.job.updateMany({
        where: { recruiterId: recruiter.id, testId: id, id: { notIn: jobIds } },
        data: { testId: null }
      });

      await prisma.job.updateMany({
        where: { recruiterId: recruiter.id, id: { in: jobIds } },
        data: { testId: id }
      });

      return res.json({ message: 'Test successfully assigned to selected jobs' });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table relation Job.testId missing. Setting mock assignment on Test record.');
        const test = mockTests.find(x => x.id === id);
        if (!test) return res.status(404).json({ message: 'Test not found (Mock)' });
        
        let assignedJobs = [];
        try {
          const dbJobs = await prisma.job.findMany({ where: { id: { in: jobIds } } });
          assignedJobs = dbJobs.map(j => ({ id: j.id, title: j.title }));
        } catch (e) {
          assignedJobs = jobIds.map(jid => ({ id: jid, title: 'Software Engineer Position' }));
        }

        test.jobs = assignedJobs;
        return res.json({ message: 'Test successfully assigned to selected jobs (Mock)' });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

// ─── RECRUITER ANALYTICS & RESULTS ────────────────────────────────────────────

const getTestResults = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const test = await prisma.test.findFirst({ where: { id, recruiterId: recruiter.id } });
      if (!test) return res.status(404).json({ message: 'Test not found' });

      const attempts = await prisma.testAttempt.findMany({
        where: { testId: id },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true, profilePicture: true } }
            }
          },
          proctoringSession: {
            include: {
              events: true
            }
          }
        },
        orderBy: { completedAt: 'desc' }
      });
      const filledAttempts = attempts.map(att => ({
        ...att,
        violationInfo: {
          tabViolations: att.tabViolations,
          fullscreenViolations: att.fullscreenViolations,
          disqualified: att.disqualified || false,
          remark: att.remark || null
        },
        proctoringSession: att.proctoringSession || null
      }));
      return res.json(filledAttempts);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const attempts = mockTestAttempts.filter(x => x.testId === id);
        const filled = attempts.map(att => {
          const procSess = proctoringCtrl.mockProctoringSessions.find(s => s.testAttemptId === att.id);
          const events = procSess ? proctoringCtrl.mockProctoringEvents.filter(e => e.sessionId === procSess.id) : [];
          return {
            ...att,
            violationInfo: {
              tabViolations: att.tabViolations,
              fullscreenViolations: att.fullscreenViolations,
              disqualified: att.disqualified || false,
              remark: att.remark || null
            },
            proctoringSession: procSess ? { ...procSess, events } : null
          };
        });
        return res.json(filled);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const sendTestResultEmails = async (req, res, next) => {
  try {
    if (!hasMailerConfig()) {
      return res.status(400).json({
        message: 'Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM before sending emails.'
      });
    }

    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });

    const { id } = req.params;
    const { threshold, metric = 'percentage' } = req.body || {};
    const parsedThreshold = Number(threshold);

    if (!Number.isFinite(parsedThreshold)) {
      return res.status(400).json({ message: 'threshold must be a valid number' });
    }

    const test = await prisma.test.findFirst({
      where: { id, recruiterId: recruiter.id },
      select: { id: true, name: true, recruiter: { select: { companyName: true } } }
    });

    if (!test) return res.status(404).json({ message: 'Test not found' });

    const attempts = await prisma.testAttempt.findMany({
      where: { testId: id, status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] } },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, profilePicture: true } }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    const latestByStudent = new Map();
    attempts.forEach(attempt => {
      if (!latestByStudent.has(attempt.studentId)) {
        latestByStudent.set(attempt.studentId, attempt);
      }
    });

    const recipients = [...latestByStudent.values()].map(attempt => {
      const scoreValue = metric === 'score' ? attempt.score : attempt.percentage;
      const selected = scoreValue >= parsedThreshold;
      return {
        studentName: attempt.student?.user?.fullName || 'Candidate',
        studentEmail: attempt.student?.user?.email,
        selected,
        thresholdLabel: metric === 'score' ? `${parsedThreshold} marks` : `${parsedThreshold}%`,
        scoreLabel: metric === 'score'
          ? `${attempt.score} marks`
          : `${attempt.percentage}% (${attempt.score} marks)`,
      };
    }).filter(item => item.studentEmail);

    const sendResults = await Promise.allSettled(recipients.map(recipient => {
      const mail = buildDecisionEmail({
        candidateName: recipient.studentName,
        recruiterName: test.recruiter?.companyName || recruiter.companyName || 'Hiring Team',
        assessmentName: test.name,
        thresholdLabel: recipient.thresholdLabel,
        scoreLabel: recipient.scoreLabel,
        selected: recipient.selected,
      });

      return sendMail({
        to: recipient.studentEmail,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    }));

    return res.json({
      message: 'Decision emails processed',
      total: recipients.length,
      sent: sendResults.filter(r => r.status === 'fulfilled').length,
      failed: sendResults.filter(r => r.status === 'rejected').length,
      selected: recipients.filter(r => r.selected).length,
      rejected: recipients.filter(r => !r.selected).length,
      metric,
      threshold: parsedThreshold,
    });
  } catch (error) { next(error); }
};

const getTestAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const recruiter = await prisma.recruiter.findUnique({ where: { userId } });
    const { id } = req.params;

    try {
      if (!recruiter) return res.status(403).json({ message: 'Recruiter profile not found' });
      const test = await prisma.test.findFirst({ where: { id, recruiterId: recruiter.id } });
      if (!test) return res.status(404).json({ message: 'Test not found' });

      const attempts = await prisma.testAttempt.findMany({
        where: { testId: id, status: { in: ['COMPLETED', 'AUTO_SUBMITTED'] } }
      });

      const totalAttempts = attempts.length;
      if (totalAttempts === 0) {
        return res.json({
          totalAttempts: 0,
          averageScore: 0,
          averagePercentage: 0,
          passPercentageRate: 0,
          passCount: 0,
          failCount: 0,
          averageTimeTaken: 0,
          categoryPerformance: {},
          difficultyPerformance: {},
          violationCounts: []
        });
      }

      let sumScore = 0;
      let sumPercentage = 0;
      let passCount = 0;
      let sumTime = 0;
      const catPerf = {};
      const diffPerf = {};

      attempts.forEach(att => {
        sumScore += att.score;
        sumPercentage += att.percentage;
        if (att.passed) passCount++;
        sumTime += att.timeTaken || 0;

        if (att.categoryBreakdown) {
          const bd = att.categoryBreakdown;
          Object.keys(bd).forEach(cat => {
            if (!catPerf[cat]) catPerf[cat] = { score: 0, maxScore: 0, count: 0 };
            catPerf[cat].score += bd[cat].score;
            catPerf[cat].maxScore += bd[cat].maxScore;
            catPerf[cat].count++;
          });
        }

        if (att.difficultyBreakdown) {
          const bd = att.difficultyBreakdown;
          Object.keys(bd).forEach(diff => {
            if (!diffPerf[diff]) diffPerf[diff] = { score: 0, maxScore: 0, count: 0 };
            diffPerf[diff].score += bd[diff].score;
            diffPerf[diff].maxScore += bd[diff].maxScore;
            diffPerf[diff].count++;
          });
        }
      });

      const categoryPerformance = {};
      Object.keys(catPerf).forEach(cat => {
        categoryPerformance[cat] = {
          averagePercentage: catPerf[cat].maxScore > 0 ? (catPerf[cat].score / catPerf[cat].maxScore) * 100 : 0
        };
      });

      const difficultyPerformance = {};
      Object.keys(diffPerf).forEach(diff => {
        difficultyPerformance[diff] = {
          averagePercentage: diffPerf[diff].maxScore > 0 ? (diffPerf[diff].score / diffPerf[diff].maxScore) * 100 : 0
        };
      });

      return res.json({
        totalAttempts,
        averageScore: sumScore / totalAttempts,
        averagePercentage: sumPercentage / totalAttempts,
        passPercentageRate: (passCount / totalAttempts) * 100,
        passCount,
        failCount: totalAttempts - passCount,
        averageTimeTaken: sumTime / totalAttempts,
        categoryPerformance,
        difficultyPerformance,
        violationCounts: attempts.map(att => ({
          tabViolations: att.tabViolations,
          fullscreenViolations: att.fullscreenViolations
        }))
      });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const attempts = mockTestAttempts.filter(x => x.testId === id && x.status !== 'IN_PROGRESS');
        const totalAttempts = attempts.length;
        if (totalAttempts === 0) {
          return res.json({
            totalAttempts: 0,
            averageScore: 0,
            averagePercentage: 0,
            passPercentageRate: 0,
            passCount: 0,
            failCount: 0,
            averageTimeTaken: 0,
            categoryPerformance: {},
            difficultyPerformance: {},
            violationCounts: []
          });
        }

        let sumScore = 0;
        let sumPercentage = 0;
        let passCount = 0;
        let sumTime = 0;
        const catPerf = {};
        const diffPerf = {};

        attempts.forEach(att => {
          sumScore += att.score;
          sumPercentage += att.percentage;
          if (att.passed) passCount++;
          sumTime += att.timeTaken || 0;

          if (att.categoryBreakdown) {
            const bd = att.categoryBreakdown;
            Object.keys(bd).forEach(cat => {
              if (!catPerf[cat]) catPerf[cat] = { score: 0, maxScore: 0, count: 0 };
              catPerf[cat].score += bd[cat].score;
              catPerf[cat].maxScore += bd[cat].maxScore;
              catPerf[cat].count++;
            });
          }

          if (att.difficultyBreakdown) {
            const bd = att.difficultyBreakdown;
            Object.keys(bd).forEach(diff => {
              if (!diffPerf[diff]) diffPerf[diff] = { score: 0, maxScore: 0, count: 0 };
              diffPerf[diff].score += bd[diff].score;
              diffPerf[diff].maxScore += bd[diff].maxScore;
              diffPerf[diff].count++;
            });
          }
        });

        const categoryPerformance = {};
        Object.keys(catPerf).forEach(cat => {
          categoryPerformance[cat] = {
            averagePercentage: catPerf[cat].maxScore > 0 ? (catPerf[cat].score / catPerf[cat].maxScore) * 100 : 0
          };
        });

        const difficultyPerformance = {};
        Object.keys(diffPerf).forEach(diff => {
          difficultyPerformance[diff] = {
            averagePercentage: diffPerf[diff].maxScore > 0 ? (diffPerf[diff].score / diffPerf[diff].maxScore) * 100 : 0
          };
        });

        return res.json({
          totalAttempts,
          averageScore: sumScore / totalAttempts,
          averagePercentage: sumPercentage / totalAttempts,
          passPercentageRate: (passCount / totalAttempts) * 100,
          passCount,
          failCount: totalAttempts - passCount,
          averageTimeTaken: sumTime / totalAttempts,
          categoryPerformance,
          difficultyPerformance,
          violationCounts: attempts.map(att => ({
            tabViolations: att.tabViolations,
            fullscreenViolations: att.fullscreenViolations
          }))
        });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

// ─── STUDENT JOB HELPER ENDPOINTS ─────────────────────────────────────────────

const getStudentJobs = async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: {
        recruiter: {
          select: { companyName: true, companyLogo: true, industry: true }
        },
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) { next(error); }
};

const applyToJob = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { jobId } = req.params;
    const { coverLetter } = req.body;

    // Check if student has a resume uploaded
    const hasResume = student.documents?.some(doc => doc.type === 'RESUME');
    if (!hasResume) {
      return res.status(400).json({ 
        message: 'Please upload a resume before applying to jobs. Use the Resume management page to upload your resume.' 
      });
    }

    const existing = await prisma.jobApplication.findFirst({
      where: { jobId, studentId: student.id }
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Get the resume URL from the student's documents
    const resumeDoc = student.documents.find(doc => doc.type === 'RESUME');
    const resumeUrl = resumeDoc ? resumeDoc.url : null;

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        studentId: student.id,
        coverLetter: coverLetter || null,
        resumeUrl: resumeUrl,
        status: 'APPLIED'
      }
    });

    res.status(201).json(application);
  } catch (error) { next(error); }
};

const getStudentApplications = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    let applications = [];
    try {
      applications = await prisma.jobApplication.findMany({
        where: { studentId: student.id },
        include: {
          job: {
            include: {
              recruiter: { select: { companyName: true, companyLogo: true } },
              test: { select: { id: true, name: true, status: true } }
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      });
    } catch (e) {
      console.warn('Prisma query failed, falling back to query without test relation. Error:', e.message);
      try {
        applications = await prisma.jobApplication.findMany({
          where: { studentId: student.id },
          include: {
            job: {
              include: {
                recruiter: { select: { companyName: true, companyLogo: true } }
              }
            }
          },
          orderBy: { appliedAt: 'desc' }
        });
      } catch (e2) {
        console.warn('Fallback query also failed. Returning mock applications. Error:', e2.message);
        try {
          const basicApps = await prisma.jobApplication.findMany({
            where: { studentId: student.id },
            orderBy: { appliedAt: 'desc' }
          });
          applications = basicApps.map(app => ({
            ...app,
            job: {
              id: app.jobId,
              title: 'Applied Job Position',
              recruiter: { companyName: 'Company Partner' }
            }
          }));
        } catch (e3) {
          console.error('All application queries failed. Error:', e3.message);
        }
      }
    }

    res.json(applications);
  } catch (error) { next(error); }
};

// ─── STUDENT TEST ATTEMPT WORKFLOWS ───────────────────────────────────────────

const getStudentTests = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    let jobIds = [];
    try {
      const applications = await prisma.jobApplication.findMany({
        where: { studentId: student.id },
        select: { jobId: true }
      });
      jobIds = applications.map(a => a.jobId);
    } catch (err) {
      console.warn('Failed to fetch job applications for student tests:', err.message);
    }

    const activeTests = [];
    const upcomingTests = [];
    const completedTests = [];
    let attemptHistory = [];

    try {
      // Fetch tests associated with those jobs via direct testId lookup
      const jobsWithTests = await prisma.job.findMany({
        where: {
          id: { in: jobIds },
          testId: { not: null }
        },
        select: { testId: true }
      });
      const assignedTestIds = jobsWithTests.map(j => j.testId).filter(Boolean);

      const tests = await prisma.test.findMany({
        where: {
          id: { in: assignedTestIds },
          status: { in: ['PUBLISHED', 'DRAFT'] }
        },
        include: {
          attempts: { where: { studentId: student.id }, orderBy: { startedAt: 'desc' } },
          jobs: { where: { id: { in: jobIds } }, select: { id: true, title: true } }
        }
      });

      const now = new Date();

      tests.forEach(test => {
        const totalAttemptsCount = test.attempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length;
        const isCompleted = totalAttemptsCount >= test.maxAttempts;

        const hasUpcomingStart = test.startDate && new Date(test.startDate) > now;
        const hasExpiredEnd = test.endDate && new Date(test.endDate) < now;

        if (isCompleted || hasExpiredEnd) {
          completedTests.push(test);
        } else if (hasUpcomingStart) {
          upcomingTests.push(test);
        } else {
          activeTests.push(test);
        }
      });

      attemptHistory = await prisma.testAttempt.findMany({
        where: { studentId: student.id },
        include: { test: { select: { name: true, duration: true } } },
        orderBy: { startedAt: 'desc' }
      });
    } catch (err) {
      if (isDbTableMissingError(err)) {
        console.warn('Test tables do not exist in database yet. Listing from in-memory Mock store.');
        const now = new Date();

        const publishedTests = mockTests.filter(t => t.status === 'PUBLISHED' || t.status === 'DRAFT');

        publishedTests.forEach(test => {
          const attempts = mockTestAttempts.filter(a => a.testId === test.id && a.studentId === student.id);
          const completedAttemptsCount = attempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length;
          const isCompleted = completedAttemptsCount >= test.maxAttempts;

          const hasUpcomingStart = test.startDate && new Date(test.startDate) > now;
          const hasExpiredEnd = test.endDate && new Date(test.endDate) < now;

          const enrichedTest = { ...test, attempts };

          if (isCompleted || hasExpiredEnd) {
            completedTests.push(enrichedTest);
          } else if (hasUpcomingStart) {
            upcomingTests.push(enrichedTest);
          } else {
            activeTests.push(enrichedTest);
          }
        });

        attemptHistory = mockTestAttempts.filter(a => a.studentId === student.id).map(a => {
          const testDef = mockTests.find(t => t.id === a.testId);
          return {
            ...a,
            test: { name: testDef ? testDef.name : 'Aptitude Test', duration: testDef ? testDef.duration : 30 }
          };
        });
      } else {
        throw err;
      }
    }

    res.json({
      active: activeTests,
      upcoming: upcomingTests,
      completed: completedTests,
      history: attemptHistory
    });
  } catch (error) { next(error); }
};

const getStudentTestById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });
    const { id } = req.params;

    if (id === 'demo' || id === 'mock-test-id') {
      const attempts = mockTestAttempts.filter(a => a.testId === 'demo' && a.studentId === student.id);
      return res.json({
        id: 'demo',
        name: 'General Cognitive & Reasoning Aptitude Test (Demo)',
        description: 'This is a demo assessment environment designed to test the layout, active timer, question palette, and submission behaviors.',
        instructions: '1. This test consists of 3 mock questions.\n2. You have 30 minutes to complete the test.\n3. Selecting options will save your response immediately.\n4. Click Submit at any time to see your evaluation scorecard.',
        duration: 30,
        passingPercentage: 50.0,
        maxAttempts: 3,
        negativeMarking: true,
        status: 'PUBLISHED',
        attempts
      });
    }

    try {
      const test = await prisma.test.findUnique({
        where: { id },
        include: {
          attempts: { where: { studentId: student.id } }
        }
      });

      if (!test || (test.status !== 'PUBLISHED' && test.status !== 'DRAFT')) {
        return res.status(404).json({ message: 'Test not found or unavailable' });
      }

      const applied = await prisma.jobApplication.findFirst({
        where: {
          studentId: student.id,
          job: { testId: id }
        },
        include: { job: { select: { title: true } } }
      });

      if (!applied) {
        return res.status(403).json({ message: 'Access denied: You have not applied to a job associated with this test' });
      }

      test.jobs = [{ id: applied.jobId, title: applied.job.title }];
      return res.json(test);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const test = mockTests.find(x => x.id === id);
        if (!test) return res.status(404).json({ message: 'Test not found or unavailable (Mock)' });
        const attempts = mockTestAttempts.filter(a => a.testId === id && a.studentId === student.id);
        return res.json({ ...test, attempts });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const startTestAttempt = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });
    const { id } = req.params; // testId

    if (id === 'demo' || id === 'mock-test-id') {
      const studentAttempts = mockTestAttempts.filter(a => a.testId === 'demo' && a.studentId === student.id);
      const activeAttempt = studentAttempts.find(a => a.status === 'IN_PROGRESS');

      let questions = mockQuestions;
      const safeQuestions = questions.map(({ correctAnswer, explanation, ...rest }) => rest);

      if (activeAttempt) {
        return res.json({ attempt: activeAttempt, questions: safeQuestions });
      }

      const completedAttemptsCount = studentAttempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length;
      if (completedAttemptsCount >= 3) {
        return res.status(400).json({ message: 'You have reached the maximum attempts limit (Demo)' });
      }

      const attempt = {
        id: 'mock-att-demo-' + Date.now(),
        testId: 'demo',
        studentId: student.id,
        score: 0,
        percentage: 0,
        passed: false,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        answers: []
      };
      mockTestAttempts.push(attempt);
      return res.status(201).json({ attempt, questions: safeQuestions });
    }

    try {
      const test = await prisma.test.findUnique({
        where: { id },
        include: {
          testQuestions: { include: { question: true } },
          attempts: { where: { studentId: student.id } }
        }
      });

      if (!test || (test.status !== 'PUBLISHED' && test.status !== 'DRAFT')) {
        return res.status(404).json({ message: 'Test not found or unavailable' });
      }

      const now = new Date();
      if (test.startDate && new Date(test.startDate) > now) {
        return res.status(400).json({ message: 'Test has not started yet' });
      }
      if (test.endDate && new Date(test.endDate) < now) {
        return res.status(400).json({ message: 'Test has ended and is no longer available' });
      }

      const applied = await prisma.jobApplication.findFirst({
        where: {
          studentId: student.id,
          job: { testId: id }
        }
      });
      if (!applied) {
        return res.status(403).json({ message: 'Access denied: You must apply to the associated job first' });
      }

      const normalizeQuestions = (questionRows = []) => questionRows
        .flatMap(tq => (tq && tq.question ? [tq.question] : []))
        .filter(q => q && q.status === 'ACTIVE')
        .map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
        }))
        .filter(q => q.options.length > 0);

      const shuffleOptionsIfNeeded = (questionList = []) => questionList
        .filter(q => q && Array.isArray(q.options) && q.options.length > 0)
        .map(q => ({
          ...q,
          options: test.randomOptionOrder ? shuffleArray(q.options) : q.options,
        }));

      const activeAttempt = test.attempts.find(a => a.status === 'IN_PROGRESS');
      if (activeAttempt) {
        let questions = normalizeQuestions(test.testQuestions);
        if (test.randomQuestionOrder) questions = shuffleArray(questions);
        questions = shuffleOptionsIfNeeded(questions);
        const safeQuestions = questions.map(({ correctAnswer, explanation, ...rest }) => rest);
        return res.json({ attempt: activeAttempt, questions: safeQuestions });
      }

      const completedAttemptsCount = test.attempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length;
      if (completedAttemptsCount >= test.maxAttempts) {
        return res.status(400).json({ message: 'You have reached the maximum number of attempts for this test' });
      }

      const attempt = await prisma.testAttempt.create({
        data: {
          testId: id,
          studentId: student.id,
          score: 0,
          percentage: 0,
          passed: false,
          status: 'IN_PROGRESS',
          answers: []
        }
      });

      let questions = normalizeQuestions(test.testQuestions);
      if (test.randomQuestionOrder) questions = shuffleArray(questions);
      questions = shuffleOptionsIfNeeded(questions);

      const safeQuestions = questions.map(({ correctAnswer, explanation, ...rest }) => rest);
      return res.status(201).json({ attempt, questions: safeQuestions });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table TestAttempt missing. Initializing in-memory Mock attempt.');
        const test = mockTests.find(x => x.id === id);
        if (!test) return res.status(404).json({ message: 'Test not found or unavailable (Mock)' });

        const studentAttempts = mockTestAttempts.filter(a => a.testId === id && a.studentId === student.id);
        const activeAttempt = studentAttempts.find(a => a.status === 'IN_PROGRESS');
        
        let questions = test.questionIds.map(qId => mockQuestions.find(x => x.id === qId)).filter(Boolean);

        if (activeAttempt) {
          if (test.randomQuestionOrder) questions = shuffleArray(questions);
          if (test.randomOptionOrder) {
            questions = questions.map(q => ({ ...q, options: shuffleArray(q.options) }));
          }
          const safeQuestions = questions.map(({ correctAnswer, explanation, ...rest }) => rest);
          return res.json({ attempt: activeAttempt, questions: safeQuestions });
        }

        const completedAttemptsCount = studentAttempts.filter(a => a.status === 'COMPLETED' || a.status === 'AUTO_SUBMITTED').length;
        if (completedAttemptsCount >= test.maxAttempts) {
          return res.status(400).json({ message: 'You have reached the maximum attempts limit (Mock)' });
        }

        const attempt = {
          id: 'mock-att-' + Date.now(),
          testId: id,
          studentId: student.id,
          score: 0,
          percentage: 0,
          passed: false,
          startedAt: new Date(),
          status: 'IN_PROGRESS',
          answers: []
        };
        mockTestAttempts.push(attempt);

        if (test.randomQuestionOrder) questions = shuffleArray(questions);
        if (test.randomOptionOrder) {
          questions = questions.map(q => ({ ...q, options: shuffleArray(q.options) }));
        }

        const safeQuestions = questions.map(({ correctAnswer, explanation, ...rest }) => rest);
        return res.status(201).json({ attempt, questions: safeQuestions });
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const saveTestAttempt = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    const { attemptId } = req.params;
    const { answers } = req.body;

    try {
      if (!student) return res.status(403).json({ message: 'Student profile not found' });
      const attempt = await prisma.testAttempt.findFirst({
        where: { id: attemptId, studentId: student.id }
      });

      if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
      if (attempt.status !== 'IN_PROGRESS') {
        return res.status(400).json({ message: 'Attempt is already completed and cannot be modified' });
      }

      const updated = await prisma.testAttempt.update({
        where: { id: attemptId },
        data: { answers: answers || [] }
      });
      return res.json(updated);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockTestAttempts.findIndex(x => x.id === attemptId);
        if (idx === -1) return res.status(404).json({ message: 'Attempt not found (Mock)' });
        if (mockTestAttempts[idx].status !== 'IN_PROGRESS') {
          return res.status(400).json({ message: 'Attempt is already completed' });
        }
        mockTestAttempts[idx].answers = answers || [];
        return res.json(mockTestAttempts[idx]);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const submitTestAttempt = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    const { attemptId } = req.params;
    const { answers, autoSubmitted, violationCounts } = req.body;

    try {
      if (!student) return res.status(403).json({ message: 'Student profile not found' });
      const attempt = await prisma.testAttempt.findFirst({
        where: { id: attemptId, studentId: student.id },
        include: { test: { include: { testQuestions: { include: { question: true } } } } }
      });

      if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
      if (attempt.status !== 'IN_PROGRESS') {
        return res.json(attempt);
      }

      const finalAnswers = answers || attempt.answers;
      const questions = attempt.test.testQuestions.map(tq => tq.question).filter(Boolean);

      // Extract violation counts, defaulting to 0 if not provided
      const tabViolations = (violationCounts && violationCounts.tab) || 0;
      const fullscreenViolations = (violationCounts && violationCounts.fullscreen) || 0;
      const totalViolations = tabViolations + fullscreenViolations;
      // A client can explicitly flag disqualification, but the server is the
      // source of truth: hitting the shared strike limit always disqualifies,
      // regardless of what the client claims.
      const disqualified = req.body.disqualified === true || totalViolations >= MAX_VIOLATIONS;

      let correctAnswersCount = 0;
      let wrongAnswersCount = 0;
      let skippedCount = 0;
      let score = 0;
      let totalMaxScore = 0;

      const categoryBreakdown = {};
      const difficultyBreakdown = {};
      let evaluatedAnswers;

      if (disqualified) {
        // Rule violation: zero out everything and mark every question as skipped.
        evaluatedAnswers = questions.map(q => {
          const qMarks = q.marks || attempt.test.marksPerQuestion || 1.0;
          totalMaxScore += qMarks;
          skippedCount++;

          const cat = q.category;
          if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0, score: 0, maxScore: 0 };
          categoryBreakdown[cat].total++;
          categoryBreakdown[cat].maxScore += qMarks;

          const diff = q.difficulty;
          if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0, score: 0, maxScore: 0 };
          difficultyBreakdown[diff].total++;
          difficultyBreakdown[diff].maxScore += qMarks;

          return { questionId: q.id, selectedOption: null, isCorrect: false, marksObtained: 0 };
        });
      } else {
        evaluatedAnswers = finalAnswers.map(ans => {
          const q = questions.find(question => question.id === ans.questionId);
          if (!q) return ans;

          const isCorrect = q.correctAnswer.trim().toLowerCase() === (ans.selectedOption || '').trim().toLowerCase();
          const isSkipped = !ans.selectedOption;

          const qMarks = q.marks || attempt.test.marksPerQuestion || 1.0;
          const qNegMarks = q.negativeMarks || 0.0;

          let marksObtained = 0;
          if (isSkipped) {
            skippedCount++;
          } else if (isCorrect) {
            correctAnswersCount++;
            marksObtained = qMarks;
          } else {
            wrongAnswersCount++;
            marksObtained = attempt.test.negativeMarking ? -qNegMarks : 0;
          }

          score += marksObtained;
          totalMaxScore += qMarks;

          const cat = q.category;
          if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0, score: 0, maxScore: 0 };
          categoryBreakdown[cat].total++;
          categoryBreakdown[cat].maxScore += qMarks;
          if (isCorrect) categoryBreakdown[cat].correct++;
          categoryBreakdown[cat].score += marksObtained;

          const diff = q.difficulty;
          if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0, score: 0, maxScore: 0 };
          difficultyBreakdown[diff].total++;
          difficultyBreakdown[diff].maxScore += qMarks;
          if (isCorrect) difficultyBreakdown[diff].correct++;
          difficultyBreakdown[diff].score += marksObtained;

          return { ...ans, isCorrect, marksObtained };
        });

        questions.forEach(q => {
          const answered = finalAnswers.find(ans => ans.questionId === q.id);
          if (!answered) {
            skippedCount++;
            const qMarks = q.marks || attempt.test.marksPerQuestion || 1.0;
            totalMaxScore += qMarks;

            const cat = q.category;
            if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0, score: 0, maxScore: 0 };
            categoryBreakdown[cat].total++;
            categoryBreakdown[cat].maxScore += qMarks;

            const diff = q.difficulty;
            if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0, score: 0, maxScore: 0 };
            difficultyBreakdown[diff].total++;
            difficultyBreakdown[diff].maxScore += qMarks;

            evaluatedAnswers.push({
              questionId: q.id,
              selectedOption: null,
              isCorrect: false,
              marksObtained: 0
            });
          }
        });
      }

      const percentage = disqualified
        ? 0
        : (totalMaxScore > 0 ? Math.max(0, (score / totalMaxScore) * 100) : 0);
      const passed = disqualified ? false : percentage >= attempt.test.passingPercentage;
      const remark = disqualified ? buildViolationRemark(tabViolations, fullscreenViolations) : null;

      const completedAt = new Date();
      const timeTaken = Math.round((completedAt - new Date(attempt.startedAt)) / 1000);

      const updated = await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          score: disqualified ? 0 : parseFloat(score.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          passed,
          completedAt,
          timeTaken,
          status: (disqualified || autoSubmitted) ? 'AUTO_SUBMITTED' : 'COMPLETED',
          correctAnswersCount: disqualified ? 0 : correctAnswersCount,
          wrongAnswersCount: disqualified ? 0 : wrongAnswersCount,
          skippedCount,
          answers: evaluatedAnswers,
          categoryBreakdown,
          difficultyBreakdown,
          tabViolations,
          fullscreenViolations,
          disqualified,
          remark
        }
      });
      return res.json(updated);
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        const idx = mockTestAttempts.findIndex(x => x.id === attemptId);
        if (idx === -1) return res.status(404).json({ message: 'Attempt not found (Mock)' });
        
        const attempt = mockTestAttempts[idx];
        const testDef = mockTests.find(t => t.id === attempt.testId);
        if (!testDef) return res.status(404).json({ message: 'Associated test not found (Mock)' });

        const finalAnswers = answers || attempt.answers;
        const questions = testDef.questionIds.map(qId => mockQuestions.find(x => x.id === qId)).filter(Boolean);

        // Extract violation counts, defaulting to 0 if not provided
        const tabViolations = (violationCounts && violationCounts.tab) || 0;
        const fullscreenViolations = (violationCounts && violationCounts.fullscreen) || 0;
        const totalViolations = tabViolations + fullscreenViolations;
        const disqualified = req.body.disqualified === true || totalViolations >= MAX_VIOLATIONS;

        let correctAnswersCount = 0;
        let wrongAnswersCount = 0;
        let skippedCount = 0;
        let score = 0;
        let totalMaxScore = 0;

        const categoryBreakdown = {};
        const difficultyBreakdown = {};
        let evaluatedAnswers;

        if (disqualified) {
          evaluatedAnswers = questions.map(q => {
            const qMarks = q.marks || testDef.marksPerQuestion || 1.0;
            totalMaxScore += qMarks;
            skippedCount++;

            const cat = q.category;
            if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0, score: 0, maxScore: 0 };
            categoryBreakdown[cat].total++;
            categoryBreakdown[cat].maxScore += qMarks;

            const diff = q.difficulty;
            if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0, score: 0, maxScore: 0 };
            difficultyBreakdown[diff].total++;
            difficultyBreakdown[diff].maxScore += qMarks;

            return { questionId: q.id, selectedOption: null, isCorrect: false, marksObtained: 0 };
          });
        } else {
          evaluatedAnswers = finalAnswers.map(ans => {
            const q = questions.find(question => question.id === ans.questionId);
            if (!q) return ans;

            const isCorrect = q.correctAnswer.trim().toLowerCase() === (ans.selectedOption || '').trim().toLowerCase();
            const isSkipped = !ans.selectedOption;

            const qMarks = q.marks || testDef.marksPerQuestion || 1.0;
            const qNegMarks = q.negativeMarks || 0.0;

            let marksObtained = 0;
            if (isSkipped) {
              skippedCount++;
            } else if (isCorrect) {
              correctAnswersCount++;
              marksObtained = qMarks;
            } else {
              wrongAnswersCount++;
              marksObtained = testDef.negativeMarking ? -qNegMarks : 0;
            }

            score += marksObtained;
            totalMaxScore += qMarks;

            const cat = q.category;
            if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0, score: 0, maxScore: 0 };
            categoryBreakdown[cat].total++;
            categoryBreakdown[cat].maxScore += qMarks;
            if (isCorrect) categoryBreakdown[cat].correct++;
            categoryBreakdown[cat].score += marksObtained;

            const diff = q.difficulty;
            if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0, score: 0, maxScore: 0 };
            difficultyBreakdown[diff].total++;
            difficultyBreakdown[diff].maxScore += qMarks;
            if (isCorrect) difficultyBreakdown[diff].correct++;
            difficultyBreakdown[diff].score += marksObtained;

            return { ...ans, isCorrect, marksObtained };
          });

          questions.forEach(q => {
            const answered = finalAnswers.find(ans => ans.questionId === q.id);
            if (!answered) {
              skippedCount++;
              const qMarks = q.marks || testDef.marksPerQuestion || 1.0;
              totalMaxScore += qMarks;

              const cat = q.category;
              if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, correct: 0, score: 0, maxScore: 0 };
              categoryBreakdown[cat].total++;

              const diff = q.difficulty;
              if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0, score: 0, maxScore: 0 };
              difficultyBreakdown[diff].total++;

              evaluatedAnswers.push({
                questionId: q.id,
                selectedOption: null,
                isCorrect: false,
                marksObtained: 0
              });
            }
          });
        }

        const percentage = disqualified
          ? 0
          : (totalMaxScore > 0 ? Math.max(0, (score / totalMaxScore) * 100) : 0);
        const passingPercentage = testDef.passingPercentage || 40.0;
        const passed = disqualified ? false : percentage >= passingPercentage;
        const remark = disqualified ? buildViolationRemark(tabViolations, fullscreenViolations) : null;

        mockTestAttempts[idx] = {
          ...mockTestAttempts[idx],
          score: disqualified ? 0 : parseFloat(score.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2)),
          passed,
          status: (disqualified || autoSubmitted) ? 'AUTO_SUBMITTED' : 'COMPLETED',
          correctAnswersCount: disqualified ? 0 : correctAnswersCount,
          wrongAnswersCount: disqualified ? 0 : wrongAnswersCount,
          skippedCount,
          answers: evaluatedAnswers,
          categoryBreakdown,
          difficultyBreakdown,
          tabViolations,
          fullscreenViolations,
          disqualified,
          remark,
          completedAt: new Date(),
          updatedAt: new Date()
        };
        return res.json(mockTestAttempts[idx]);
      }
      throw dbErr;
    }
  } catch (error) { next(error); }
};

const getStudentJobById = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });
    const { id } = req.params;

    let job = null;
    try {
      job = await prisma.job.findUnique({
        where: { id },
        include: {
          recruiter: {
            select: { companyName: true, companyLogo: true, industry: true, companyWebsite: true, companyDescription: true }
          },
          test: { select: { id: true, name: true, duration: true, status: true } },
          applications: { where: { studentId: student.id } }
        }
      });
    } catch (e) {
      console.warn('Prisma query for job details failed, falling back to query without test relation. Error:', e.message);
      try {
        job = await prisma.job.findUnique({
          where: { id },
          include: {
            recruiter: {
              select: { companyName: true, companyLogo: true, industry: true, companyWebsite: true, companyDescription: true }
            },
            applications: { where: { studentId: student.id } }
          }
        });
      } catch (e2) {
        throw e2;
      }
    }

    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    const hasApplied = job.applications?.length > 0;
    const { applications, ...jobData } = job;

    res.json({ ...jobData, hasApplied });
  } catch (error) { next(error); }
};

module.exports = {
  createQuestion, getQuestions, getQuestionById, updateQuestion, deleteQuestion,
  bulkCreateQuestions,
  createTest, getTests, getTestById, updateTest, deleteTest,
  duplicateTest, publishTest, archiveTest, assignTestToJobs,
  getTestResults, getTestAnalytics,
  sendTestResultEmails,
  getStudentJobs, getStudentJobById, applyToJob, getStudentApplications,
  getStudentTests, getStudentTestById, startTestAttempt, saveTestAttempt, submitTestAttempt
};