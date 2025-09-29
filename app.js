var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(cors());
app.listen(4000, function () {
  console.log('CORS-enabled web server listening on port 4000');
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

//nodemailer
const nodemailer = require('nodemailer');

// Временная "БД" (можно заменить на настоящую)
let users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    lastSeen: '2025-09-28',
  },
];

// Транспорт для отправки почты
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anton.krivelo98@gmail.com', // замени
    pass: 'nvwd ccqk peui sace', // замени
  },
});

// 📌 Регистрация
app.post('/register', async (req, res) => {
  console.log('BODY:', req.body);
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, Email and password are required' });
  }

  // Проверка на существующего пользователя
  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Добавляем нового пользователя
  const newUser = {
    id: String(users.length + 1),
    name,
    email,
    password, // ⚠️ хранить пароль в открытом виде нельзя, позже нужно хэшировать!
    status: 'pending',
    lastSeen: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);

  // Ссылка для активации
  const activationLink = `http://localhost:4000/activate?email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: '"My App" <yourmail@gmail.com>',
      to: email,
      subject: 'Account Activation',
      html: `
        <h2>Hello, ${name}!</h2>
        <p>Thank you for registering. Please activate your account:</p>
        <a href="${activationLink}" 
           style="display:inline-block;padding:10px 20px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:5px;">
           Activate
        </a>
      `,
    });

    res.json({ message: 'Registration successful! Check your email to verify your account.' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Could not send activation email' });
  }
});

// 📌 Активация
app.get('/activate', (req, res) => {
  const { email } = req.query;
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(400).send('Invalid activation link');
  }

  user.status = 'active';
  res.send(`Account <b>${user.email}</b> has been successfully activated!`);
});

//nodemailer

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
