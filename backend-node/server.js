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

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, such as server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`CORS blocked: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Lauguard Node API',
    message: 'Backend is running'
  });
});

// Routes
app.use('/api/prompts', promptsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/auth', authRouter);

app.post('/api/prompts', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { prompt_text } = req.body;

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
  app.listen(PORT, HOST, () => {
    console.log(`Express running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;