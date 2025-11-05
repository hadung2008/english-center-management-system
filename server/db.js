const { Pool } = require('pg');

// IMPORTANT:
// Replace these with your actual PostgreSQL connection details.
// const pool = new Pool({
//   user: 'engcenter_user', // or your postgres user
//   host: 'dpg-d45ccsadbo4c73fq2lag-a.singapore-postgres.render.com',
//   database: 'engcenter',
//   password: 'o0XdyjAJF6a6mdCBx9sNCNIIhgfSHHNQ', // your postgres password
//   port: 5432,
//   ssl: {
//     rejectUnauthorized: false // Required for Render.com PostgreSQL
//   },
//   max: 20, // Maximum number of clients in the pool
//   idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
//   connectionTimeoutMillis: 2000, // How long to wait for a connection
// });

const pool = new Pool({
  user: 'engcenter_user', // or your postgres user
  host: 'dpg-d45ccsadbo4c73fq2lag-a',
  database: 'engcenter',
  password: 'o0XdyjAJF6a6mdCBx9sNCNIIhgfSHHNQ', // your postgres password
  port: 5432,
  ssl: {
    rejectUnauthorized: false // Required for Render.com PostgreSQL
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});
// Add event listeners for pool connection issues
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

// Wrapper function with retry logic
const queryWithRetry = async (text, params, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (i === maxRetries - 1) throw err; // If all retries failed, throw the error
      if (err.code === 'ECONNRESET' || err.code === '57P01') {
        console.log(`Retry attempt ${i + 1} after connection error`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      throw err; // For other errors, throw immediately
    }
  }
};

module.exports = {
  pool, // Export the pool for transactions
  query: queryWithRetry, // Export the retry-enabled query function
};
