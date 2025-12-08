//const { Pool } = require('pg');
//const connectionString = process.env.DATABASE_URL;
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

// const pool = new Pool({
//   user: 'engcenter_user', // or your postgres user
//   host: 'dpg-d45ccsadbo4c73fq2lag-a',
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

//const pool = new Pool({
    //connectionString: 'postgresql://engcenter_user:o0XdyjAJF6a6mdCBx9sNCNIIhgfSHHNQ@dpg-d45ccsadbo4c73fq2lag-a/engcenter'
    // KHÔNG cần cấu hình SSL khi dùng Internal URL
});
// Add event listeners for pool connection issues
//pool.on('error', (err, client) => {
  //console.error('Unexpected error on idle client', err);
//});

//pool.on('connect', () => {
  console.log('Database connected successfully');
//});

const { Pool } = require('pg');

// 1. Đảm bảo biến môi trường DATABASE_URL chứa Chuỗi Kết Nối Pooler của Supabase
// (Ví dụ: postgres://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres)
const connectionString = process.env.SUPABASE_CONNECTION_STRING;

// Cấu hình kết nối
let poolConfig = {
    connectionString: connectionString,
    // Các tùy chọn khác của pool
    max: 20, // Số lượng client tối đa trong pool
    idleTimeoutMillis: 30000, // Thời gian client được phép nhàn rỗi
    connectionTimeoutMillis: 2000, // Thời gian chờ kết nối
};

// 2. Thêm cấu hình SSL nếu bạn sử dụng chuỗi kết nối Supabase trực tiếp
// Supabase yêu cầu kết nối SSL. Khi dùng Pooler, thư viện 'pg' thường tự xử lý
// nhưng nếu có lỗi kết nối SSL trên môi trường cloud, hãy thử bật cấu hình này.
// if (connectionString && connectionString.includes('supabase.co')) {
//     poolConfig.ssl = {
//         rejectUnauthorized: false // Cho phép kết nối qua SSL mặc dù chứng chỉ không được xác thực chính thức (đôi khi cần thiết trên cloud)
//     };
// }
// Tùy chọn: Để an toàn hơn, chỉ nên sử dụng Pooler của Supabase và thường không cần cấu hình SSL thủ công.

const pool = new Pool(poolConfig);

// Thêm listeners cho các vấn đề kết nối
pool.on('error', (err, client) => {
    console.error('Lỗi không mong muốn trên client nhàn rỗi:', err);
});

pool.on('connect', () => {
    console.log('Kết nối Supabase Database thành công');
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
