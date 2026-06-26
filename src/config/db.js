const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db = null;

async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db('obstakl');
    console.log('MongoDB connected successfully to database:', db.databaseName);
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

module.exports = { connectDB, getDB, client };
