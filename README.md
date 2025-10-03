# IRCTC Demo (Express + SQLite)

This small demo serves the static frontend and provides a simple Express + SQLite backend.

Quick start

1. Install dependencies

```bash
cd /Users/mss17082004gmail.com/Desktop/aa
npm install
```

2. Start the server

```bash
npm start
```

3. Open http://localhost:3000 in your browser.

What changed

- `server.js` - Express server, SQLite DB, and simple API endpoints for register/login/search/bookings.
- `package.json` - project manifest.

Notes

- This demo uses plaintext passwords for simplicity. For production, always hash passwords and use HTTPS.
- The frontend (`index.html` + `app.js`) will call the API endpoints if the server is running on the same origin. If not running, the app falls back to the in-memory sample data.
