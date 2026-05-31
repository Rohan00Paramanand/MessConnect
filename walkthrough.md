# Walkthrough - Photo Viewer & TrustMeter Implementation

I have successfully implemented all requested changes for the frontend and backend, validating them with syntax and compilation checks.

## Changes Made

### 1. Database Model Additions
* **[user.model.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/models/user.model.js)**: Added `trustMeter` (defaulting to 100, min 0, max 100) and `bannedUntil` (Date) to track student credibility and suspensions.
* **[complaint.model.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/models/complaint.model.js)**: Added `rejectionReason` containing one of `["duplicate", "wrong_category", "spam", "false_information", "inappropriate", null]`.

### 2. Backend Logic & Mechanics
* **[auth.middleware.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/middleware/auth.middleware.js)**: Implemented *lazy recovery* inside the `protect` middleware. When a suspended user loads the page after the 7-day period has passed, the system automatically restores their trust score baseline to 20% and clears their ban.
* **[complaint.controller.js](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/server/src/controllers/complaint.controller.js)**:
  * In `createComplaint`, enforced an active suspension check. Suspended students are blocked from filing new complaints and receive a `403 Forbidden` error showing their unban date.
  * In `getComplaints`, reduced the active listing threshold for resolved/rejected complaints from 3 days to **2 days (48 hours)**.
  * In `updateComplaintStatus`, integrated the rejection reason routing. If a complaint is rejected:
    * The corresponding penalty is applied to the student's `trustMeter` (e.g. Duplicate = 0, Wrong Category = -2, Spam = -10, False Information = -15, Inappropriate Content = -10).
    * If their score falls to 0%, a 7-day suspension (`bannedUntil`) is set.
    * If a complaint is successfully `resolved`, the student receives a **+10 points** reward (capped at 100) to help rebuild their trust score.

### 3. Frontend Enhancements
* **[StudentDashboard.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Dashboard/StudentDashboard.jsx)**: Integrated a sleek, glassmorphic Trust Score progress indicator right inside the welcome banner. It highlights their status and warns them if they are near suspension.
* **[ComplaintsList.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintsList.jsx)**:
  * **Layout Separation**: Separated the location address badge into its own row below the metadata, resolving all overlay/overlapping text layout bugs.
  * **Trust Badge**: Rendered a `🛡️ [X]% Trust` shield next to the student's name on each complaint card, allowing the Mess Committee to gauge report authenticity instantly.
  * **Rejection Reason select dropdowns**: Added detailed selection options for rejection types to specify reasons and corresponding penalties during status updates.
  * **Photo Viewer Modal**: Clicking on an evidence photo now opens a full-screen blurred viewport displaying the photo in full size, its details, and the geocoded address.
* **[ComplaintForm.jsx](file:///wsl.localhost/Ubuntu-22.04/home/anshgupta/Projects/MERN/MessConnect/client/src/pages/Complaints/ComplaintForm.jsx)**: 
  * If the student's trust score is 0%, the form is replaced by a warning notice block displaying a countdown/calendar date for when their posting rights will resume.
  * **Dynamic Geotag Canvas Rendering**: Resolved canvas overlap issues by splitting the address text into wrapped lines using the actual canvas context font, dynamically computing the background translucent bar height, and drawing the address lines and metadata top-down with exact vertical spacing. Also implemented a geocoding network failure fallback.

## Verification Results

* **Linter Checks**: Run `npm run lint` on the client. **0 errors/warnings** found.
* **Production Bundle Build**: Run `npm run build` on the client. Compiles cleanly.
* **Server Check**: Running `node --check` syntax tests passed without issues.
