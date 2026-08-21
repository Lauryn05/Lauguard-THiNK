const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/rules → get all rules
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rule_id AS id,
        rule_name AS name,
        pattern,
        description,
        replacement,
        status,
        created_at
      FROM security_rules
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rules:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/rules → add a new rule
router.post('/', async (req, res) => {
  const { name, pattern, description, replacement, status } = req.body;
  if (!name || !pattern) {
    return res.status(400).json({ error: 'Name and pattern are required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO security_rules (rule_name, pattern, description, replacement, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING rule_id AS id, rule_name AS name, pattern, description, replacement, status, created_at
    `, [name, pattern, description || '', replacement || '', status || 'active']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating rule:', err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PATCH /api/rules/:id → update a rule (e.g., active/inactive)
router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, pattern, description, replacement, status } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`rule_name = $${idx++}`); values.push(name); }
    if (pattern !== undefined) { fields.push(`pattern = $${idx++}`); values.push(pattern); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (replacement !== undefined) { fields.push(`replacement = $${idx++}`); values.push(replacement); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    values.push(id); // For WHERE clause
    const query = `UPDATE security_rules SET ${fields.join(', ')} WHERE rule_id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating rule:', err);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

module.exports = router;
