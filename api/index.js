const app = require('../src/app');
const { connectDB } = require('../src/config/db');

let dbConnectPromise;

async function ensureDbConnection() {
  if (!dbConnectPromise) {
    dbConnectPromise = connectDB();
  }
  await dbConnectPromise;
}

module.exports = async (req, res) => {
  await ensureDbConnection();
  return app(req, res);
};
