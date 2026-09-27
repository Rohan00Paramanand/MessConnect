const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const LOGO_URL = 'https://pcet.connectmess.in/pcet.png';

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
  background-color: #f1f5f9;
  font-family: Arial, Helvetica, sans-serif;
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
">

  <!-- Preheader -->
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
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      width: 100%;
      background-color: #f1f5f9;
      margin: 0;
      padding: 40px 15px;
    "
  >
    <tr>
      <td align="center">

        <!-- Main Email Container -->
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width: 100%;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                padding: 32px 30px 26px;
                background-color: #ffffff;
              "
            >

              <!-- PCET Logo -->
              <img
                src="${LOGO_URL}"
                alt="PCET"
                width="88"
                style="
                  display: block;
                  width: 88px;
                  height: 88px;
                  object-fit: contain;
                  margin: 0 auto 16px;
                  border: 0;
                  outline: none;
                  text-decoration: none;
                "
              >

              <div style="
                color: #111827;
                font-size: 26px;
                line-height: 32px;
                font-weight: 700;
                margin: 0;
              ">
                MessConnect
              </div>

              <div style="
                margin-top: 6px;
                color: #64748b;
                font-size: 13px;
                line-height: 20px;
              ">
                Smart Mess Management System
              </div>

            </td>
          </tr>

          <!-- Accent Line -->
          <tr>
            <td style="
              height: 4px;
              background-color: #2563eb;
              font-size: 0;
              line-height: 0;
            ">
              &nbsp;
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
              align="center"
              style="
                background-color: #f8fafc;
                padding: 25px 30px;
                border-top: 1px solid #e5e7eb;
              "
            >

              <div style="
                color: #475569;
                font-size: 12px;
                line-height: 19px;
              ">
                This is an automated message from
                <strong style="color: #334155;">
                  MessConnect
                </strong>.
                <br>
                Please do not reply to this email.
              </div>

              <div style="
                margin-top: 12px;
                color: #94a3b8;
                font-size: 11px;
                line-height: 17px;
              ">
                © ${new Date().getFullYear()} MessConnect
              </div>

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
    <div style="
      color: #2563eb;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    ">
      Email Verification
    </div>

    <h2 style="
      margin: 0 0 16px;
      color: #111827;
      font-size: 25px;
      line-height: 32px;
      font-weight: 700;
    ">
      Verify your email
    </h2>

    <p style="
      margin: 0 0 18px;
      color: #334155;
      font-size: 15px;
      line-height: 25px;
    ">
      Hello <strong>${safeName}</strong>,
    </p>

    <p style="
      margin: 0 0 25px;
      color: #64748b;
      font-size: 15px;
      line-height: 25px;
    ">
      Use the verification code below to verify your email
      address and continue with your MessConnect account.
    </p>

    <!-- OTP Card -->
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin: 25px 0 28px;"
    >
      <tr>
        <td align="center">

          <div style="
            display: inline-block;
            padding: 18px 30px;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 10px;
          ">
            <div style="
              color: #64748b;
              font-size: 11px;
              line-height: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 7px;
            ">
              Verification Code
            </div>

            <div style="
              color: #1d4ed8;
              font-size: 30px;
              line-height: 36px;
              font-weight: 700;
              letter-spacing: 7px;
              padding-left: 7px;
            ">
              ${safeOtp}
            </div>
          </div>

        </td>
      </tr>
    </table>

    <!-- Expiry -->
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 20px;
        background-color: #f8fafc;
        border-radius: 8px;
      "
    >
      <tr>
        <td style="
          padding: 13px 15px;
          color: #64748b;
          font-size: 13px;
          line-height: 20px;
          text-align: center;
        ">
          This verification code expires in
          <strong style="color: #334155;">
            5 minutes
          </strong>.
        </td>
      </tr>
    </table>

    <!-- Security Notice -->
    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      If you did not request this verification code,
      you can safely ignore this email.
    </p>
  `;

  return emailLayout({
    title: 'Verify your MessConnect account',
    preheader:
      'Your MessConnect verification code expires in 5 minutes.',
    content,
  });
};
