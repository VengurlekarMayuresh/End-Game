const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const hasMailerConfig = () => Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS);

const getTransporter = () => {
  if (!hasMailerConfig()) {
    throw new Error('Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: env.SMTP_SECURE === 'true' || Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const getFromAddress = () => env.SMTP_FROM || env.SMTP_USER;

const sendMail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();
  return mailer.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
};

const buildDecisionEmail = ({ candidateName, recruiterName, assessmentName, thresholdLabel, scoreLabel, selected }) => {
  const safeCandidateName = escapeHtml(candidateName || 'Candidate');
  const safeRecruiterName = escapeHtml(recruiterName || 'Hiring Team');
  const safeAssessmentName = escapeHtml(assessmentName || 'Assessment');
  const safeThresholdLabel = escapeHtml(thresholdLabel);
  const safeScoreLabel = escapeHtml(scoreLabel);

  const subject = selected
    ? `Congratulations ${safeCandidateName} - Next round update from ${safeAssessmentName}`
    : `Update on your application for ${safeAssessmentName}`;

  const statusTitle = selected ? 'Congratulations' : 'Thank you for applying';
  const statusMessage = selected
    ? `You have been shortlisted for the next round of ${safeAssessmentName}.`
    : `After reviewing the current results, we will not be moving forward with your application for ${safeAssessmentName}.`;

  const text = [
    `${statusTitle}, ${candidateName || 'Candidate'}.`,
    '',
    statusMessage,
    `Your score: ${scoreLabel}`,
    `Threshold used: ${thresholdLabel}`,
    '',
    `Regards,`,
    recruiterName || 'Hiring Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;line-height:1.6;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
        <div style="padding:24px;background:${selected ? '#dcfce7' : '#fee2e2'};border-bottom:1px solid #e2e8f0;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#475569;">${safeAssessmentName}</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">${statusTitle}</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;">Hello ${safeCandidateName},</p>
          <p style="margin:0 0 16px;">${escapeHtml(statusMessage)}</p>
          <div style="padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;margin:20px 0;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.08em;">Result summary</div>
            <div style="margin-top:10px;font-size:15px;font-weight:700;">Your score: ${safeScoreLabel}</div>
            <div style="margin-top:4px;font-size:14px;color:#475569;">Threshold used: ${safeThresholdLabel}</div>
          </div>
          <p style="margin:0 0 16px;color:#475569;">${selected ? 'We will share the next steps with you shortly.' : 'We appreciate the time and effort you invested in the process.'}</p>
          <p style="margin:24px 0 0;">Regards,<br/>${safeRecruiterName}</p>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
};

module.exports = {
  escapeHtml,
  hasMailerConfig,
  sendMail,
  buildDecisionEmail,
};