const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const Database = require('better-sqlite3');
const compression = require('compression');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(compression());
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'sahaara_secret_key_123';
const DB_PATH = path.join(__dirname, 'sahaara.db');

// Initialize Database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // High performance mode

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    userId TEXT,
    condition TEXT,
    time TEXT,
    urgency TEXT,
    createdAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Migration from JSON if exists
const JSON_DB_PATH = path.join(__dirname, 'db.json');
if (require('fs').existsSync(JSON_DB_PATH)) {
  try {
    const jsonData = JSON.parse(require('fs').readFileSync(JSON_DB_PATH));
    const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, ?)');
    const insertHistory = db.prepare('INSERT OR IGNORE INTO chat_history (id, userId, condition, time, urgency, createdAt) VALUES (?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction((data) => {
      data.users.forEach(u => insertUser.run(u.id, u.name, u.email, u.password, u.createdAt));
      data.chatThreads.forEach(t => insertHistory.run(t.id, t.userId, t.condition, t.time, t.urgency, t.createdAt));
    });
    transaction(jsonData);
    // Rename old DB to avoid repeating migration
    require('fs').renameSync(JSON_DB_PATH, JSON_DB_PATH + '.bak');
    console.log('Successfully migrated data from JSON to SQLite');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

app.use(cors());
app.use(express.json());

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../dist')));

// --- AUTHENTICATION ENDPOINTS ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Quick existence check
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Minimum rounds (4) for lightning fast auth in dev mode
    const hashedPassword = await bcrypt.hash(password, 4);
    const userId = Date.now().toString();
    const createdAt = new Date().toISOString();

    db.prepare('INSERT INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(userId, name, email, hashedPassword, createdAt);

    const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn: '30d' });
    res.status(201).json({ 
      token, 
      user: { id: userId, name, email },
      history: []
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '30d' });
    const history = db.prepare('SELECT * FROM chat_history WHERE userId = ? ORDER BY createdAt DESC LIMIT 10').all(user.id);
    
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email },
      history
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// --- USER DATA ENDPOINTS ---

// Get User History
app.get('/api/user/history', authenticate, (req, res) => {
  const history = db.prepare('SELECT * FROM chat_history WHERE userId = ? ORDER BY createdAt DESC').all(req.user.id);
  res.json(history);
});

// Save Chat Entry
app.post('/api/user/history', authenticate, (req, res) => {
  const { condition, time, urgency } = req.body;
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  db.prepare('INSERT INTO chat_history (id, userId, condition, time, urgency, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, condition, time, urgency, createdAt);

  res.status(201).json({ id, condition, time, urgency, createdAt });
});

// Handle React routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Sahaara AI Server (High Performance) running on port ${PORT}`);
});
