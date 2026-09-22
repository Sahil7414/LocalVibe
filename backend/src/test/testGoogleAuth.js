require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const { generateToken, verifyToken } = require('../utils/jwt');
const { validateGoogleAuthInput, validateRegisterInput, validateLoginInput } = require('../validators/authValidator');
const authService = require('../services/authService');
const inMemoryStore = require('../services/inMemoryStore');

console.log('==================================================');
console.log('STARTING LOCALVIBE GOOGLE AUTH INTEGRATION VERIFICATION');
console.log('==================================================\n');

const runGoogleAuthTests = async () => {
  let passedCount = 0;
  let totalCount = 0;

  const assert = (condition, message) => {
    totalCount++;
    if (condition) {
      console.log(`[PASS ✅] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL ❌] ${message}`);
    }
  };

  // 1. Test Input Validation for Google Auth
  console.log('--- 1. Testing Google Auth Input Validation ---');
  const emptyVal = validateGoogleAuthInput({});
  assert(emptyVal.isValid === false, 'Missing credential is rejected by validateGoogleAuthInput');
  assert(emptyVal.errors.some(e => e.includes('credential')), 'Validation error explains credential is required');

  const nullVal = validateGoogleAuthInput(null);
  assert(nullVal.isValid === false, 'Null body is rejected by validateGoogleAuthInput');

  const blankVal = validateGoogleAuthInput({ credential: '   ' });
  assert(blankVal.isValid === false, 'Whitespace credential is rejected by validateGoogleAuthInput');

  const validVal = validateGoogleAuthInput({ credential: 'sample_google_id_token_xyz' });
  assert(validVal.isValid === true, 'Non-empty credential passes input validation');

  // 2. Test User Model with Google ID Support
  console.log('\n--- 2. Testing User Model Google ID & Password Fields ---');
  const testGoogleEmail = `google.user.${Date.now()}@localvibe.test`;
  const testGoogleSub = `sub_${Date.now()}_998877`;

  // Create a user without passwordHash (Google Sign-In)
  const isDbLive = mongoose.connection.readyState === 1;

  let createdGoogleUser;
  if (isDbLive) {
    createdGoogleUser = await User.create({
      name: 'Google Pioneer',
      email: testGoogleEmail,
      googleId: testGoogleSub,
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      role: 'USER'
    });
  } else {
    createdGoogleUser = await inMemoryStore.createGoogleUser({
      name: 'Google Pioneer',
      email: testGoogleEmail,
      googleId: testGoogleSub,
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
    });
  }

  assert(createdGoogleUser !== null, 'Google user created successfully without passwordHash');
  assert(createdGoogleUser.googleId === testGoogleSub, 'googleId is stored correctly in user document');
  assert(createdGoogleUser.role === 'USER', 'Default role for Google user is strictly USER');
  assert(!createdGoogleUser.passwordHash, 'Google user has no passwordHash');

  // 3. Test JWT Generation for Google Users
  console.log('\n--- 3. Testing Standard LocalVibe JWT for Google Users ---');
  const googleToken = generateToken(createdGoogleUser);
  assert(typeof googleToken === 'string' && googleToken.split('.').length === 3, 'Google user receives standard 3-part LocalVibe JWT');

  const decodedGoogleJwt = verifyToken(googleToken);
  assert(decodedGoogleJwt.id === (createdGoogleUser._id || createdGoogleUser.id).toString(), 'JWT contains correct Google user ID');
  assert(decodedGoogleJwt.email === testGoogleEmail, 'JWT contains correct Google email');
  assert(decodedGoogleJwt.role === 'USER', 'JWT contains correct USER role');

  // 4. Test Account Linking (Existing Email + Google Sign-In)
  console.log('\n--- 4. Testing Account Linking Logic ---');
  const existingEmail = `existing.local.${Date.now()}@localvibe.test`;
  const plainPassword = 'LocalVibePassword123!';

  let existingUser;
  if (isDbLive) {
    const hash = await User.hashPassword(plainPassword);
    existingUser = await User.create({
      name: 'Existing Member',
      email: existingEmail,
      passwordHash: hash,
      role: 'ORGANIZER',
      bio: 'Long-time local organizer'
    });
  } else {
    existingUser = await inMemoryStore.createUser({
      name: 'Existing Member',
      email: existingEmail,
      password: plainPassword,
      role: 'ORGANIZER',
      bio: 'Long-time local organizer'
    });
  }

  assert(existingUser.role === 'ORGANIZER', 'Existing user has ORGANIZER role');
  assert(existingUser.bio === 'Long-time local organizer', 'Existing user has bio');

  // Now simulate Google linking to the same email
  const linkedGoogleSub = `linked_sub_${Date.now()}_445566`;
  if (isDbLive) {
    existingUser.googleId = linkedGoogleSub;
    await existingUser.save();
    const reloaded = await User.findById(existingUser._id);
    assert(reloaded.googleId === linkedGoogleSub, 'googleId safely linked to existing user record');
    assert(reloaded.role === 'ORGANIZER', 'Existing user role (ORGANIZER) is preserved during linking');
    assert(reloaded.bio === 'Long-time local organizer', 'Existing user bio is preserved during linking');
  } else {
    const updated = await inMemoryStore.updateUser(existingUser._id || existingUser.id, { googleId: linkedGoogleSub });
    assert(updated.googleId === linkedGoogleSub, 'googleId safely linked to existing user in memory');
    assert(updated.role === 'ORGANIZER', 'Existing user role (ORGANIZER) is preserved');
  }

  // 5. Test Password Login for Linked User Still Works
  console.log('\n--- 5. Testing Password Login Remains Fully Functional for Linked User ---');
  if (isDbLive) {
    const userWithHash = await User.findOne({ email: existingEmail }).select('+passwordHash');
    const isMatch = await userWithHash.comparePassword(plainPassword);
    assert(isMatch === true, 'Original password verification still succeeds for linked account');
  }

  // 6. Test Express HTTP Endpoints End-to-End
  console.log('\n--- 6. Testing HTTP Endpoint POST /api/auth/google & Auth Routes ---');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 6.1 Test POST /api/auth/google with empty body -> 400 Bad Request
    const emptyRes = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const emptyJson = await emptyRes.json();
    assert(emptyRes.status === 400, 'POST /api/auth/google without credential returns 400 Bad Request');
    assert(emptyJson.success === false, 'Error response includes success: false');

    // 6.2 Test POST /api/auth/google with fake/malformed token -> 401 Unauthorized or 500 unconfigured
    const fakeRes = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake_malformed_google_id_token' })
    });
    const fakeJson = await fakeRes.json();
    assert(
      fakeRes.status === 401 || fakeRes.status === 500,
      `POST /api/auth/google with invalid credential returns ${fakeRes.status} (${fakeJson.message})`
    );
    assert(fakeJson.success === false, 'Invalid token returns success: false without server crash');

    // 6.3 Test GET /api/auth/me with Google User LocalVibe JWT
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${googleToken}` }
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me succeeds with Google user LocalVibe JWT (200 OK)');
    assert(meJson.data.email === testGoogleEmail, 'GET /api/auth/me returns correct Google user email');

    // 6.4 Test Profile Update Protection on Google User
    const tamperRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'ADMIN', // Malicious attempt to elevate to ADMIN
        googleId: 'tampered_google_id_999' // Malicious attempt to change googleId
      })
    });
    const tamperJson = await tamperRes.json();
    assert(tamperRes.status === 400, 'Attempt to modify role or googleId via profile update is rejected (400 Bad Request)');
    assert(tamperJson.errors.some(e => e.includes('Role')), 'Validator rejects role modification');
    assert(tamperJson.errors.some(e => e.includes('Google ID')), 'Validator rejects Google ID modification');

    // 6.5 Verify Email/Password Registration and Login Endpoints Still Work
    const standardRegEmail = `std.user.${Date.now()}@localvibe.test`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Standard Registrant',
        email: standardRegEmail,
        password: 'Password123!',
        role: 'USER'
      })
    });
    const regJson = await regRes.json();
    assert(regRes.status === 201, 'Standard email/password registration still works (201 Created)');
    assert(typeof regJson.data.token === 'string', 'Registration returns signed LocalVibe JWT');

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: standardRegEmail,
        password: 'Password123!'
      })
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200, 'Standard email/password login still works (200 OK)');
    assert(typeof loginJson.data.token === 'string', 'Login returns signed LocalVibe JWT');
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(`GOOGLE AUTH SUITE: ${passedCount}/${totalCount} PASSED`);
  console.log('==================================================\n');

  if (passedCount === totalCount) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runGoogleAuthTests().catch(err => {
  console.error('Fatal error in Google Auth tests:', err);
  process.exit(1);
});
