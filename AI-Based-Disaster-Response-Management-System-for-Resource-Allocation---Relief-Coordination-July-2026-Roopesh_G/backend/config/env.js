const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '..', '.env'),
];

let loaded = false;

const loadEnv = () => {
  if (loaded) {
    return;
  }

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }

  loaded = true;
};

const getRequiredEnv = (key) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getFirstEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return { key, value };
    }
  }

  return { key: keys[0], value: '' };
};

const getRequiredFirstEnv = (...keys) => {
  const result = getFirstEnv(...keys);
  if (!result.value) {
    throw new Error(`Missing required environment variable: ${keys.join(' or ')}`);
  }

  return result;
};

module.exports = { loadEnv, getRequiredEnv, getFirstEnv, getRequiredFirstEnv };
