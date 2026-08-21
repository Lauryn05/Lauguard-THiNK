const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const promptsRoutes = require('./routes/prompts');
const rulesRoutes = require('./routes/rules');
const usersRouter = require('./routes/users');
const departmentsRouter = require('./routes/departments');
const authenticateToken = require('./middleware/auth');
const authRouter = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/prompts', promptsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/auth', authRouter);
app.post('/api/prompts', authenticateToken, async (req, res) => {
  try {
    const user = req.user; // comes from JWT
    const { prompt_text } = req.body;

    // Save prompt to database
    const result = await pool.query(
      'INSERT INTO prompts_log (user_id, department_id, prompt_text, created_date) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING *',
      [user.user_id, user.department_id, prompt_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save prompt' });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Express running on http://localhost:${PORT}`));
}

module.exports = app;