require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const pairRoutes = require('./pair');

// Serve the HTML file at the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

// Optional: Serve static files if you have CSS/JS/images (not needed if everything is CDN)
app.use(express.static(__dirname));

// API route (your existing code)
app.use('/code', pairRoutes);

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VERONICA Pair Code server running on port ${PORT}`);
});
