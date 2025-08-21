require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory user database
let users = [];
let idCounter = 1;

// POST: create new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.json({ error: 'username is required' });
  }
  const _id = idCounter++.toString();
  const user = { _id, username, log: [] };
  users.push(user);
  res.json({ username, _id });
});

// GET: list all users
app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ _id: u._id, username: u.username })));
});

// POST: add exercise to user
app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id;
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.json({ error: 'user not found' });
  }
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = req.body.date;
  if (!description || isNaN(duration)) {
    return res.json({ error: 'description and duration are required' });
  }
  let dateObj;
  if (date) {
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.json({ error: 'invalid date' });
    }
  } else {
    dateObj = new Date();
  }
  const dateStr = dateObj.toDateString();
  const exercise = { description, duration, date: dateStr };
  user.log.push(exercise);
  res.json({
    username: user.username,
    description,
    duration,
    date: dateStr,
    _id: user._id
  });
});

// GET: get user logs
app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.json({ error: 'user not found' });
  }
  let log = [...user.log];
  const { from, to, limit } = req.query;
  let fromDate = from ? new Date(from) : null;
  let toDate = to ? new Date(to) : null;
  if (fromDate && isNaN(fromDate.getTime())) fromDate = null;
  if (toDate && isNaN(toDate.getTime())) toDate = null;
  if (fromDate || toDate) {
    fromDate = fromDate || new Date(0);
    toDate = toDate || new Date();
    log = log.filter(ex => {
      const exDate = new Date(ex.date);
      return exDate >= fromDate && exDate <= toDate;
    });
  }
  if (limit) {
    const lim = parseInt(limit);
    if (!isNaN(lim)) {
      log = log.slice(0, lim);
    }
  }
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
});

// Listen
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});