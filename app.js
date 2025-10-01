import db from './database/db.js';
import createError from 'http-errors';
import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import indexRouter from './routes/index.js'; // добавь .js
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// React build (frontend/tasking5/build)
app.use(express.static(path.join(__dirname, "frontend/tasking5/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/tasking5/build/index.html"));
});

// Роуты
app.use('/', indexRouter);

// API маршруты
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    const userId = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, name, email, password);
    res.json({ message: 'user registered', id: userId });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Email already exist' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
  const user = stmt.get(email, password);
  if (!user) return res.status(401).json({ error: 'Incorrect email or password' });

  const now = new Date().toISOString();
  const updateStmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
  updateStmt.run(now, user.id);
  const updatedUser = { ...user, last_login: now };

  const token = jwt.sign({ id: user.id, email: user.email, status: user.status }, 'MY_SECRET_KEY', { expiresIn: '1h' });
  res.json({ message: 'successes login', user: updatedUser, token });
});

app.get('/users', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, email, status, last_login, created_at
      FROM users
      ORDER BY last_login DESC
    `);
    const users = stmt.all();
    res.json({ users });
  } catch (err) {
    console.error('Getting users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/users', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Need array with ids for remove users' });

  try {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`);
    const result = stmt.run(ids);
    res.json({ message: 'users deleted', deleted: result.changes });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/users/status', (req, res) => {
  const { ids, status } = req.body;
  const allowedStatuses = ['unverified', 'active', 'blocked'];

  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Нужен массив id пользователей' });
  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });

  try {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`UPDATE users SET status = ? WHERE id IN (${placeholders})`);
    const result = stmt.run(status, ...ids);
    res.json({ message: 'Статус обновлён', updated: result.changes });
  } catch (err) {
    console.error('Ошибка при обновлении статуса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare(`
      SELECT id, name, email, status, last_login, created_at
      FROM users
      WHERE id = ?
    `);
    const user = stmt.get(id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error('Ошибка при получении пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Запуск сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;