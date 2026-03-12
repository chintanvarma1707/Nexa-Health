const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'sahaara_ultra_secure_secret_789';

// In-memory storage for Vercel serverless (stateless between invocations)
// For production, consider using a cloud database like Supabase, PlanetScale, or MongoDB Atlas
let users = [];
let chatHistory = [];

// Helper: parse body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// Helper: authenticate
function authenticate(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    return null;
  }
}

// Helper: send JSON response
function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url.replace(/^\/api/, '');

  // --- SIGNUP ---
  if (req.method === 'POST' && url === '/auth/signup') {
    const { name, email, password } = await parseBody(req);

    const existing = users.find(u => u.email === email);
    if (existing) {
      return sendJson(res, 400, { message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 4);
    const userId = Date.now().toString();
    const createdAt = new Date().toISOString();
    const newUser = { id: userId, name, email, password: hashedPassword, createdAt };
    users.push(newUser);

    const token = jwt.sign({ id: userId, email }, SECRET_KEY, { expiresIn: '30d' });
    return sendJson(res, 201, {
      token,
      user: { id: userId, name, email },
      history: []
    });
  }

  // --- LOGIN ---
  if (req.method === 'POST' && url === '/auth/login') {
    const { email, password } = await parseBody(req);

    const user = users.find(u => u.email === email);
    if (!user) {
      return sendJson(res, 400, { message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendJson(res, 400, { message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '30d' });
    const history = chatHistory.filter(h => h.userId === user.id).slice(0, 10);

    return sendJson(res, 200, {
      token,
      user: { id: user.id, name: user.name, email: user.email },
      history
    });
  }

  // --- GET HISTORY ---
  if (req.method === 'GET' && url === '/user/history') {
    const decoded = authenticate(req);
    if (!decoded) return sendJson(res, 401, { message: 'No token, authorization denied' });

    const history = chatHistory.filter(h => h.userId === decoded.id);
    return sendJson(res, 200, history);
  }

  // --- SAVE HISTORY ---
  if (req.method === 'POST' && url === '/user/history') {
    const decoded = authenticate(req);
    if (!decoded) return sendJson(res, 401, { message: 'No token, authorization denied' });

    const { condition, time, urgency } = await parseBody(req);
    const entry = {
      id: Date.now().toString(),
      userId: decoded.id,
      condition,
      time,
      urgency,
      createdAt: new Date().toISOString()
    };
    chatHistory.push(entry);

    return sendJson(res, 201, entry);
  }

  // --- 404 ---
  return sendJson(res, 404, { message: 'API route not found' });
};
