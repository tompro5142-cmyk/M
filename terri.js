// Example entrypoint: ensures error handling and Express setup
require('dotenv').config();
const express = require('express');
const app = express();
const pairRoutes = require('./pair');

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/code', pairRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VERONICA Pair Code server running on port ${PORT}`);
});