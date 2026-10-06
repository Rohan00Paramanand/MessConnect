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


/* =========================================================
   OTP VERIFICATION
========================================================= */

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


/* =========================================================
   PASSWORD RESET OTP
========================================================= */

export const passwordResetEmailTemplate = ({ name, otp }) => {
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
      Password Reset
    </div>

    <h2 style="
      margin: 0 0 16px;
      color: #111827;
      font-size: 25px;
      line-height: 32px;
      font-weight: 700;
    ">
      Reset your password
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
      We received a request to reset your MessConnect
      account password. Use the verification code below
      to continue.
    </p>

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
              Reset Code
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
          This password reset code expires in
          <strong style="color: #334155;">
            5 minutes
          </strong>.
        </td>
      </tr>
    </table>

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      If you did not request a password reset,
      you can safely ignore this email. Your password
      will not be changed unless you complete the reset process.
    </p>
  `;

  return emailLayout({
    title: 'Reset your MessConnect password',
    preheader:
      'Your MessConnect password reset code expires in 5 minutes.',
    content,
  });
};


/* =========================================================
   COLLEGE ADMIN INVITATION
========================================================= */

export const invitationEmailTemplate = ({
  collegeName,
  inviteLink,
}) => {
  const safeCollegeName = escapeHtml(collegeName);
  const safeInviteLink = escapeHtml(inviteLink);

  const content = `
    <div style="
      color: #2563eb;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    ">
      College Administration
    </div>

    <h2 style="
      margin: 0 0 16px;
      color: #111827;
      font-size: 25px;
      line-height: 32px;
      font-weight: 700;
    ">
      You're invited to MessConnect
    </h2>

    <p style="
      margin: 0 0 18px;
      color: #334155;
      font-size: 15px;
      line-height: 25px;
    ">
      You have been invited to manage the MessConnect
      portal for <strong>${safeCollegeName}</strong> as a
      College Admin.
    </p>

    <p style="
      margin: 0 0 25px;
      color: #64748b;
      font-size: 15px;
      line-height: 25px;
    ">
      Please complete your registration within
      <strong style="color: #334155;">7 days</strong>.
    </p>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="margin: 0 0 28px;"
    >
      <tr>
        <td align="center">

          <a
            href="${safeInviteLink}"
            style="
              display: inline-block;
              padding: 13px 25px;
              background-color: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
            "
          >
            Complete Registration
          </a>

        </td>
      </tr>
    </table>

    <p style="
      margin: 0 0 8px;
      color: #64748b;
      font-size: 12px;
      line-height: 19px;
    ">
      If the button does not work, copy and paste this link
      into your browser:
    </p>

    <p style="
      margin: 0 0 20px;
      word-break: break-all;
      color: #2563eb;
      font-size: 12px;
      line-height: 19px;
    ">
      ${safeInviteLink}
    </p>

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      If you did not expect this invitation, you can safely
      ignore this email.
    </p>
  `;

  return emailLayout({
    title: 'MessConnect College Admin Invitation',
    preheader:
      `You have been invited to manage ${collegeName} on MessConnect.`,
    content,
  });
};


/* =========================================================
   REGISTRATION REJECTED
========================================================= */

export const registrationRejectedEmailTemplate = ({
  name,
  reason,
}) => {
  const safeName = escapeHtml(name || 'there');
  const safeReason = escapeHtml(reason || 'No reason was provided.');

  const content = `
    <div style="
      color: #dc2626;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    ">
      Registration Update
    </div>

    <h2 style="
      margin: 0 0 16px;
      color: #111827;
      font-size: 25px;
      line-height: 32px;
      font-weight: 700;
    ">
      Registration request not approved
    </h2>

    <p style="
      margin: 0 0 18px;
      color: #334155;
      font-size: 15px;
      line-height: 25px;
    ">
      Dear <strong>${safeName}</strong>,
    </p>

    <p style="
      margin: 0 0 25px;
      color: #64748b;
      font-size: 15px;
      line-height: 25px;
    ">
      Your registration request for MessConnect has been
      denied by the college administrator.
    </p>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 25px;
        background-color: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
      "
    >
      <tr>
        <td style="
          padding: 16px 18px;
        ">
          <div style="
            color: #991b1b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 7px;
          ">
            Reason for denial
          </div>

          <div style="
            color: #7f1d1d;
            font-size: 14px;
            line-height: 22px;
          ">
            ${safeReason}
          </div>
        </td>
      </tr>
    </table>

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      If you have questions regarding this decision,
      please contact your college administrator.
    </p>
  `;

  return emailLayout({
    title: 'MessConnect Registration Update',
    preheader:
      'Your MessConnect registration request has been reviewed.',
    content,
  });
};


/* =========================================================
   COMPLAINT STATUS
========================================================= */

export const complaintStatusEmailTemplate = ({
  name,
  title,
  category,
  status,
  rejectionReason = '',
  dashboardUrl = '',
}) => {
  const safeName = escapeHtml(name || 'there');
  const safeTitle = escapeHtml(title || 'Your complaint');
  const safeCategory = escapeHtml(category || 'General');
  const safeStatus = escapeHtml(status || '');
  const safeRejectionReason = escapeHtml(
    rejectionReason || ''
  );

  const isRejected = status === 'rejected';
  const isResolved = status === 'resolved';

  const statusColor = isRejected ? '#dc2626' : '#16a34a';
  const statusBackground = isRejected ? '#fef2f2' : '#f0fdf4';
  const statusBorder = isRejected ? '#fecaca' : '#bbf7d0';

  const rejectionBlock = isRejected && rejectionReason
    ? `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          margin: 0 0 25px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        "
      >
        <tr>
          <td style="padding: 16px 18px;">
            <div style="
              color: #991b1b;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              margin-bottom: 7px;
            ">
              Reason for Rejection
            </div>

            <div style="
              color: #7f1d1d;
              font-size: 14px;
              line-height: 22px;
              font-weight: 600;
            ">
              ${safeRejectionReason}
            </div>
          </td>
        </tr>
      </table>
    `
    : '';

  const resolutionFeedbackBlock = isResolved
    ? `
      <div style="
        margin: 0 0 25px;
        padding: 20px;
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        text-align: center;
      ">
        <div style="font-size: 16px; font-weight: 700; color: #166534; margin-bottom: 6px;">
          Were you satisfied with this resolution?
        </div>
        <p style="font-size: 13px; color: #15803d; line-height: 20px; margin: 0 0 16px;">
          Your feedback is very important. Please visit your student dashboard and let the Mess Committee know if the issue was satisfactorily resolved.
        </p>
        <a
          href="${dashboardUrl || '#'}"
          style="
            background-color: #16a34a;
            color: #ffffff;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
          "
        >
          Rate Resolution on Dashboard
        </a>
      </div>
    `
    : '';

  const content = `
    <div style="
      color: #2563eb;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    ">
      Complaint Update
    </div>

    <h2 style="
      margin: 0 0 16px;
      color: #111827;
      font-size: 25px;
      line-height: 32px;
      font-weight: 700;
    ">
      Your complaint has been ${isRejected ? 'rejected' : isResolved ? 'resolved' : 'updated'}
    </h2>

    <p style="
      margin: 0 0 20px;
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
      ${isResolved ? 'Good news! Your complaint has been marked as resolved by the Mess Committee.' : isRejected ? 'Your complaint was reviewed by the Mess Committee and could not be processed.' : 'Your complaint has been reviewed by the Mess Committee.'}
    </p>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 25px;
        background-color: ${statusBackground};
        border: 1px solid ${statusBorder};
        border-radius: 8px;
      "
    >
      <tr>
        <td style="padding: 16px 18px;">

          <div style="
            color: #64748b;
            font-size: 11px;
            line-height: 16px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
          ">
            Status
          </div>

          <div style="
            color: ${statusColor};
            font-size: 18px;
            line-height: 25px;
            font-weight: 700;
          ">
            ${safeStatus.toUpperCase()}
          </div>

        </td>
      </tr>
    </table>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 25px;
        background-color: #f8fafc;
        border-radius: 8px;
      "
    >
      <tr>
        <td style="padding: 16px 18px;">

          <div style="
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 6px;
          ">
            Complaint
          </div>

          <div style="
            color: #334155;
            font-size: 14px;
            line-height: 22px;
            font-weight: 700;
          ">
            ${safeTitle}
          </div>

          <div style="
            margin-top: 8px;
            color: #64748b;
            font-size: 13px;
            line-height: 20px;
          ">
            Category: ${safeCategory}
          </div>

        </td>
      </tr>
    </table>

    ${rejectionBlock}
    ${resolutionFeedbackBlock}

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      Thank you for helping us improve the mess experience.
    </p>
  `;

  return emailLayout({
    title: `MessConnect Complaint ${isResolved ? 'Resolved' : isRejected ? 'Rejected' : 'Status Update'}`,
    preheader:
      isResolved
        ? `Your complaint "${safeTitle}" has been resolved. Please rate your experience.`
        : isRejected
        ? `Your complaint "${safeTitle}" has been rejected: ${safeRejectionReason}`
        : `Your complaint has been marked as ${status}.`,
    content,
  });
};

export const complaintAssignedToVendorEmailTemplate = ({
  vendorName,
  title,
  category,
  description,
  messName,
  deadlineFormatted = 'Within 3 Days (72 Hours)',
  dashboardUrl = '',
}) => {
  const safeName = escapeHtml(vendorName || 'Vendor');
  const safeTitle = escapeHtml(title || 'Complaint');
  const safeCategory = escapeHtml(category || 'General');
  const safeDescription = escapeHtml(description || '');
  const safeMess = escapeHtml(messName || 'Your Mess Facility');
  const safeDeadline = escapeHtml(deadlineFormatted);

  const content = `
    <h2 style="
      margin: 0 0 16px;
      color: #0f172a;
      font-size: 20px;
      font-weight: 700;
      line-height: 28px;
    ">
      New Complaint Assigned for Resolution
    </h2>

    <p style="
      margin: 0 0 20px;
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
      The Mess Committee has reviewed and assigned a student complaint to you for <strong>${safeMess}</strong>. Please review the details below, take corrective action, and upload a geotagged photo proof on your dashboard to mark it as completed.
    </p>

    <!-- SLA Deadline Warning Card -->
    <div style="
      margin: 0 0 20px;
      padding: 14px 18px;
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      display: flex;
      align-items: center;
    ">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">
          ⏱️ Standard Resolution SLA (3 Days)
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #92400e;">
          Target Resolution Deadline: ${safeDeadline}
        </div>
      </div>
    </div>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 25px;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      "
    >
      <tr>
        <td style="padding: 16px 18px;">
          <div style="
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 6px;
          ">
            Category: ${safeCategory}
          </div>

          <div style="
            color: #0f172a;
            font-size: 15px;
            line-height: 22px;
            font-weight: 700;
            margin-bottom: 8px;
          ">
            ${safeTitle}
          </div>

          ${safeDescription ? `
          <div style="
            color: #475569;
            font-size: 13px;
            line-height: 20px;
          ">
            "${safeDescription}"
          </div>` : ''}
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 30px 0;">
      <a
        href="${dashboardUrl || '#'}"
        style="
          background-color: #e11d48;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        "
      >
        View & Resolve on Dashboard
      </a>
    </div>

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      Note: A geotagged on-site photograph is mandatory when submitting resolution proof.
    </p>
  `;

  return emailLayout({
    title: 'Complaint Assigned - Action Required',
    preheader: `New complaint assigned at ${safeMess}: ${safeTitle} (Due: ${safeDeadline})`,
    content,
  });
};

export const complaintVendorUrgentNudgeEmailTemplate = ({
  vendorName,
  title,
  category,
  messName,
  deadlineFormatted,
  isOverdue = false,
  dashboardUrl = '',
}) => {
  const safeName = escapeHtml(vendorName || 'Vendor');
  const safeTitle = escapeHtml(title || 'Complaint');
  const safeCategory = escapeHtml(category || 'General');
  const safeMess = escapeHtml(messName || 'Your Mess Facility');
  const safeDeadline = escapeHtml(deadlineFormatted || 'Overdue');

  const headline = isOverdue
    ? '🚨 URGENT: Complaint SLA Breached — Action Required'
    : '⚠️ Reminder: Complaint Approaching 3-Day SLA Deadline';

  const content = `
    <h2 style="
      margin: 0 0 16px;
      color: ${isOverdue ? '#dc2626' : '#d97706'};
      font-size: 20px;
      font-weight: 700;
      line-height: 28px;
    ">
      ${headline}
    </h2>

    <p style="
      margin: 0 0 20px;
      color: #334155;
      font-size: 15px;
      line-height: 25px;
    ">
      Hello <strong>${safeName}</strong>,
    </p>

    <p style="
      margin: 0 0 20px;
      color: #475569;
      font-size: 15px;
      line-height: 25px;
    ">
      The Mess Committee is requesting an urgent status update regarding an assigned student complaint for <strong>${safeMess}</strong>.
      ${isOverdue 
        ? 'The 3-day resolution deadline for this complaint has passed and has been escalated.' 
        : 'This complaint is approaching its 3-day resolution deadline.'}
    </p>

    <div style="
      margin: 0 0 25px;
      padding: 16px 18px;
      background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'};
      border: 1px solid ${isOverdue ? '#fecaca' : '#fde68a'};
      border-radius: 8px;
    ">
      <div style="font-size: 12px; font-weight: 700; color: ${isOverdue ? '#991b1b' : '#92400e'}; margin-bottom: 6px;">
        COMPLAINT: ${safeTitle} (${safeCategory.toUpperCase()})
      </div>
      <div style="font-size: 13px; color: #475569;">
        <strong>SLA Target:</strong> ${safeDeadline}
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a
        href="${dashboardUrl || '#'}"
        style="
          background-color: #e11d48;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        "
      >
        Upload Proof & Complete Now
      </a>
    </div>

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      Please submit your resolution with geotagged photo proof on the dashboard as soon as possible.
    </p>
  `;

  return emailLayout({
    title: isOverdue ? 'URGENT: Complaint Overdue' : 'Reminder: Complaint SLA Deadline',
    preheader: `Urgent update requested for complaint at ${safeMess}`,
    content,
  });
};

export const complaintFeedbackReceivedEmailTemplate = ({
  committeeName,
  studentName,
  complaintTitle,
  rating,
  comment,
  dashboardUrl = '',
}) => {
  const safeCommitteeName = escapeHtml(committeeName || 'Committee Member');
  const safeStudentName = escapeHtml(studentName || 'A Student');
  const safeTitle = escapeHtml(complaintTitle || 'Complaint');
  const isSatisfied = rating === 'satisfied';
  const ratingColor = isSatisfied ? '#16a34a' : '#e11d48';
  const ratingBg = isSatisfied ? '#f0fdf4' : '#fff1f2';
  const ratingBorder = isSatisfied ? '#bbf7d0' : '#fecdd3';
  const ratingEmoji = isSatisfied ? '😊' : '🙁';
  const safeComment = comment ? escapeHtml(comment) : '';

  const content = `
    <div style="
      color: #d97706;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    ">
      Student Resolution Feedback
    </div>

    <h2 style="
      margin: 0 0 16px;
      color: #111827;
      font-size: 24px;
      line-height: 30px;
      font-weight: 700;
    ">
      New Resolution Feedback Received
    </h2>

    <p style="
      margin: 0 0 20px;
      color: #334155;
      font-size: 15px;
      line-height: 25px;
    ">
      Hello <strong>${safeCommitteeName}</strong>,
    </p>

    <p style="
      margin: 0 0 25px;
      color: #64748b;
      font-size: 15px;
      line-height: 24px;
    ">
      <strong>${safeStudentName}</strong> has rated the resolution of complaint <strong>"${safeTitle}"</strong> which you resolved:
    </p>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 20px;
        background-color: ${ratingBg};
        border: 1px solid ${ratingBorder};
        border-radius: 12px;
      "
    >
      <tr>
        <td style="padding: 18px 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
            Student Rating
          </div>
          <div style="font-size: 20px; font-weight: 800; color: ${ratingColor};">
            ${ratingEmoji} ${isSatisfied ? 'SATISFIED' : 'UNSATISFIED'}
          </div>
          ${safeComment ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed ${ratingBorder}; font-size: 14px; color: #334155; line-height: 20px;">
              <strong>Student Comment:</strong> "${safeComment}"
            </div>
          ` : ''}
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 25px 0;">
      <a
        href="${dashboardUrl || '#'}"
        style="
          background-color: #d97706;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        "
      >
        View Complaints Dashboard
      </a>
    </div>
  `;

  return emailLayout({
    title: 'Resolution Feedback Received',
    preheader: `${safeStudentName} rated the complaint resolution as ${rating.toUpperCase()}`,
    content,
  });
};

export const visitScheduledEmailTemplate = ({
  memberName,
  messName,
  visitDate,
  purpose,
  instructions,
  dashboardUrl
}) => {
  const safeMemberName = escapeHtml(memberName);
  const safeMessName = escapeHtml(messName);
  const safePurpose = escapeHtml(purpose);
  const safeInstructions = escapeHtml(instructions || 'None provided');
  const safeFormattedDate = escapeHtml(new Date(visitDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  const content = `
    <h2 style="
      margin: 0 0 16px;
      color: #0f172a;
      font-size: 20px;
      line-height: 28px;
      font-weight: 700;
    ">
      Mess Inspection Visit Scheduled
    </h2>

    <p style="
      margin: 0 0 20px;
      color: #475569;
      font-size: 14px;
      line-height: 22px;
    ">
      Hello <strong>${safeMemberName}</strong>, you have been designated by the College Administration to conduct an official inspection visit.
    </p>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        margin: 0 0 24px;
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
      "
    >
      <tr>
        <td style="padding: 16px 20px;">
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Mess Facility</div>
            <div style="font-size: 15px; font-weight: 700; color: #1e293b;">${safeMessName}</div>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Scheduled Date</div>
            <div style="font-size: 14px; font-weight: 600; color: #4338ca;">${safeFormattedDate}</div>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Purpose of Inspection</div>
            <div style="font-size: 14px; color: #334155;">${safePurpose}</div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Special Instructions</div>
            <div style="font-size: 13px; color: #64748b;">${safeInstructions}</div>
          </div>
        </td>
      </tr>
    </table>

    <div style="
      margin: 0 0 24px;
      padding: 14px 18px;
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      color: #92400e;
      font-size: 13px;
      line-height: 20px;
    ">
      <strong>Important Submission Requirement:</strong> To complete the inspection, you will need to submit an inspection report (PDF or Image) along with an authentic selfie/photo of yourself present at the mess facility through your Committee Dashboard.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a
        href="${dashboardUrl || '#'}"
        style="
          background-color: #4f46e5;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          display: inline-block;
        "
      >
        Go to Committee Portal
      </a>
    </div>

    <p style="
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 19px;
    ">
      Thank you for ensuring quality and hygiene across our campus dining facilities.
    </p>
  `;

  return emailLayout({
    title: 'Mess Inspection Visit Scheduled',
    preheader: `You have been scheduled for an inspection visit at ${safeMessName}`,
    content,
  });
};