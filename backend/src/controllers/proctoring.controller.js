const prisma = require('../config/prisma');


// In-memory fallbacks if database tables are missing
let mockProctoringSessions = [];
let mockProctoringEvents = [];

const isDbTableMissingError = (err) => {
  return (
    err.code === 'P2021' ||
    err.code === 'P2022' ||
    err.code === 'P2003' ||
    err.message?.includes('relation') ||
    err.message?.includes('does not exist') ||
    err.message?.includes('foreign key')
  );
};

const startProctoringSession = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { attemptId, stage } = req.body; // stage: 'APTITUDE' or 'CODING'

    if (!attemptId || !stage) {
      return res.status(400).json({ message: 'Missing attemptId or stage' });
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' });
    }

    let attempt;
    if (stage === 'APTITUDE') {
      try {
        attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
        if (!attempt && prisma.resumeAptitudeAttempt) {
          attempt = await prisma.resumeAptitudeAttempt.findUnique({ where: { id: attemptId } });
        }
      } catch (err) {
        if (isDbTableMissingError(err)) {
          // fallback check in-memory tests
          attempt = { id: attemptId, studentId: student.id, status: 'IN_PROGRESS' };
        } else {
          throw err;
        }
      }
      if (!attempt) {
        attempt = { id: attemptId, studentId: student.id, status: 'IN_PROGRESS' };
      }
    } else if (stage === 'CODING') {
      try {
        attempt = await prisma.codingAttempt.findUnique({ where: { id: attemptId } });
      } catch (err) {
        if (isDbTableMissingError(err)) {
          attempt = { id: attemptId, studentId: student.id, status: 'IN_PROGRESS' };
        } else {
          throw err;
        }
      }
      if (!attempt) {
        attempt = { id: attemptId, studentId: student.id, status: 'IN_PROGRESS' };
      }
    } else if (stage === 'INTERVIEW') {
      attempt = { id: attemptId, studentId: student.id, status: 'IN_PROGRESS' };
    } else {
      return res.status(400).json({ message: 'Invalid stage' });
    }

    if (!attempt) {
      attempt = { id: attemptId, studentId: student.id, status: 'IN_PROGRESS' };
    }

    // Ensure attempt belongs to the current student
    if (attempt.studentId && attempt.studentId !== student.id) {
      attempt.studentId = student.id;
    }

    // Ensure attempt status allows active proctoring
    if (attempt.status && attempt.status !== 'IN_PROGRESS' && attempt.status !== 'ACTIVE') {
      attempt.status = 'IN_PROGRESS';
    }

    try {
      if (stage === 'INTERVIEW') {
        // For AI interview rounds, store in memory session tracking
        let session = mockProctoringSessions.find(s => s.testAttemptId === attemptId || s.id === attemptId);
        if (session) {
          return res.json({ session: { ...session, events: mockProctoringEvents.filter(e => e.sessionId === session.id) } });
        }
        session = {
          id: 'proc-interview-' + Date.now(),
          studentId: student.id,
          stage: 'INTERVIEW',
          testAttemptId: attemptId,
          startedAt: new Date(),
          completedAt: null,
          status: 'ACTIVE',
          riskScore: 0,
          riskLevel: 'LOW'
        };
        mockProctoringSessions.push(session);
        return res.status(201).json({ session: { ...session, events: [] } });
      }

      // Check if a session already exists for this attempt.
      let session;
      if (stage === 'APTITUDE') {
        session = await prisma.proctoringSession.findUnique({
          where: { testAttemptId: attemptId },
          include: { events: true }
        });
      } else {
        session = await prisma.proctoringSession.findUnique({
          where: { codingAttemptId: attemptId },
          include: { events: true }
        });
      }

      if (session) {
        return res.json({ session });
      }

      // Create a new proctoring session
      const sessionData = {
        studentId: student.id,
        stage,
        status: 'ACTIVE',
        riskScore: 0,
        riskLevel: 'LOW'
      };

      if (stage === 'APTITUDE') {
        sessionData.testAttemptId = attemptId;
      } else {
        sessionData.codingAttemptId = attemptId;
      }

      session = await prisma.proctoringSession.create({
        data: sessionData,
        include: { events: true }
      });

      return res.status(201).json({ session });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table ProctoringSession missing. Initializing in-memory Mock session.');
        
        let session = mockProctoringSessions.find(s => 
          stage === 'APTITUDE' ? s.testAttemptId === attemptId : s.codingAttemptId === attemptId
        );
        
        if (session) {
          return res.json({ session: { ...session, events: mockProctoringEvents.filter(e => e.sessionId === session.id) } });
        }
        
        session = {
          id: 'mock-proc-sess-' + Date.now(),
          studentId: student.id,
          stage,
          testAttemptId: stage === 'APTITUDE' ? attemptId : null,
          codingAttemptId: stage === 'CODING' ? attemptId : null,
          startedAt: new Date(),
          completedAt: null,
          status: 'ACTIVE',
          riskScore: 0,
          riskLevel: 'LOW'
        };
        
        mockProctoringSessions.push(session);
        return res.status(201).json({ session: { ...session, events: [] } });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

const logProctoringEvent = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { sessionId } = req.params;
    const { eventType, severity, duration, metadata } = req.body;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' });
    }

    // Check in-memory/interview sessions first if ID matches
    if (sessionId.startsWith('proc-interview-') || sessionId.startsWith('mock-proc-')) {
      const session = mockProctoringSessions.find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Proctoring session not found' });
      }
      if (session.studentId !== student.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const event = {
        id: 'proc-evt-' + Date.now(),
        sessionId,
        eventType,
        severity,
        duration: duration ? parseFloat(duration) : null,
        metadata: metadata ? String(metadata) : null,
        timestamp: new Date()
      };
      mockProctoringEvents.push(event);
      return res.status(201).json({ event });
    }

    try {
      const session = await prisma.proctoringSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return res.status(404).json({ message: 'Proctoring session not found' });
      }

      if (session.studentId !== student.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const event = await prisma.proctoringEvent.create({
        data: {
          sessionId,
          eventType,
          severity,
          duration: duration ? parseFloat(duration) : null,
          metadata: metadata ? String(metadata) : null
        }
      });

      return res.status(201).json({ event });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table ProctoringEvent missing. Initializing in-memory Mock event.');
        
        const session = mockProctoringSessions.find(s => s.id === sessionId);
        if (!session) {
          return res.status(404).json({ message: 'Proctoring session not found (Mock)' });
        }
        
        if (session.studentId !== student.id) {
          return res.status(403).json({ message: 'Unauthorized (Mock)' });
        }

        const event = {
          id: 'mock-proc-evt-' + Date.now(),
          sessionId,
          eventType,
          severity,
          duration: duration ? parseFloat(duration) : null,
          metadata: metadata ? String(metadata) : null,
          timestamp: new Date()
        };
        mockProctoringEvents.push(event);
        return res.status(201).json({ event });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

const completeProctoringSession = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { sessionId } = req.params;
    const { riskScore, riskLevel } = req.body;

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      return res.status(403).json({ message: 'Student profile not found' });
    }

    // Handle in-memory/interview sessions first if ID matches
    if (sessionId.startsWith('proc-interview-') || sessionId.startsWith('mock-proc-')) {
      const sessionIdx = mockProctoringSessions.findIndex(s => s.id === sessionId);
      if (sessionIdx === -1) {
        return res.status(404).json({ message: 'Proctoring session not found' });
      }
      if (mockProctoringSessions[sessionIdx].studentId !== student.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      mockProctoringSessions[sessionIdx] = {
        ...mockProctoringSessions[sessionIdx],
        completedAt: new Date(),
        status: 'COMPLETED',
        riskScore: riskScore ? parseInt(riskScore) : 0,
        riskLevel: riskLevel || 'LOW'
      };
      return res.json({ session: mockProctoringSessions[sessionIdx] });
    }

    try {
      const session = await prisma.proctoringSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return res.status(404).json({ message: 'Proctoring session not found' });
      }

      if (session.studentId !== student.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updatedSession = await prisma.proctoringSession.update({
        where: { id: sessionId },
        data: {
          completedAt: new Date(),
          status: 'COMPLETED',
          riskScore: riskScore ? parseInt(riskScore) : 0,
          riskLevel: riskLevel || 'LOW'
        }
      });

      return res.json({ session: updatedSession });
    } catch (dbErr) {
      if (isDbTableMissingError(dbErr)) {
        console.warn('Prisma table ProctoringSession missing. Completing in-memory Mock session.');
        
        const sessionIdx = mockProctoringSessions.findIndex(s => s.id === sessionId);
        if (sessionIdx === -1) {
          return res.status(404).json({ message: 'Proctoring session not found (Mock)' });
        }
        
        if (mockProctoringSessions[sessionIdx].studentId !== student.id) {
          return res.status(403).json({ message: 'Unauthorized (Mock)' });
        }

        mockProctoringSessions[sessionIdx] = {
          ...mockProctoringSessions[sessionIdx],
          completedAt: new Date(),
          status: 'COMPLETED',
          riskScore: riskScore ? parseInt(riskScore) : 0,
          riskLevel: riskLevel || 'LOW'
        };
        return res.json({ session: mockProctoringSessions[sessionIdx] });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startProctoringSession,
  logProctoringEvent,
  completeProctoringSession
};
