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

// Hello endpoint (kept from template)
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory URL database
let urlDatabase = [];
let idCounter = 1;

// POST: create short URL
app.post('/api/shorturl', (req, res) => {
  let inputUrl = req.body.url;

  try {
    const parsed = new URL(inputUrl); // built-in URL validator
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    // If URL already exists, return existing short_url
    let existing = urlDatabase.find(u => u.original_url === inputUrl);
    if (existing) {
      return res.json(existing);
    }

    // Store new one
    let entry = {
      original_url: inputUrl,
      short_url: idCounter++
    };
    urlDatabase.push(entry);
    res.json(entry);

  } catch (e) {
    return res.json({ error: 'invalid url' });
  }
});

// GET: redirect from short URL
app.get('/api/shorturl/:short', (req, res) => {
  let short = parseInt(req.params.short);
  let entry = urlDatabase.find(u => u.short_url === short);

  if (entry) {
    return res.redirect(entry.original_url);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});

// Listen
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

