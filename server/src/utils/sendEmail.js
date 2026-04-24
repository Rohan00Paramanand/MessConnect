import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: `"MessConnect Auth" <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.email}`);
    } else {
      console.log(`\n==============================================`);
      console.log(`MOCK EMAIL SENT (Add SMTP credentials to .env to send real emails)`);
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Message: ${options.message}`);
      console.log(`==============================================\n`);
    }
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};
