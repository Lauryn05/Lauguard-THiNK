const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '8h';

/**
 * Shared function to handle login logic
 */
async function authenticateUser(email, passwd) {
  const { rows } = await pool.query(
    `SELECT 
       u.user_id, u.username, u.email, u.passwd, 
       u.department_id, d.department_name
     FROM users u
     JOIN departments d ON u.department_id = d.department_id
     WHERE u.email = $1`,
    [email]
  );

  if (rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(passwd, user.passwd);

  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
}

/**
 * ADMIN LOGIN
 * POST /api/auth/admin-login
 */
router.post('/admin-login', async (req, res) => {
  const { email, passwd } = req.body;

  if (!email || !passwd) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await authenticateUser(email, passwd);

    // Only allow Administration department
    if (user.department_name.toLowerCase() !== 'administration') {
      return res.status(403).json({ error: 'Access denied: Not an admin' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        department_id: user.department_id,
        department_name: user.department_name,
        role: 'admin',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        department: user.department_name,
      },
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/**
 * USER LOGIN
 * POST /api/auth/user-login
 */
router.post('/user-login', async (req, res) => {
  const { email, passwd } = req.body;

  if (!email || !passwd) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await authenticateUser(email, passwd);

    // Reject Administration users here if you want separate login paths
    if (user.department_name.toLowerCase() === 'administration') {
      return res.status(403).json({ error: 'Admins must use admin login page' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        department_id: user.department_id,
        department_name: user.department_name,
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'User login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        department: user.department_name,
      },
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
