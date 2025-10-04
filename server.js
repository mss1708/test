const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000 || process.env.NEXT_LINK;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Initialize SQLite DB
const DB_PATH = path.join(__dirname, 'data.db');
const dbExists = fs.existsSync(DB_PATH);
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  if (!dbExists) {
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )`);

    db.run(`CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pnr TEXT,
      user_email TEXT,
      train TEXT,
      from_station TEXT,
      to_station TEXT,
      date TEXT,
      class TEXT,
      status TEXT,
      fare INTEGER,
      passengers TEXT
    )`);
  }
});

// Simple trains dataset (shared with frontend)
const trains = [
  {
    number: '12951',
    name: 'Mumbai Rajdhani',
    from: 'NDLS',
    to: 'BCT',
    departure: '16:55',
    arrival: '08:35',
    duration: '15h 40m',
    distance: '1384 km',
    classes: {
      '1AC': { fare: 4540, available: 12 },
      '2AC': { fare: 2895, available: 45 },
      '3AC': { fare: 2090, available: 78 }
    }
  },
  {
    number: '12301',
    name: 'Howrah Rajdhani',
    from: 'NDLS',
    to: 'HWH',
    departure: '17:00',
    arrival: '10:05',
    duration: '17h 05m',
    distance: '1441 km',
    classes: {
      '1AC': { fare: 4985, available: 8 },
      '2AC': { fare: 3150, available: 32 },
      '3AC': { fare: 2265, available: 65 }
    }
  },
  {
    number: '12621',
    name: 'Tamil Nadu Express',
    from: 'NDLS',
    to: 'MAS',
    departure: '22:30',
    arrival: '07:40',
    duration: '33h 10m',
    distance: '2180 km',
    classes: {
      'SL': { fare: 825, available: 156 },
      '3AC': { fare: 2185, available: 89 },
      '2AC': { fare: 3140, available: 34 },
      '1AC': { fare: 5230, available: 15 }
    }
  }
];

// Helpers
function generatePNR() {
  return (Math.floor(Math.random() * 9000000000) + 1000000000).toString();
}

// API: Register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
  stmt.run(name || '', email, password, function (err) {
    if (err) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.json({ id: this.lastID, name, email });
  });
});

// API: Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get('SELECT id, name, email, password FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row || row.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ id: row.id, name: row.name, email: row.email });
  });
});

// API: Search trains
app.get('/api/search', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.json({ trains: [] });

  const results = trains.filter(t => (t.from === from && t.to === to) || (t.from === to && t.to === from));
  res.json({ trains: results });
});

// API: Create booking
app.post('/api/bookings', (req, res) => {
  const { userEmail, train, from, to, date, class: cls, fare, passengers } = req.body;
  if (!userEmail || !train || !date) return res.status(400).json({ error: 'Missing fields' });

  const pnr = generatePNR();
  const stmt = db.prepare(`INSERT INTO bookings (pnr, user_email, train, from_station, to_station, date, class, status, fare, passengers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(pnr, userEmail, train, from, to, date, cls, 'Confirmed', fare || 0, JSON.stringify(passengers || []), function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ pnr });
  });
});

// API: Get bookings for user
app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  db.all('SELECT * FROM bookings WHERE user_email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    // parse passengers
    const bookings = rows.map(r => ({
      pnr: r.pnr,
      train: r.train,
      from: r.from_station,
      to: r.to_station,
      date: r.date,
      class: r.class,
      status: r.status,
      fare: r.fare,
      passengers: JSON.parse(r.passengers)
    }));
    res.json({ bookings });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});