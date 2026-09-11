/**
 * config/db.js
 * ------------
 * Connects to MongoDB using Mongoose.
 * Called once at server startup from server.js.
 */

const mongoose = require('mongoose');
const { getFirstEnv, getRequiredFirstEnv } = require('./env');

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/reliefos';

const redactUri = (uri) => {
  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = '***';
    }
    if (parsed.username) {
      parsed.username = '***';
    }
    return parsed.toString();
  } catch {
    return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//***:***@');
  }
};

const getCandidateUris = () => {
  const configured = process.env.NODE_ENV === 'production'
    ? getRequiredFirstEnv('MONGO_URI', 'MONGODB_URI')
    : getFirstEnv('MONGO_URI', 'MONGODB_URI');
  const configuredUri = configured.value;
  const localUri = process.env.MONGO_URI_LOCAL?.trim() || LOCAL_FALLBACK_URI;
  const candidates = [];

  if (configuredUri) {
    candidates.push(configuredUri);
  }

  if (process.env.NODE_ENV !== 'production' && localUri && localUri !== configuredUri) {
    candidates.push(localUri);
  }

  return candidates;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const candidateUris = getCandidateUris();
  const dbName = process.env.MONGO_DB_NAME?.trim() || 'reliefos';
  let lastError = null;

  if (!candidateUris.length) {
    throw new Error('Missing MongoDB connection string. Set MONGO_URI or MONGODB_URI.');
  }

  if (candidateUris[0]?.includes('<')) {
    throw new Error('MongoDB connection string is still a placeholder. Replace MONGO_URI or MONGODB_URI with your MongoDB Atlas URI.');
  }

  for (const uri of candidateUris) {
    try {
      const conn = await mongoose.connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 5000,
      });

      if (uri !== candidateUris[0]) {
        console.warn(`Primary MongoDB unavailable. Falling back to local database at ${uri}`);
      }

      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection failed for ${redactUri(uri)}: ${error.message}`);

      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
    }
  }

  if (lastError) {
    console.error('No MongoDB connection could be established.');
    throw lastError;
  }
};

module.exports = connectDB;
