const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const emailLayout = ({
  title,
  preheader = '',
  content,
}) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f6f8;
  font-family: Arial, Helvetica, sans-serif;
">

  <!-- Preheader Text -->
  <div style="
    display: none;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    color: transparent;
    font-size: 1px;
    line-height: 1px;
  ">
    ${escapeHtml(preheader)}
  </div>

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background-color: #f4f6f8;
      padding: 40px 15px;
    "
  >
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          "
        >

          <!-- Header -->
          <tr>
            <td
              style="
                background-color: #2563eb;
                padding: 28px 30px;
                text-align: center;
              "
            >

              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
              ">
                MessConnect
              </h1>

              <p style="
                margin: 6px 0 0;
                color: #dbeafe;
                font-size: 13px;
              ">
                Smart Mess Management System
              </p>

            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="
              padding: 40px 35px;
            ">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              style="
                background-color: #f8fafc;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              "
            >

              <p style="
                margin: 0;
                color: #64748b;
                font-size: 12px;
                line-height: 1.6;
              ">
                This is an automated message from MessConnect.
                <br>
                Please do not reply to this email.
              </p>

              <p style="
                margin: 12px 0 0;
                color: #94a3b8;
                font-size: 11px;
              ">
                © ${new Date().getFullYear()} MessConnect
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
};


/**
 * OTP Verification Email
 *
 * OTP expires in 5 minutes.
 */
export const otpEmailTemplate = ({ name, otp }) => {
  const safeName = escapeHtml(name || 'there');
  const safeOtp = escapeHtml(otp);

  const content = `
    <h2 style="
      margin: 0 0 15px;
      color: #111827;
      font-size: 24px;
      font-weight: 700;
    ">
      Verify your email
    </h2>

    <p style="
      margin: 0 0 20px;
      color: #4b5563;
      font-size: 15px;
      line-height: 1.7;
    ">
      Hello ${safeName},
    </p>

    <p style="
      margin: 0 0 25px;
      color: #4b5563;
      font-size: 15px;
      line-height: 1.7;
    ">
      Use the verification code below to continue with your
      MessConnect account.
    </p>

    <!-- OTP -->
    <div style="
      text-align: center;
      margin: 30px 0;
    ">

      <div style="
        display: inline-block;
        padding: 16px 30px;
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        color: #1d4ed8;
        font-size: 30px;
        font-weight: 700;
        letter-spacing: 8px;
      ">
        ${safeOtp}
      </div>

    </div>

    <!-- Expiry Notice -->
    <p style="
      margin: 0 0 10px;
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
    ">
      This verification code will expire in
      <strong style="color: #475569;">
        5 minutes
      </strong>.
    </p>

    <!-- Security Notice -->
    <p style="
      margin: 20px 0 0;
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
    ">
      If you did not request this code, you can safely ignore
      this email.
    </p>
  `;

  return emailLayout({
    title: 'Verify your MessConnect account',

    preheader:
      `Your MessConnect verification code is ${otp}. It expires in 5 minutes.`,

    content,
  });
};