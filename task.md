# Checklist - Photo Viewer & TrustMeter Implementation

- [x] Update Models
  - [x] Add `trustMeter` and `bannedUntil` fields to `User` schema ([user.model.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/models/user.model.js))
  - [x] Add `rejectionReason` field to `Complaint` schema ([complaint.model.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/models/complaint.model.js))
- [x] Implement Backend Logic
  - [x] Add lazy ban recovery logic to the `protect` middleware ([auth.middleware.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/middleware/auth.middleware.js))
  - [x] Update `createComplaint` in [complaint.controller.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/controllers/complaint.controller.js) to check for active suspensions
  - [x] Change complaints fetch cutoff duration to 2 days (48 hours) in [complaint.controller.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/controllers/complaint.controller.js)
  - [x] Update `updateComplaintStatus` in [complaint.controller.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/controllers/complaint.controller.js) to support rejection reasons, apply the correct TrustMeter penalties, handle the 7-day ban trigger, and add the +10 recovery for resolved complaints.
- [x] Implement Frontend UI
  - [x] Add the TrustMeter indicator to the Student Dashboard ([StudentDashboard.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Dashboard/StudentDashboard.jsx))
  - [x] Update [ComplaintsList.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintsList.jsx) to prevent overlapping layout issues with location badges
  - [x] Add the full-screen photo viewer modal to [ComplaintsList.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintsList.jsx)
  - [x] Add the new rejection reasons dropdown options (Duplicate, Wrong Category, Spam, False Information, Inappropriate) to the status dropdown in [ComplaintsList.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintsList.jsx)
  - [x] Display student trust score badges (e.g. `🛡️ 95% Trust`) in [ComplaintsList.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintsList.jsx)
  - [x] Modify [ComplaintForm.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintForm.jsx) to block submission and show a suspension warning if the student is currently banned.
- [x] Validation & Build Checks
  - [x] Run linter and verify there are no compilation errors.
  - [x] Verify full build succeeds.
