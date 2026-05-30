#!/usr/bin/env node
/**
 * MessConnect — Multi-Tenant Isolation Test Suite
 * =================================================
 * Tests that users from College A CANNOT access or mutate
 * data belonging to College B, even knowing their ObjectIds.
 *
 * SETUP REQUIRED (edit the CONFIG block below):
 *   - Run this script AFTER starting the server (npm run dev)
 *   - Provide two real student accounts from different colleges
 *   - Provide a mess_committee account from College A
 *
 * Usage:
 *   node isolation_test.js
 */

import http from 'http';
import https from 'https';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000';

// College A credentials (the attacker's college)
const COLLEGE_A_STUDENT = { email: 'STUDENT_A@example.com', password: 'password123' };
const COLLEGE_A_COMMITTEE = { email: 'COMMITTEE_A@example.com', password: 'password123' };

// College B credentials (the victim's college)
const COLLEGE_B_STUDENT = { email: 'STUDENT_B@example.com', password: 'password123' };

// After running once, fill in IDs discovered from College B's data
// (You can get these by running with College B's credentials first)
const COLLEGE_B_MESS_ID = 'REPLACE_WITH_COLLEGE_B_MESS_ID';
const COLLEGE_B_NOTICE_ID = 'REPLACE_WITH_COLLEGE_B_NOTICE_ID';
const COLLEGE_B_COMPLAINT_ID = 'REPLACE_WITH_COLLEGE_B_COMPLAINT_ID';
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let warnings = 0;
const results = [];

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const lib = url.protocol === 'https:' ? https : http;

    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function login(creds) {
  const res = await request('POST', '/api/auth/login', creds);
  if (res.status !== 200) throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

function assert(testName, expectBlocked, actualStatus, responseBody) {
  const blocked = actualStatus === 401 || actualStatus === 403 || actualStatus === 404;
  const label = expectBlocked ? 'SHOULD BE BLOCKED' : 'SHOULD BE ALLOWED';

  if (expectBlocked && blocked) {
    console.log(`  ✅ PASS [${testName}] — Correctly blocked (${actualStatus})`);
    results.push({ status: 'PASS', test: testName });
    passed++;
  } else if (expectBlocked && !blocked) {
    console.log(`  ❌ FAIL [${testName}] — NOT blocked! Got ${actualStatus}. Response: ${JSON.stringify(responseBody).slice(0, 120)}`);
    results.push({ status: 'FAIL', test: testName, detail: `Got ${actualStatus}` });
    failed++;
  } else if (!expectBlocked && !blocked) {
    console.log(`  ✅ PASS [${testName}] — Correctly allowed (${actualStatus})`);
    results.push({ status: 'PASS', test: testName });
    passed++;
  } else {
    console.log(`  ⚠️  WARN [${testName}] — Expected to pass but got ${actualStatus}`);
    results.push({ status: 'WARN', test: testName });
    warnings++;
  }
}

async function runTests() {
  console.log('\n════════════════════════════════════════');
  console.log('  MessConnect — Tenant Isolation Tests');
  console.log('════════════════════════════════════════\n');

  // ── Login ─────────────────────────────────────────────────────────────────
  let tokenA, tokenAC, tokenB;
  try {
    console.log('⏳ Authenticating test users...');
    tokenA  = await login(COLLEGE_A_STUDENT);
    tokenAC = await login(COLLEGE_A_COMMITTEE);
    tokenB  = await login(COLLEGE_B_STUDENT);
    console.log('✅ All users authenticated.\n');
  } catch (e) {
    console.error('❌ Authentication failed. Check CONFIG credentials.\n', e.message);
    process.exit(1);
  }

  // ── 1. Mess Isolation ─────────────────────────────────────────────────────
  console.log('── 1. MESS ISOLATION ────────────────────');

  // College A student reads their own messes (should work)
  const myMesses = await request('GET', '/api/messes', null, tokenA);
  assert('Student reads own college messes', false, myMesses.status, myMesses.body);

  // College A student tries to mutate College B's mess directly
  if (COLLEGE_B_MESS_ID !== 'REPLACE_WITH_COLLEGE_B_MESS_ID') {
    const xMess = await request('PATCH', `/api/messes/admin/${COLLEGE_B_MESS_ID}`, { isActive: false }, tokenAC);
    assert('Committee A deactivates College B mess', true, xMess.status, xMess.body);
  } else {
    console.log('  ⏭️  SKIP [Committee A deactivates College B mess] — set COLLEGE_B_MESS_ID in CONFIG');
  }

  // ── 2. Complaint Isolation ────────────────────────────────────────────────
  console.log('\n── 2. COMPLAINT ISOLATION ───────────────');

  // College A student reads complaints — they should only see their own college's
  const myComplaints = await request('GET', '/api/complaints', null, tokenA);
  const complaintsData = myComplaints.body?.data || [];
  const crossCollegeComplaint = complaintsData.find(c => c._id === COLLEGE_B_COMPLAINT_ID);
  if (COLLEGE_B_COMPLAINT_ID !== 'REPLACE_WITH_COLLEGE_B_COMPLAINT_ID') {
    if (!crossCollegeComplaint) {
      console.log('  ✅ PASS [Student A cannot see College B complaint in list] — Correctly isolated');
      passed++;
      results.push({ status: 'PASS', test: 'Student A cannot see College B complaint in list' });
    } else {
      console.log('  ❌ FAIL [Student A cannot see College B complaint in list] — Cross-college leak!');
      failed++;
      results.push({ status: 'FAIL', test: 'Student A cannot see College B complaint in list' });
    }

    // Directly attempt to update College B's complaint status
    const xStatus = await request('PATCH', `/api/complaints/${COLLEGE_B_COMPLAINT_ID}/status`, { status: 'rejected', rejectionReason: 'spam' }, tokenAC);
    assert('Committee A updates College B complaint status', true, xStatus.status, xStatus.body);

    // Student A tries to upvote College B's complaint
    const xUpvote = await request('POST', `/api/complaints/${COLLEGE_B_COMPLAINT_ID}/upvote`, null, tokenA);
    assert('Student A upvotes College B complaint', true, xUpvote.status, xUpvote.body);
  } else {
    console.log('  ⏭️  SKIP [Complaint cross-college checks] — set COLLEGE_B_COMPLAINT_ID in CONFIG');
  }

  // ── 3. Notice Isolation ───────────────────────────────────────────────────
  console.log('\n── 3. NOTICE ISOLATION ──────────────────');

  // College A student reads notices — should not see College B notices
  const myNotices = await request('GET', '/api/notices', null, tokenA);
  console.log(`  ℹ️  INFO [Get notices] — Returned ${myNotices.body?.count ?? 0} notices. Manually verify none belong to College B.`);
  warnings++;
  results.push({ status: 'WARN', test: 'Notice isolation (manual check needed)', detail: 'Verify returned notices are College A only' });

  // Committee A attempts to update a College B notice
  if (COLLEGE_B_NOTICE_ID !== 'REPLACE_WITH_COLLEGE_B_NOTICE_ID') {
    const xNotice = await request('PATCH', `/api/notices/${COLLEGE_B_NOTICE_ID}`, { title: 'HACKED' }, tokenAC);
    assert('Committee A updates College B notice', true, xNotice.status, xNotice.body);

    const xDelNotice = await request('DELETE', `/api/notices/${COLLEGE_B_NOTICE_ID}`, null, tokenAC);
    assert('Committee A deletes College B notice', true, xDelNotice.status, xDelNotice.body);
  } else {
    console.log('  ⏭️  SKIP [Notice cross-college mutation checks] — set COLLEGE_B_NOTICE_ID in CONFIG');
  }

  // ── 4. Feedback Isolation ─────────────────────────────────────────────────
  console.log('\n── 4. FEEDBACK ISOLATION ────────────────');

  // Student A tries to submit feedback for a College B mess
  if (COLLEGE_B_MESS_ID !== 'REPLACE_WITH_COLLEGE_B_MESS_ID') {
    const xFeedback = await request('POST', '/api/feedback', {
      date: new Date().toISOString().split('T')[0],
      mess: COLLEGE_B_MESS_ID,
      ratings: [{ category: 'food', rating: 5 }]
    }, tokenA);
    assert('Student A submits feedback to College B mess', true, xFeedback.status, xFeedback.body);

    // Committee A reads feedback filtering by College B mess
    const xReadFeedback = await request('GET', `/api/feedback?mess=${COLLEGE_B_MESS_ID}`, null, tokenAC);
    const feedbackCount = xReadFeedback.body?.data?.length || 0;
    if (feedbackCount === 0 || xReadFeedback.status === 403) {
      console.log('  ✅ PASS [Committee A reads College B feedback] — 0 results or blocked');
      passed++;
      results.push({ status: 'PASS', test: 'Committee A reads College B feedback' });
    } else {
      console.log(`  ❌ FAIL [Committee A reads College B feedback] — Got ${feedbackCount} items (potential leak)`);
      failed++;
      results.push({ status: 'FAIL', test: 'Committee A reads College B feedback', detail: `${feedbackCount} items returned` });
    }
  } else {
    console.log('  ⏭️  SKIP [Feedback cross-college checks] — set COLLEGE_B_MESS_ID in CONFIG');
  }

  // ── 5. Staff Isolation ────────────────────────────────────────────────────
  console.log('\n── 5. STAFF ISOLATION ───────────────────');

  if (COLLEGE_B_MESS_ID !== 'REPLACE_WITH_COLLEGE_B_MESS_ID') {
    // Committee A reads staff for College B's mess
    const xStaff = await request('GET', `/api/staff?mess=${COLLEGE_B_MESS_ID}`, null, tokenAC);
    const staffCount = xStaff.body?.data?.length || 0;
    if (staffCount === 0 || xStaff.status === 403) {
      console.log('  ✅ PASS [Committee A reads College B staff] — 0 results or blocked');
      passed++;
      results.push({ status: 'PASS', test: 'Committee A reads College B staff' });
    } else {
      console.log(`  ❌ FAIL [Committee A reads College B staff] — Got ${staffCount} items (cross-college leak)`);
      failed++;
      results.push({ status: 'FAIL', test: 'Committee A reads College B staff', detail: `${staffCount} items returned` });
    }
  } else {
    console.log('  ⏭️  SKIP [Staff cross-college check] — set COLLEGE_B_MESS_ID in CONFIG');
  }

  // ── 6. Timetable Isolation ─────────────────────────────────────────────────
  console.log('\n── 6. TIMETABLE ISOLATION ───────────────');

  if (COLLEGE_B_MESS_ID !== 'REPLACE_WITH_COLLEGE_B_MESS_ID') {
    // Student A reads timetable for College B's mess by passing its ID
    const xTimetable = await request('GET', `/api/timetable?mess=${COLLEGE_B_MESS_ID}`, null, tokenA);
    const ttCount = xTimetable.body?.data?.length || 0;
    if (ttCount === 0 || xTimetable.status === 403) {
      console.log('  ✅ PASS [Student A reads College B timetable] — 0 results or blocked');
      passed++;
      results.push({ status: 'PASS', test: 'Student A reads College B timetable' });
    } else {
      console.log(`  ❌ FAIL [Student A reads College B timetable] — Got ${ttCount} entries (cross-college leak)`);
      failed++;
      results.push({ status: 'FAIL', test: 'Student A reads College B timetable', detail: `${ttCount} entries returned` });
    }
  } else {
    console.log('  ⏭️  SKIP [Timetable cross-college check] — set COLLEGE_B_MESS_ID in CONFIG');
  }

  // ── 7. Auth — No JWT / Invalid Token ──────────────────────────────────────
  console.log('\n── 7. AUTH GUARD CHECKS ─────────────────');
  const noToken = await request('GET', '/api/complaints');
  assert('Unauthenticated access to complaints', true, noToken.status, noToken.body);

  const badToken = await request('GET', '/api/messes', null, 'invalid.jwt.token');
  assert('Invalid JWT access to messes', true, badToken.status, badToken.body);

  // ── Results ───────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('════════════════════════════════════════');
  console.log(`  ✅ Passed:   ${passed}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log('════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.test}${r.detail ? ' — ' + r.detail : ''}`));
    console.log('');
  }
  if (warnings > 0) {
    console.log('WARNINGS (manual review needed):');
    results.filter(r => r.status === 'WARN').forEach(r => console.log(`  ⚠️  ${r.test}${r.detail ? ' — ' + r.detail : ''}`));
    console.log('');
  }
}

runTests().catch(e => { console.error('Fatal error:', e); process.exit(1); });
