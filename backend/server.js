require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / local database
connectDB();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LocalVibe Backend] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[LocalVibe Backend] Port ${PORT} is already in use.`);
  } else {
    console.error(`[LocalVibe Backend Error]:`, err);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
  // Keep dev server resilient
});

