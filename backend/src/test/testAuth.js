require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const { Event } = require('../models/Event');
const { generateToken, verifyToken } = require('../utils/jwt');
const { validateRegisterInput, validateLoginInput } = require('../validators/authValidator');
const authService = require('../services/authService');

console.log('==================================================');
console.log('STARTING LOCALVIBE PHASE 2 AUTH VERIFICATION');
console.log('==================================================\n');

const runAuthTests = async () => {
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

  // 1. Test Password Hashing with Bcrypt
  console.log('--- 1. Testing Password Security & Bcrypt ---');
  const plainPassword = 'SuperSecretPassword123!';
  const hash = await User.hashPassword(plainPassword);
  assert(hash !== plainPassword, 'Password is never stored in plaintext');
  assert(hash.startsWith('$2'), 'Password hash uses standard bcrypt format');
  
  const isMatch = await bcrypt.compare(plainPassword, hash);
  assert(isMatch === true, 'Bcrypt correctly verifies valid plaintext against hash');

  const isWrongMatch = await bcrypt.compare('WrongPassword456', hash);
  assert(isWrongMatch === false, 'Bcrypt rejects invalid plaintext against hash');

  // 2. Test JWT Token Generation & Verification
  console.log('\n--- 2. Testing JWT Signing, Verification & Tampering ---');
  const dummyUser = {
    _id: new mongoose.Types.ObjectId('650c1f1e1c9d440000a1b2c3'),
    email: 'explorer@localvibe.app',
    role: 'USER'
  };

  const token = generateToken(dummyUser);
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT is generated as standard 3-part header.payload.sig');

  const decoded = verifyToken(token);
  assert(decoded.id === dummyUser._id.toString(), 'Decoded JWT payload contains correct user ID');
  assert(decoded.email === dummyUser.email, 'Decoded JWT payload contains correct email');
  assert(decoded.role === dummyUser.role, 'Decoded JWT payload contains correct role');

  let tamperedFailed = false;
  try {
    verifyToken(token + 'tampered_signature_xyz');
  } catch (err) {
    tamperedFailed = true;
  }
  assert(tamperedFailed === true, 'Tampered JWT signature is rejected with error');

  // 3. Test Registration Validation Guardrails
  console.log('\n--- 3. Testing Registration Input Validation ---');
  const validReg = validateRegisterInput({
    name: 'Sahil Dev',
    email: 'sahil@localvibe.app',
    password: 'password123',
    role: 'USER'
  });
  assert(validReg.isValid === true, 'Valid registration payload passes validation');

  const adminAttempt = validateRegisterInput({
    name: 'Hacker User',
    email: 'hacker@localvibe.app',
    password: 'password123',
    role: 'ADMIN' // Malicious attempt to self-assign ADMIN
  });
  assert(adminAttempt.isValid === false, 'Self-assigning ADMIN role is rejected by validator');
  assert(adminAttempt.errors.some(e => e.includes('ADMIN')), 'Error message explains ADMIN self-registration is forbidden');

  const shortPass = validateRegisterInput({
    name: 'Short Pass',
    email: 'short@localvibe.app',
    password: '123'
  });
  assert(shortPass.isValid === false, 'Passwords shorter than 6 characters are rejected');

  const invalidEmail = validateRegisterInput({
    name: 'Bad Email',
    email: 'not-an-email',
    password: 'password123'
  });
  assert(invalidEmail.isValid === false, 'Invalid email format is rejected');

  // 4. Test Login Validation
  console.log('\n--- 4. Testing Login Input Validation ---');
  const validLogin = validateLoginInput({ email: 'user@test.com', password: 'password123' });
  assert(validLogin.isValid === true, 'Valid login payload passes validation');

  const missingEmail = validateLoginInput({ email: '', password: 'password123' });
  assert(missingEmail.isValid === false, 'Missing login email is rejected');

  const missingPass = validateLoginInput({ email: 'user@test.com', password: '' });
  assert(missingPass.isValid === false, 'Missing login password is rejected');

  // 5. Test Express Middleware End-to-End via Test Server
  console.log('\n--- 5. Testing Express Auth & Ownership Middleware ---');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 5.1 Test Public Discovery Endpoint (No auth required)
    const publicRes = await fetch(`${baseUrl}/health`);
    assert(publicRes.status === 200, 'Public health endpoint accessible without token (200 OK)');

    // 5.2 Test Protected Route Without Token
    const unauthMeRes = await fetch(`${baseUrl}/auth/me`);
    assert(unauthMeRes.status === 401, 'GET /api/auth/me without Bearer token returns 401 Unauthorized');

    // 5.3 Test Protected Event Creation Without Token
    const unauthEventRes = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Event' })
    });
    assert(unauthEventRes.status === 401, 'POST /api/events without Bearer token returns 401 Unauthorized');

    // 5.4 Test Protected Route With Malformed Token
    const malformedRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': 'Bearer not_a_real_jwt_token' }
    });
    assert(malformedRes.status === 401, 'GET /api/auth/me with malformed token returns 401 Unauthorized');
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(`PHASE 2 AUTH TESTS: ${passedCount}/${totalCount} PASSED`);
  console.log('==================================================\n');
};

runAuthTests().catch(err => {
  console.error('Fatal error in auth tests:', err);
  process.exit(1);
});
