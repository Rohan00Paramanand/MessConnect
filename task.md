# Tasks - Phase 4: Invitation-Based Onboarding for College Admins

- [x] Create `Invitation` schema in `server/src/models/invitation.model.js`
- [x] Add invitation endpoints (`inviteAdmin`, `getInvitations`) in `superadmin.controller.js` and map them in `superadmin.routes.js`
- [x] Add verification/acceptance endpoints (`getInvitationByToken`, `acceptInvitation`) in `auth.controller.js` and map them in `auth.routes.js`
- [x] Remove `college_admin` registration option from `Signup.jsx`
- [x] Implement `AcceptInvitation.jsx` React component for the invitation landing page
- [x] Update `SuperAdminDashboard.jsx` to include invitation creation form and invitations tracking list
- [x] Mount `/accept-invite` route in `App.jsx`
- [x] Verify the complete invitation flow
