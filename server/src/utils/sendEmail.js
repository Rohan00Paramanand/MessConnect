import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  const smtpConfigured =
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!smtpConfigured) {
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
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"MessConnect" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,

      // Fallback for clients that don't support HTML
      text: options.message,

      // Main email
      html: options.html,
    };

    await transporter.sendMail(mailOptions);

    console.log(
      `[REAL EMAIL] Sent successfully to ${options.email}`
    );
  } catch (error) {
    console.error(
      `[EMAIL ERROR] Failed to send to ${options.email}:`,
      error.message
    );

    throw error;
  }
};