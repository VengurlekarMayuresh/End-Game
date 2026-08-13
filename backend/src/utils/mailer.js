const nodemailer = require('nodemailer');

// Use a basic SMTP transport (we'll log to console or ethereal if credentials aren't set)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'ethereal.password'
  }
});

/**
 * Send a generic status update email
 * @param {string} to - Candidate email
 * @param {string} candidateName - Candidate Name
 * @param {string} jobTitle - Job Title
 * @param {string} companyName - Company Name
 * @param {string} status - New Status ('SHORTLISTED' | 'REJECTED')
 */
const sendStatusEmail = async (to, candidateName, jobTitle, companyName, status, stage) => {
  const isAccepted = status === 'SHORTLISTED' || status === 'OFFERED' || status === 'INTERVIEW';
  const subject = isAccepted 
    ? `Update on your application for ${jobTitle} at ${companyName}`
    : `Application Status: ${jobTitle} at ${companyName}`;

  let html = '';
  
  if (isAccepted) {
    if (stage === 'RESUME' || status === 'SHORTLISTED') {
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
          <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Resume Shortlisted! 🎉</h1>
            <p style="color:#d1fae5;margin:8px 0 0;">You're moving to the next round</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px;">
            <p>Hi <strong>${candidateName}</strong>,</p>
            <p>Good news! Your resume for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been shortlisted.</p>
            <p>The next stage is an <strong>online assessment</strong>. You will receive further details on our website shortly.</p>
            <p style="margin-top:24px;">Best of luck! 🚀</p>
            <p style="color:#888;font-size:12px;">— The ${companyName} Hiring Team (via HireSense AI)</p>
          </div>
        </div>
      `;
    } else if (stage === 'CODING' || status === 'INTERVIEW') {
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
          <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Interview Shortlist! 🎉</h1>
            <p style="color:#dbeafe;margin:8px 0 0;">You're moving to the final rounds</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px;">
            <p>Hi <strong>${candidateName}</strong>,</p>
            <p>Good news! Following your coding assessment for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>, you have been shortlisted for an online interview.</p>
            <p>The recruiting team will be in touch shortly regarding the next steps and interview scheduling.</p>
            <p style="margin-top:24px;">Congratulations and best of luck! 🚀</p>
            <p style="color:#888;font-size:12px;">— The ${companyName} Hiring Team (via HireSense AI)</p>
          </div>
        </div>
      `;
    } else {
      // Fallback
      html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
          <div style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Application Update</h1>
            <p style="color:#ede9fe;margin:8px 0 0;">Your status has been updated to ${status}</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px;">
            <p>Hi <strong>${candidateName}</strong>,</p>
            <p>Good news! Your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
            <p>The recruiting team was impressed by your profile and will be in touch shortly regarding the next steps.</p>
            <p style="margin-top:24px;">Best regards,</p>
            <p style="color:#888;font-size:12px;">— The ${companyName} Hiring Team (via HireSense AI)</p>
          </div>
        </div>
      `;
    }
  } else {
    html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
        <div style="background:#1f2937;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Application Update</h1>
          <p style="color:#9ca3af;margin:8px 0 0;">${jobTitle} — ${companyName}</p>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px;">
          <p>Hi <strong>${candidateName}</strong>,</p>
          <p>Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
          <p>Although your profile is impressive, the team has decided to move forward with other candidates who more closely fit the specific requirements of this role at this time.</p>
          <p>We wish you the best of luck in your job search.</p>
          <p style="margin-top:24px;">Best regards,</p>
          <p style="color:#888;font-size:12px;">— The ${companyName} Hiring Team (via HireSense AI)</p>
        </div>
      </div>
    `;
  }

  try {
    const info = await transporter.sendMail({
      from: `"HireSense AI" <noreply@hiresense.ai>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // don't crash if mail fails
  }
};

/**
 * Check whether real SMTP credentials have been configured.
 * Returns true only when all four required env vars are set.
 */
const hasMailerConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'ethereal.user@ethereal.email'
  );
};

/**
 * Generic low-level sendMail wrapper — accepts a nodemailer options object.
 */
const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: mailOptions.from || `"HireSense AI" <noreply@hiresense.ai>`,
      ...mailOptions,
    });
    console.log(`Email sent to ${mailOptions.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

/**
 * Build a rich decision email (shortlisted/rejected) for aptitude/coding results.
 * @param {object} opts
 * @param {string} opts.candidateName
 * @param {string} opts.recruiterName - Company / hiring team name
 * @param {string} opts.assessmentName - Name of the test
 * @param {string} opts.scoreLabel - e.g. "78% (23 marks)"
 * @param {string} opts.thresholdLabel - e.g. "70%"
 * @param {boolean} opts.selected - true = shortlisted, false = rejected
 * @param {string} [opts.examDate] - ISO date string when the test was taken
 * @param {string} [opts.submittedAt] - ISO date string when submitted
 */
const buildDecisionEmail = ({ candidateName, recruiterName, assessmentName, scoreLabel, thresholdLabel, selected, examDate, submittedAt }) => {
  const companyName = recruiterName || 'Our Company';
  const testName = assessmentName || 'Online Assessment';

  const fmtDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
      <tr style="background:#f4f4f8;">
        <td style="padding:8px 12px;font-weight:600;color:#555;width:45%;">Assessment</td>
        <td style="padding:8px 12px;">${testName}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;">Company</td>
        <td style="padding:8px 12px;">${companyName}</td>
      </tr>
      <tr style="background:#f4f4f8;">
        <td style="padding:8px 12px;font-weight:600;color:#555;">Submitted At</td>
        <td style="padding:8px 12px;">${fmtDate(submittedAt)}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#555;">Your Score</td>
        <td style="padding:8px 12px;">${scoreLabel || 'N/A'}</td>
      </tr>
      <tr style="background:#f4f4f8;">
        <td style="padding:8px 12px;font-weight:600;color:#555;">Passing Threshold</td>
        <td style="padding:8px 12px;">${thresholdLabel || 'N/A'}</td>
      </tr>
    </table>
  `;

  const subject = selected
    ? `🎉 Congratulations! You've been shortlisted — ${testName} at ${companyName}`
    : `Assessment Result: ${testName} at ${companyName}`;

  const html = selected
    ? `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🎉 Congratulations, ${candidateName}!</h1>
          <p style="color:#e0d9ff;margin:8px 0 0;">You have been shortlisted for the next round</p>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px;">
          <p>Hi <strong>${candidateName}</strong>,</p>
          <p>We are pleased to inform you that you have successfully cleared the <strong>${testName}</strong> conducted by <strong>${companyName}</strong> and have been <strong style="color:#4f46e5;">shortlisted for the next round</strong>.</p>
          ${detailsTable}
          <p>Please keep an eye on the <strong>HireSense portal</strong> for further updates regarding the next steps in your selection process.</p>
          <p style="margin-top:24px;">Best of luck! 🚀</p>
          <p style="color:#888;font-size:12px;">— The ${companyName} Hiring Team (via HireSense AI)</p>
        </div>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
        <div style="background:#1f2937;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Assessment Result</h1>
          <p style="color:#9ca3af;margin:8px 0 0;">${testName} — ${companyName}</p>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:28px 24px;border-radius:0 0 12px 12px;">
          <p>Hi <strong>${candidateName}</strong>,</p>
          <p>Thank you for taking the time to attempt the <strong>${testName}</strong> for the position at <strong>${companyName}</strong>.</p>
          <p>Unfortunately, after careful review, your score did not meet the required threshold for this round.</p>
          ${detailsTable}
          <p>We appreciate your effort and encourage you to keep building your skills. We wish you the very best in your future endeavors.</p>
          <p style="color:#888;font-size:12px;">— The ${companyName} Hiring Team (via HireSense AI)</p>
        </div>
      </div>
    `;

  return { subject, html };
};

module.exports = { sendStatusEmail, hasMailerConfig, sendMail, buildDecisionEmail };