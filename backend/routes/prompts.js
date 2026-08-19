const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// GET /api/prompts → get recent prompts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.prompt_id AS id,
        p.prompt_text AS prompt,
        d.department_name AS department,
        p.severity,
        (p.created_date + p.created_time) AS timestamp
      FROM prompts_log p
      JOIN departments d ON p.department_id = d.department_id
      ORDER BY p.created_date DESC, p.created_time DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching prompts:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/prompts/by-department → count prompts grouped by department
router.get('/by-department', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.department_name AS name,
        COUNT(*)::int AS value
      FROM prompts_log p
      JOIN departments d ON p.department_id = d.department_id
      GROUP BY d.department_name
      ORDER BY value DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching by department:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/prompts/timeline → monthly timeline
router.get('/timeline', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(p.created_date, 'Mon YYYY') AS name,
        COUNT(*)::int AS prompts,
        COUNT(*) FILTER (WHERE p.status = 'flagged')::int AS adversarial
      FROM prompts_log p
      GROUP BY DATE_TRUNC('month', p.created_date), name
      ORDER BY DATE_TRUNC('month', p.created_date)
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/prompts/stats → dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalPrompts, adversarial, activeDepartments, securityRules] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS value FROM prompts_log`),
      pool.query(`SELECT COUNT(*)::int AS value FROM prompts_log WHERE status = 'flagged'`),
      pool.query(`SELECT COUNT(DISTINCT department_id)::int AS value FROM prompts_log`),
      pool.query(`SELECT COUNT(*)::int AS value FROM security_rules`)
    ]);

    res.json({
      totalPrompts: totalPrompts.rows[0].value,
      adversarialAttempts: adversarial.rows[0].value,
      activeDepartments: activeDepartments.rows[0].value,
      securityRules: securityRules.rows[0].value
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/prompts/logs → get all prompt logs
router.get('/logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.prompt_id AS id,
        (p.created_date + p.created_time) AS timestamp,
        d.department_name AS department,
        u.username,
        p.prompt_text AS prompt,
        CASE WHEN p.status = 'flagged' THEN true ELSE false END AS flagged
      FROM prompts_log p
      LEFT JOIN departments d ON p.department_id = d.department_id
      LEFT JOIN users u ON p.user_id = u.user_id
      ORDER BY timestamp DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching prompt logs:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/prompts/departments → department details
router.get('/departments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.department_id AS id,
        d.department_name AS name,
        COUNT(DISTINCT u.user_id) AS "membersCount",
        (SELECT COUNT(*) FROM security_rules) AS "rulesCount",
        CASE 
          WHEN COUNT(u.user_id) > 0 THEN 'active'
          ELSE 'inactive'
        END AS status
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.department_id
      GROUP BY d.department_id, d.department_name
      ORDER BY d.department_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// PATCH /api/prompts/departments/:id → toggle department status
router.patch('/departments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE departments SET status = $1 WHERE department_id = $2 RETURNING department_id, department_name, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating department status:', err);
    res.status(500).json({ error: 'Failed to update department status' });
  }
});

// POST /api/prompts/departmentsadd → create a new department
// ----------------------
router.post('/departmentsadd', async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Department name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO departments (department_name) 
       VALUES ($1) 
       RETURNING department_id AS id, department_name AS name`,
      [name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});
module.exports = router;
