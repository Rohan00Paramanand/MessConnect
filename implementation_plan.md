# Implementation Plan - Image Viewer, 2-Day Filtering, and TrustMeter with Rejection Reasons

This plan outlines the implementation of:
1. **Overlap & Layout Fixes**: A clean, non-overlapping metadata layout for complaint cards (fixing the geo tag overlap).
2. **Photo Viewer Modal**: A full-screen overlay modal when a user clicks on an evidence image.
3. **2-Day Active Cutoff**: Filtering out resolved/rejected complaints from views 2 days (48 hours) after resolution/rejection.
4. **TrustMeter System**:
   - Rejections require a reason. The Mess Committee can choose from: `duplicate`, `spam`, `fake`, `inappropriate`, or `unrelated`.
   - **Penalty**: `duplicate` carries **0** penalty. `spam`, `fake`, `inappropriate`, and `unrelated` carry a **-10 points** penalty.
   - **Ban**: When the student's TrustMeter hits `0`, they are banned from submitting new complaints for **7 days** (1 week).
   - **Lazy Recovery**: As soon as a banned user makes a request after 7 days, their ban is cleared and their TrustMeter is restored to a baseline of `20` points.
   - **Gradual Recovery**: For every genuine complaint submitted by the student that is successfully `resolved` by the committee, they gain **+10 points** (capped at 100).
   - **UI Indicators**: Display a visually appealing TrustMeter card in the student's dashboard and show the student's trust score as a badge (e.g. `🛡️ 90% Trust`) next to their name in the complaints list.

## User Review Required

> [!IMPORTANT]
> The Mess Committee dropdown will now contain specific rejection options:
> - Reject (Duplicate) -> *No Penalty*
> - Reject (Spam) -> *Penalty*
> - Reject (Fake) -> *Penalty*
> - Reject (Inappropriate) -> *Penalty*
> - Reject (Unrelated) -> *Penalty*

> [!WARNING]
> While a student is banned (TrustMeter hit 0 within the last 7 days), the backend will block complaint creation, and the frontend will replace the "File Complaint" action with a ban warning and a countdown.

## Proposed Changes

---

### Backend Components

#### [MODIFY] [user.model.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/models/user.model.js)
- Add `trustMeter` field to `userSchema` with type `Number`, default `100`, min `0`, and max `100`.
- Add `bannedUntil` field with type `Date`.

#### [MODIFY] [complaint.model.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/models/complaint.model.js)
- Add `rejectionReason` field with type `String`, enum `["duplicate", "spam", "fake", "inappropriate", "unrelated", null]`.

#### [MODIFY] [auth.middleware.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/middleware/auth.middleware.js)
- In the `protect` middleware, check if `req.user.trustMeter === 0` and `req.user.bannedUntil && new Date() >= new Date(req.user.bannedUntil)`. If so, update `trustMeter` to `20`, clear `bannedUntil`, and save the user.

#### [MODIFY] [complaint.controller.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/controllers/complaint.controller.js)
- In `createComplaint`, check if `req.user.bannedUntil && new Date() < new Date(req.user.bannedUntil)`. If so, return a `403 Forbidden` response indicating their ban status and the date their suspension expires.
- In `getComplaints`, change the `threeDaysAgo` cutoff to `twoDaysAgo` (48 hours).
- In `updateComplaintStatus`:
  - Allow passing `rejectionReason` in `req.body`.
  - Set `complaint.rejectionReason` if status is `rejected`.
  - If status is `rejected` and reason is NOT `duplicate`:
    - Decrement the user's `trustMeter` by 10 (clamp at 0).
    - If `trustMeter` reaches 0, set `bannedUntil` to 7 days from now (`Date.now() + 7 * 24 * 60 * 60 * 1000`).
  - If status is `resolved`:
    - Increment the user's `trustMeter` by 10 (cap at 100) to reward positive submissions.

---

### Frontend Components

#### [MODIFY] [StudentDashboard.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Dashboard/StudentDashboard.jsx)
- Display a visually appealing TrustMeter card/progress bar within the welcome banner for students, indicating their current trust level.

#### [MODIFY] [ComplaintsList.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintsList.jsx)
- **Separated Metadata**: Move the MapPin location badge to its own row below the "Submitted by..." text to avoid styling overlaps.
- **Photo Viewer Modal**: Add a click handler to the evidence image. When clicked, display a full-screen blurred modal showing the image in large size.
- **Rejection Options**: Split the dropdown action for rejections to include reasons (duplicate, spam, fake, inappropriate, unrelated) and pass it to the status update API.
- **Trust Score Badges**: Render a trust shield (e.g. `🛡️ 90% Trust`) next to the student's name if they are a student, so the committee can see their reliability.

#### [MODIFY] [ComplaintForm.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintForm.jsx)
- If the student is currently banned (`user.bannedUntil && new Date() < new Date(user.bannedUntil)`), disable the form submission and display a suspension warning showing when they will be unbanned.

---

## Verification Plan

### Automated/Syntax Verification
- Run backend lint and compile checks.
- Run frontend build checks (`npm run build` and `npm run lint`).

### Manual Verification
1. Log in as a student, verify the TrustMeter displays in the dashboard.
2. File a complaint with an image. Verify no overlapping styling.
3. Click the image, verify the full-screen overlay modal opens.
4. Log in as a committee member, verify the student's trust score is visible on the complaint.
5. Reject the complaint with "Duplicate". Verify the student's trust meter remains unchanged.
6. Reject the complaint with "Spam". Verify the student's trust meter decreases by 10 points.
7. Test the ban trigger: cause the trust meter to hit 0. Verify the student is blocked from filing new complaints and sees the suspension message.
8. Verify that after the ban period expires, the user's trust meter recovers to 20 on their next request and they can submit complaints again.
9. Verify that a resolved complaint increases the user's trust meter by 10.
