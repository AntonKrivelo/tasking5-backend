var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
const PORT = 4000;

app.use(cors());
app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80');
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Временно храним пользователей в массиве
let users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    lastSeen: '2025-09-28',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'blocked',
    lastSeen: '2025-09-25',
  },
];

app.get('/', (req, res) => {
  res.json(users);
});

app.get('/admin/users', (req, res) => {
  res.json(users);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  res.json({
    message: 'success',
    data: {
      email,
      password,
    },
  });
});

app.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, Email and password are required' });
  }

  res.json({
    message: 'success',
    data: {
      email,
      password,
      name,
    },
  });
});

// app.post('/register', (req, res) => {
//   const { name, email, password } = req.body;

//   if (!name  !email  !password) {
//     return res.status(400).json({ message: 'Заполните все поля' });
//   }

//   // Здесь можно добавить сохранение в базу
//   console.log('Получены данные:', { name, email, password });

//   res.status(201).json({ message: 'Регистрация успешна' });
// });

// app.listen(4000, () => {
//   console.log(`Сервер работает на http://localhost:4000`);
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status, 500);
  res.render('error');
});

module.exports = app;
