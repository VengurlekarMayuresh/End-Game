const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INTERNAL_SECRET = 'hiresense-internal-2024';

/**
 * Helper: upsert an interview report by interviewSessionId OR by studentId
 * Uses raw SQL to avoid Prisma client version mismatch.
 */
async function upsertReport(data, studentId) {
  const { interviewSessionId, applicationId, percentage, selected, highestLevel, endedEarly, turns, screenViolations, candidateName, candidateEmail, jobTitle } = data;

  // Try to find existing report for this session
  let existing = null;
  if (interviewSessionId) {
    const rows = await prisma.$queryRaw`
      SELECT id, status FROM "AIInterviewReport" WHERE "interviewSessionId" = ${interviewSessionId} LIMIT 1
    `;
    if (rows && rows.length > 0) existing = rows[0];
  }

  // Also check by studentId if provided and no session match
  if (!existing && studentId && !applicationId) {
    const rows = await prisma.$queryRaw`
      SELECT id, status FROM "AIInterviewReport"
      WHERE "studentId" = ${studentId} AND status = 'PENDING_REVIEW'
      ORDER BY "createdAt" DESC LIMIT 1
    `;
    if (rows && rows.length > 0) existing = rows[0];
  }

  const pct = Math.round(percentage || 0);
  const sel = Boolean(selected);
  const hl = highestLevel || 1;
  const ee = Boolean(endedEarly);
  const sv = screenViolations || 0;
  const turnsJson = JSON.stringify(turns || []);
  const now = new Date();

  if (existing) {
    // Update existing
    await prisma.$executeRaw`
      UPDATE "AIInterviewReport"
      SET percentage          = ${pct},
          selected            = ${sel},
          "highestLevel"      = ${hl},
          "endedEarly"        = ${ee},
          turns               = ${turnsJson}::jsonb,
          "screenViolations"  = ${sv},
          "interviewSessionId"= COALESCE(${interviewSessionId || null}, "interviewSessionId"),
          "studentId"         = COALESCE(${studentId || null}, "studentId"),
          "applicationId"    = COALESCE(${applicationId || null}, "applicationId"),
          "completedAt"       = ${now},
          "updatedAt"         = ${now}
      WHERE id = ${existing.id}
    `;
    const rows = await prisma.$queryRaw`SELECT * FROM "AIInterviewReport" WHERE id = ${existing.id} LIMIT 1`;
    return rows[0];
  }

  // Create new record
  const newId = require('crypto').randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "AIInterviewReport"
      (id, "studentId", "applicationId", "candidateName", "candidateEmail", "jobTitle",
       "interviewSessionId", percentage, selected, "highestLevel", "endedEarly",
       turns, "screenViolations", status, "completedAt", "createdAt", "updatedAt")
    VALUES
      (${newId}, ${studentId || null}, ${applicationId || null}, ${candidateName || 'Unknown Candidate'},
       ${candidateEmail || ''}, ${jobTitle || 'Software Development Engineer'},
       ${interviewSessionId || null}, ${pct}, ${sel}, ${hl}, ${ee},
       ${turnsJson}::jsonb, ${sv}, 'PENDING_REVIEW', ${now}, ${now}, ${now})
  `;
  const rows = await prisma.$queryRaw`SELECT * FROM "AIInterviewReport" WHERE id = ${newId} LIMIT 1`;
  return rows[0];
}


/**
 * POST /api/internal/interview-report
 * Called by the interview server (port 3000) via server-to-server webhook.
 * Does NOT require student JWT — uses internal secret + email to find student.
 * NO DB schema changes needed.
 */
const internalSubmitReport = async (req, res) => {
  try {
    // Verify internal secret header
    const secret = req.headers['x-internal-secret'];
    if (secret !== INTERNAL_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const {
      candidateName, candidateEmail, jobTitle,
      interviewSessionId, percentage, selected,
      highestLevel, endedEarly, turns, screenViolations
    } = req.body;

    if (percentage === undefined) {
      return res.status(400).json({ message: 'Report data incomplete' });
    }

    // Try to find the student by email
    let studentId = null;
    if (candidateEmail) {
      const user = await prisma.user.findFirst({ where: { email: candidateEmail } });
      if (user) {
        const student = await prisma.student.findUnique({ where: { userId: user.id } });
        if (student) studentId = student.id;
      }
    }

    // Check for duplicate by sessionId first
    if (interviewSessionId) {
      const dup = await prisma.aIInterviewReport.findFirst({ where: { interviewSessionId } });
      if (dup && (dup.status === 'SELECTED' || dup.status === 'REJECTED')) {
        return res.status(409).json({ message: 'Report already decided', reportId: dup.id });
      }
    }

    const report = await upsertReport(
      { candidateName, candidateEmail, jobTitle, interviewSessionId, percentage, selected, highestLevel, endedEarly, turns, screenViolations },
      studentId
    );

    console.log(`[internalSubmitReport] Report saved for ${candidateName} (${candidateEmail}), score: ${percentage}, id: ${report.id}`);
    res.status(200).json({ message: 'Report saved', reportId: report.id });
  } catch (error) {
    console.error('[internalSubmitReport]', error);
    res.status(500).json({ message: 'Failed to save report', error: error.message });
  }
};

/**
 * POST /student/interview/submit-report
 * Called by the student's frontend (with JWT auth) after the interview completes.
 */
const submitInterviewReport = async (req, res) => {
  try {
    const studentUserId = req.user.userId;

    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { user: true }
    });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const {
      candidateName, candidateEmail, jobTitle, interviewSessionId,
      applicationId, percentage, selected, highestLevel, endedEarly, turns, screenViolations
    } = req.body;

    if (percentage === undefined || !turns) {
      return res.status(400).json({ message: 'Report data is incomplete' });
    }

    if (!applicationId) {
      return res.status(400).json({ message: 'applicationId is required for an interview report' });
    }

    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId, studentId: student.id },
      select: { id: true, jobId: true, job: { select: { title: true } } }
    });
    if (!application) return res.status(404).json({ message: 'Student job application not found' });

    // Block if already decided by recruiter (not if PENDING_REVIEW)
    if (interviewSessionId) {
      const existing = await prisma.aIInterviewReport.findFirst({
        where: { interviewSessionId }
      });
      if (existing && (existing.status === 'SELECTED' || existing.status === 'REJECTED')) {
        return res.status(409).json({ message: 'Interview already decided by recruiter', reportId: existing.id });
      }
    }

    const report = await upsertReport(
      {
        candidateName: candidateName || student.user.fullName,
        candidateEmail: candidateEmail || student.user.email,
        jobTitle: jobTitle || application.job.title,
        interviewSessionId,
        applicationId,
        percentage, selected, highestLevel, endedEarly, turns, screenViolations
      },
      student.id
    );

    res.status(201).json({
      message: 'Interview report submitted successfully',
      reportId: report.id,
      percentage: report.percentage,
      selected: report.selected
    });
  } catch (error) {
    console.error('[submitInterviewReport]', error);
    res.status(500).json({ message: 'Failed to submit interview report', error: error.message });
  }
};

/**
 * GET /student/interview/status
 * Returns whether the student has already completed an interview.
 * Uses raw SQL to avoid Prisma client version mismatch issues.
 */
const getStudentInterviewStatus = async (req, res) => {
  try {
    const studentUserId = req.user.userId;
    const { applicationId } = req.query;

    // Step 1: get the student record
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    if (applicationId) {
      const application = await prisma.jobApplication.findFirst({
        where: { id: applicationId, studentId: student.id },
        select: { id: true }
      });
      if (!application) return res.status(404).json({ message: 'Student job application not found' });
    }

    // Step 2: get user email separately (avoids include issues)
    const user = await prisma.user.findUnique({
      where: { id: studentUserId },
      select: { email: true }
    });
    const email = user?.email || '';

    // Step 3: raw SQL — prioritise SELECTED/REJECTED over PENDING_REVIEW
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, percentage, selected, status, "recruiterDecision", "studentId",
              "completedAt", "createdAt"
       FROM "AIInterviewReport"
       WHERE ($3::text IS NULL AND ("studentId" = $1 OR "candidateEmail" = $2))
          OR ($3::text IS NOT NULL AND "applicationId" = $3)
       ORDER BY
         CASE WHEN status IN ('SELECTED','REJECTED') THEN 0 ELSE 1 END ASC,
         "createdAt" DESC
       LIMIT 1`,
      student.id,
      email,
      applicationId || null
    );

    const report = rows && rows.length > 0 ? rows[0] : null;

    // Step 4: backfill studentId if the report was saved by webhook without it
    if (report && !report.studentId) {
      await prisma.$executeRaw`
        UPDATE "AIInterviewReport" SET "studentId" = ${student.id} WHERE id = ${report.id}
      `;
    }

    res.json({ hasCompleted: !!report, report: report || null });
  } catch (error) {
    console.error('[getStudentInterviewStatus]', error);
    res.status(500).json({ message: 'Failed to fetch interview status', error: error.message });
  }
};

/**
 * GET /recruiter/interview-reports
 */
const getAllInterviewReports = async (req, res) => {
  try {
    const reports = await prisma.$queryRaw`
      SELECT
        r.id, r."studentId", r."applicationId", r."candidateName", r."candidateEmail", r."jobTitle",
        ja."jobId", j.title AS "applicationJobTitle",
        r.percentage, r.selected, r."highestLevel", r."endedEarly",
        r."screenViolations", r.status, r."recruiterDecision", r."recruiterNote",
        r."decidedAt", r."completedAt", r."createdAt", r.turns,
        u."fullName" AS "userFullName", u.email AS "userEmail", u."profilePicture" AS "userProfilePicture"
      FROM "AIInterviewReport" r
      LEFT JOIN "JobApplication" ja ON ja.id = r."applicationId"
      LEFT JOIN "Job" j ON j.id = ja."jobId"
      LEFT JOIN "Student" s ON s.id = r."studentId"
      LEFT JOIN "User" u ON u.id = s."userId"
      ORDER BY r."createdAt" DESC
    `;

    const formatted = reports.map(r => ({
      id: r.id,
      studentId: r.studentId,
      applicationId: r.applicationId,
      jobId: r.jobId,
      applicationJobTitle: r.applicationJobTitle,
      candidateName: r.candidateName,
      candidateEmail: r.candidateEmail,
      jobTitle: r.jobTitle,
      percentage: r.percentage,
      selected: r.selected,
      highestLevel: r.highestLevel,
      endedEarly: r.endedEarly,
      screenViolations: r.screenViolations,
      status: r.status,
      recruiterDecision: r.recruiterDecision,
      recruiterNote: r.recruiterNote,
      decidedAt: r.decidedAt,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      turns: r.turns || [],
      turnsCount: Array.isArray(r.turns) ? r.turns.length : 0,
      student: r.userFullName ? {
        fullName: r.userFullName,
        email: r.userEmail,
        profilePicture: r.userProfilePicture
      } : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[getAllInterviewReports]', error);
    res.status(500).json({ message: 'Failed to fetch interview reports', error: error.message });
  }
};

/**
 * GET /recruiter/interview-reports/:reportId
 */
const getInterviewReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const rows = await prisma.$queryRaw`
      SELECT
        r.id, r."studentId", r."applicationId", r."candidateName", r."candidateEmail", r."jobTitle",
        ja."jobId", j.title AS "applicationJobTitle",
        r.percentage, r.selected, r."highestLevel", r."endedEarly",
        r."screenViolations", r.status, r."recruiterDecision", r."recruiterNote",
        r."decidedAt", r."completedAt", r."createdAt", r.turns,
        u."fullName" AS "userFullName", u.email AS "userEmail", u."profilePicture" AS "userProfilePicture"
      FROM "AIInterviewReport" r
      LEFT JOIN "JobApplication" ja ON ja.id = r."applicationId"
      LEFT JOIN "Job" j ON j.id = ja."jobId"
      LEFT JOIN "Student" s ON s.id = r."studentId"
      LEFT JOIN "User" u ON u.id = s."userId"
      WHERE r.id = ${reportId}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Report not found' });
    const r = rows[0];
    res.json({
      ...r,
      turns: r.turns || [],
      student: r.userFullName ? { fullName: r.userFullName, email: r.userEmail, profilePicture: r.userProfilePicture } : null
    });
  } catch (error) {
    console.error('[getInterviewReportById]', error);
    res.status(500).json({ message: 'Failed to fetch report', error: error.message });
  }
};

/**
 * PUT /recruiter/interview-reports/:reportId/decision
 * Recruiter makes a final decision.
 */
const makeInterviewDecision = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, note } = req.body;

    if (!['SELECTED', 'REJECTED', 'REVIEW'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision. Must be SELECTED, REJECTED, or REVIEW' });
    }

    // Check report exists via raw SQL
    const existing = await prisma.$queryRaw`
      SELECT id, "applicationId" FROM "AIInterviewReport" WHERE id = ${reportId} LIMIT 1
    `;
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const newStatus = decision === 'REVIEW' ? 'PENDING_REVIEW' : decision;
    const decidedAt = new Date();

    // Update via raw SQL
    await prisma.$executeRaw`
      UPDATE "AIInterviewReport"
      SET "recruiterDecision" = ${decision},
          "recruiterNote"     = ${note || null},
          "decidedAt"         = ${decidedAt},
          "status"            = ${newStatus},
          "updatedAt"         = ${new Date()}
      WHERE id = ${reportId}
    `;

    if (existing[0].applicationId && decision !== 'REVIEW') {
      await prisma.jobApplication.update({
        where: { id: existing[0].applicationId },
        data: { status: decision === 'SELECTED' ? 'OFFERED' : 'REJECTED' }
      });
    }

    res.json({
      message: `Candidate ${decision.toLowerCase()} successfully`,
      reportId,
      status: newStatus,
      recruiterDecision: decision
    });
  } catch (error) {
    console.error('[makeInterviewDecision]', error);
    res.status(500).json({ message: 'Failed to record decision', error: error.message });
  }
};

module.exports = {
  internalSubmitReport,
  submitInterviewReport,
  getStudentInterviewStatus,
  getAllInterviewReports,
  getInterviewReportById,
  makeInterviewDecision
};
