// Vercel Serverless Fix - Simplified approach
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Basic CORS for serverless
app.use(cors({
  origin: ['https://gro-chain.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

// Basic middleware
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Serverless test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Simple auth test endpoint
app.post('/api/auth/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Auth test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Simple login endpoint (without database for now)
app.post('/api/auth/login', (req, res) => {
  res.json({
    status: 'success',
    message: 'Login endpoint working!',
    data: {
      user: 'test@example.com',
      token: 'test-token-123'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'serverless'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'GroChain Backend API - Serverless Version',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
