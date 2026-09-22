const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { isDbConnected } = require('../config/db');
const inMemoryStore = require('./inMemoryStore');
const bcrypt = require('bcryptjs');

const sanitizeUser = (user) => {
  const isSuspended = !!user.isSuspended || user.status === 'SUSPENDED';
  return {
    id: (user._id || user.id).toString(),
    _id: (user._id || user.id).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: isSuspended ? 'SUSPENDED' : (user.status || 'ACTIVE'),
    isSuspended,
    profileImage: user.profileImage,
    bio: user.bio,
    location: user.location,
    interests: user.interests,
    createdAt: user.createdAt
  };
};

/**
 * Register a new user account
 */
const registerUser = async ({ name, email, password, role = 'USER', bio, location, interests }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // If MongoDB is offline, use In-Memory Store
  if (!isDbConnected()) {
    const existingInMemory = await inMemoryStore.findUserByEmail(normalizedEmail);
    if (existingInMemory) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    const newUser = await inMemoryStore.createUser({
      name,
      email: normalizedEmail,
      password,
      role,
      bio,
      location,
      interests
    });

    const token = generateToken(newUser);
    return {
      user: sanitizeUser(newUser),
      token
    };
  }

  // Active MongoDB
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await User.hashPassword(password);

  const newUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: role ? role.toUpperCase() : 'USER',
    bio: bio || '',
    location: location || { city: '', coordinates: [72.8777, 19.0760] },
    interests: Array.isArray(interests) ? interests : []
  });

  const token = generateToken(newUser);

  return {
    user: sanitizeUser(newUser),
    token
  };
};

/**
 * Authenticate user with email and password
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // If MongoDB is offline, use In-Memory Store
  if (!isDbConnected()) {
    const user = await inMemoryStore.findUserByEmail(normalizedEmail);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === 'SUSPENDED' || user.isSuspended) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      error.isSuspended = true;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user);
    return {
      user: sanitizeUser(user),
      token
    };
  }

  // Active MongoDB
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.status === 'SUSPENDED' || user.isSuspended) {
    const error = new Error('Your account has been suspended. Please contact support.');
    error.statusCode = 403;
    error.isSuspended = true;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token
  };
};

/**
 * Get current authenticated user profile
 */
const getCurrentUser = async (userId) => {
  if (!isDbConnected()) {
    const user = await inMemoryStore.findUserById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return sanitizeUser(user);
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(user);
};

/**
 * Update current authenticated user profile
 * Strictly whitelists permitted fields, preventing privilege or email/password tampering
 */
const updateProfile = async (userId, updateData) => {
  const sanitizedUpdate = {};

  if (updateData.name !== undefined) {
    sanitizedUpdate.name = updateData.name.trim();
  }
  if (updateData.bio !== undefined) {
    sanitizedUpdate.bio = updateData.bio.trim();
  }
  if (updateData.profileImage !== undefined) {
    sanitizedUpdate.profileImage = updateData.profileImage.trim();
  }
  if (updateData.location !== undefined) {
    if (typeof updateData.location === 'object' && updateData.location !== null) {
      sanitizedUpdate.location = {
        city: updateData.location.city !== undefined ? updateData.location.city.trim() : '',
        coordinates: Array.isArray(updateData.location.coordinates)
          ? updateData.location.coordinates
          : [72.8777, 19.0760]
      };
    } else if (typeof updateData.location === 'string') {
      sanitizedUpdate.location = {
        city: updateData.location.trim(),
        coordinates: [72.8777, 19.0760]
      };
    }
  }
  if (Array.isArray(updateData.interests)) {
    sanitizedUpdate.interests = updateData.interests;
  }

  if (!isDbConnected()) {
    const updatedUser = await inMemoryStore.updateUser(userId, sanitizedUpdate);
    if (!updatedUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return sanitizeUser(updatedUser);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: sanitizedUpdate },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return sanitizeUser(updatedUser);
};

/**
 * Verify Google ID Token server-side using google-auth-library
 */
const { OAuth2Client } = require('google-auth-library');

const verifyGoogleIdToken = async (idToken) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    const error = new Error('Google Sign-In is not configured on the server (GOOGLE_CLIENT_ID missing)');
    error.statusCode = 500;
    throw error;
  }

  const client = new OAuth2Client(googleClientId);
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId
    });
  } catch (err) {
    console.error('[GoogleAuth] Token verification failed:', err.message);
    const error = new Error('Invalid or expired Google authentication token');
    error.statusCode = 401;
    throw error;
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    const error = new Error('Invalid Google identity token');
    error.statusCode = 401;
    throw error;
  }

  if (!payload.email) {
    const error = new Error('Google identity does not include an email address');
    error.statusCode = 400;
    throw error;
  }

  if (payload.email_verified === false) {
    const error = new Error('Google email address is not verified');
    error.statusCode = 400;
    throw error;
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
  };
};

/**
 * Authenticate or register a user using a verified Google ID Token
 */
const googleAuthUser = async (credential) => {
  const googleProfile = await verifyGoogleIdToken(credential);
  const { googleId, email, name, picture } = googleProfile;

  // In-Memory Store fallback if MongoDB is offline
  if (!isDbConnected()) {
    let user = await inMemoryStore.findUserByGoogleId(googleId);
    if (!user) {
      user = await inMemoryStore.findUserByEmail(email);
      if (user) {
        // Link googleId to existing user
        user = await inMemoryStore.updateUser(user._id || user.id, { googleId });
      } else {
        // Create new user in memory
        user = await inMemoryStore.createGoogleUser({
          name,
          email,
          googleId,
          profileImage: picture
        });
      }
    }

    if (user && (user.status === 'SUSPENDED' || user.isSuspended)) {
      const error = new Error('Your account has been suspended. Please contact support.');
      error.statusCode = 403;
      error.isSuspended = true;
      throw error;
    }

    const token = generateToken(user);
    return {
      user: sanitizeUser(user),
      token
    };
  }

  // Active MongoDB
  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      // Safely link Google ID to existing account; preserve existing profile & role
      user.googleId = googleId;
      await user.save();
    } else {
      // Create new LocalVibe user record
      user = await User.create({
        name: name.trim(),
        email: email,
        googleId: googleId,
        profileImage: picture,
        role: 'USER',
        status: 'ACTIVE',
        isSuspended: false,
        bio: '',
        location: { city: '', coordinates: [72.8777, 19.0760] },
        interests: []
      });
    }
  }

  if (user && (user.status === 'SUSPENDED' || user.isSuspended)) {
    const error = new Error('Your account has been suspended. Please contact support.');
    error.statusCode = 403;
    error.isSuspended = true;
    throw error;
  }

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token
  };
};

module.exports = {
  registerUser,
  loginUser,
  googleAuthUser,
  verifyGoogleIdToken,
  getCurrentUser,
  updateProfile,
  sanitizeUser
};


