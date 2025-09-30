const db = require('./database/db.js');
var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// import { v4 as uuidv4 } from 'uuid';

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(cors());
app.listen(4001, function () {
  console.log('CORS-enabled web server listening on port 4001');
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status, 500);
  res.render('error');
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `);
    stmt.run(name, email, password);

    res.json({ message: 'user registered' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exist' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// second iteration uniqe IDs
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const userId = uuidv4(); // теперь это будет значение id

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, name, email, password);

    res.json({ message: 'user registered', id: userId });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exist' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // ищем пользователя
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?');
  const user = stmt.get(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  // обновляем last_login (ISO строка даты/времени)
  const now = new Date().toISOString();
  const updateStmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
  updateStmt.run(now, user.id);

  // возвращаем обновлённого пользователя
  const updatedUser = { ...user, last_login: now };

  res.json({
    message: 'successes login',
    user: updatedUser,
  });
});

app.get('/users', (req, res) => {
  try {
    // выбираем всех пользователей, сортируем по last_login (сначала новые)
    const stmt = db.prepare(`
      SELECT id, name, email, status, last_login, created_at
      FROM users
      ORDER BY last_login DESC
    `);
    console.log(stmt);

    const users = stmt.all();

    res.json({ users });
  } catch (err) {
    console.error('Getting users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = app;
