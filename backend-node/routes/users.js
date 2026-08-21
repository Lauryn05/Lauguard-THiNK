const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// POST /api/users - add a new user
router.post('/', async (req, res) => {
  const { username, full_name, email, department_id, passwd } = req.body;

  if (!username || !email || !passwd || !department_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(passwd, 10);

    const result = await pool.query(
      `INSERT INTO users (username, full_name, email, department_id, passwd)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [username, full_name, email, department_id, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding user:', err);
    if (err.code === '23505') { // unique violation
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;
