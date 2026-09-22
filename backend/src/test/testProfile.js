const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { Event } = require('../models/Event');
const RSVP = require('../models/RSVP');
const { generateToken } = require('../utils/jwt');

let mongod;
let server;
let baseUrl;

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING LOCALVIBE PHASE 9: USER PROFILE & ACCOUNT TESTS');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [Test ${total}] PASSED: ${description}`);
    } else {
      console.error(`❌ [Test ${total}] FAILED: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    }
  };

  try {
    // 1. Setup in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Setup] In-Memory MongoDB running at ${uri}`);

    // 2. Start Express test server
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
    console.log(`[Setup] Express test server running on port ${port}\n`);

    // 3. Create Seed Users
    const userA = await User.create({
      name: 'Rohan Deshmukh',
      email: 'rohan@example.com',
      passwordHash: 'hashed_pw_123',
      role: 'USER',
      bio: 'Weekend explorer and photography enthusiast.',
      location: { city: 'Mumbai', coordinates: [72.8777, 19.0760] }
    });

    const userB = await User.create({
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      passwordHash: 'hashed_pw_456',
      role: 'ORGANIZER',
      bio: 'Curator of rooftop acoustic jams.',
      location: { city: 'Pune', coordinates: [73.8567, 18.5204] }
    });

    const tokenA = generateToken({ id: userA._id.toString(), role: userA.role });
    const tokenB = generateToken({ id: userB._id.toString(), role: userB.role });

    // TEST 1: GET /api/auth/me (Profile Loading)
    console.log('\n--- TEST 1: Load Current User Profile ---');
    const getMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const getMeData = await getMeRes.json();
    assert(getMeRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(getMeData.success === true, 'Response indicates success');
    assert(getMeData.data.name === 'Rohan Deshmukh', 'Profile name matches');
    assert(getMeData.data.email === 'rohan@example.com', 'Profile email matches');
    assert(getMeData.data.role === 'USER', 'Profile role matches');
    assert(getMeData.data.bio === 'Weekend explorer and photography enthusiast.', 'Profile bio matches');
    assert(!getMeData.data.passwordHash, 'Password hash is NOT exposed in profile payload');

    // TEST 2: GET /api/users/me (Alias Route)
    console.log('\n--- TEST 2: Alias Endpoint GET /api/users/me ---');
    const getUsersMeRes = await fetch(`${baseUrl}/users/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const getUsersMeData = await getUsersMeRes.json();
    assert(getUsersMeRes.status === 200, 'GET /api/users/me returns 200 OK');
    assert(getUsersMeData.data.name === 'Rohan Deshmukh', 'Alias returns identical user data');

    // TEST 3: PUT /api/users/me (Edit Name and Bio)
    console.log('\n--- TEST 3: Update Profile Name & Bio ---');
    const updateRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Rohan K. Deshmukh',
        bio: 'Indie art & vinyl collector based in Bandra West.'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PUT /api/users/me returns 200 OK');
    assert(updateData.data.name === 'Rohan K. Deshmukh', 'Updated name reflected in response');
    assert(updateData.data.bio === 'Indie art & vinyl collector based in Bandra West.', 'Updated bio reflected in response');

    // Verify MongoDB database document persistence
    const dbUserA = await User.findById(userA._id);
    assert(dbUserA.name === 'Rohan K. Deshmukh', 'Database user document reflects new name');
    assert(dbUserA.bio === 'Indie art & vinyl collector based in Bandra West.', 'Database user document reflects new bio');

    // TEST 4: PUT /api/users/me (Edit Location & Profile Image)
    console.log('\n--- TEST 4: Update Location & Profile Image ---');
    const updateLocRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        location: { city: 'Bandra West, Mumbai' },
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      })
    });
    const updateLocData = await updateLocRes.json();
    assert(updateLocRes.status === 200, 'Location/Avatar update returns 200 OK');
    assert(updateLocData.data.location.city === 'Bandra West, Mumbai', 'Updated city reflected');
    assert(updateLocData.data.profileImage.includes('photo-1534528741775'), 'Updated avatar URL reflected');

    // TEST 5: Security: Reject Role Tampering (Privilege Escalation Attempt)
    console.log('\n--- TEST 5: Security: Role Escalation Rejection ---');
    const roleTamperRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        role: 'ADMIN'
      })
    });
    const roleTamperData = await roleTamperRes.json();
    assert(roleTamperRes.status === 400, 'Role tamper attempt rejected with 400 Bad Request');
    assert(roleTamperData.errors.some(e => e.toLowerCase().includes('role')), 'Error message explains role cannot be modified via profile update');

    // Verify database role is untouched
    const dbUserAfterRoleTamper = await User.findById(userA._id);
    assert(dbUserAfterRoleTamper.role === 'USER', 'User role in database remains USER');

    // TEST 6: Security: Reject Password Tampering via Profile Route
    console.log('\n--- TEST 6: Security: Password Modification via Profile Update Rejection ---');
    const passwordTamperRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        password: 'new_plain_password_123'
      })
    });
    assert(passwordTamperRes.status === 400, 'Password tamper attempt rejected with 400 Bad Request');

    // Verify password hash in DB was untouched
    const dbUserAfterPwTamper = await User.findById(userA._id).select('+passwordHash');
    assert(dbUserAfterPwTamper.passwordHash === 'hashed_pw_123', 'Password hash in DB remains untouched');

    // TEST 7: Input Validation: Name too short / empty
    console.log('\n--- TEST 7: Validation: Empty or Short Name ---');
    const shortNameRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'R' })
    });
    assert(shortNameRes.status === 400, 'Single-character name rejected with 400 Bad Request');

    // TEST 8: Input Validation: Bio too long (> 500 characters)
    console.log('\n--- TEST 8: Validation: Bio exceeding 500 characters ---');
    const longBio = 'A'.repeat(501);
    const longBioRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ bio: longBio })
    });
    assert(longBioRes.status === 400, 'Bio > 500 chars rejected with 400 Bad Request');

    // TEST 9: Unauthenticated Protection
    console.log('\n--- TEST 9: Unauthenticated Profile Route Protection ---');
    const unauthGetRes = await fetch(`${baseUrl}/users/me`);
    assert(unauthGetRes.status === 401, 'GET /users/me without token returns 401');

    const unauthPutRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker' })
    });
    assert(unauthPutRes.status === 401, 'PUT /users/me without token returns 401');

    // TEST 10: User Isolation (User B editing their profile does not affect User A)
    console.log('\n--- TEST 10: User Isolation ---');
    const updateBRes = await fetch(`${baseUrl}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ name: 'Ananya Roy-Sharma' })
    });
    assert(updateBRes.status === 200, 'User B update succeeds');

    const dbUserAFinal = await User.findById(userA._id);
    const dbUserBFinal = await User.findById(userB._id);
    assert(dbUserAFinal.name === 'Rohan K. Deshmukh', 'User A name unchanged by User B action');
    assert(dbUserBFinal.name === 'Ananya Roy-Sharma', 'User B name updated correctly');

    console.log('\n==================================================');
    console.log(`ALL ${passed}/${total} PHASE 9 USER PROFILE TESTS PASSED!`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
};

runTests();
