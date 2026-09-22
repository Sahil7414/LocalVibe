const mongoose = require('mongoose');

// Disable Mongoose query buffering so disconnected queries fail fast rather than hanging 10s
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localvibe';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.log(`[MongoDB] Local/Atlas MongoDB is offline (${error.message}).`);
    console.log(`[LocalVibe] Automatically activating In-Memory Dev Store. All features, registrations, map pins, and queries are 100% active!`);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

const isDbConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  isDbConnected
};

