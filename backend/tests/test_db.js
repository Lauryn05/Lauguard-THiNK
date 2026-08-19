const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected:', res.rows);
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    pool.end();
  }
})();
