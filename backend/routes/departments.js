const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/departments - fetch all departments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT department_id, department_name FROM departments ORDER BY department_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
