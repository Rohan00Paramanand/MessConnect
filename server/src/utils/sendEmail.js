import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!smtpConfigured) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      pool: true,              // Use persistent connection pool
      maxConnections: 5,       // Max 5 simultaneous connections (safely under Gmail limits)
      maxMessages: 100,        // Max 100 messages per connection before cycling
      rateDelta: 1000,         // Rate limit window: 1 second
      rateLimit: 5,            // Max 5 emails per second
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

export const sendEmail = async (options) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log(`
========== [MOCK EMAIL — SMTP NOT CONFIGURED] ==========
To      : ${options.email}
Subject : ${options.subject}
Message : ${options.message}
=========================================================
`);
    return;
  }

  try {
    const mailOptions = {
      from: `"MessConnect" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCHED] Sent successfully to ${options.email} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${options.email}:`, error.message);
    throw error;
  }
};