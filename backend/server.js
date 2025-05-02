const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Determine environment prefix
const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod/' : 'staging/';

// Enable CORS with specific configuration
const allowedOrigins = [
  'https://ecfr-analyzer-staging-5b93a7fa9af7.herokuapp.com',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Rejected CORS request from origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
    console.log('Allowed CORS request from origin:', origin);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  next();
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Backend is working!' });
});

// Endpoint for small_summary.json
app.get('/small_summary.json', async (req, res) => {
  try {
    console.log('Attempting to fetch small_summary.json from S3...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('S3 Bucket:', process.env.S3_BUCKET_NAME);
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${process.env.NODE_ENV === 'production' ? 'prod/' : 'staging/'}small_summary.json`
    };
    
    console.log('S3 params:', { ...params, secretAccessKey: '[REDACTED]' });
    
    const data = await s3.getObject(params).promise();
    console.log('Successfully fetched data from S3');
    res.json(JSON.parse(data.Body.toString()));
  } catch (error) {
    console.error('Detailed S3 Error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      region: process.env.AWS_REGION,
      bucket: process.env.S3_BUCKET_NAME,
      key: `${process.env.NODE_ENV === 'production' ? 'prod/' : 'staging/'}small_summary.json`
    });
    res.status(500).json({ error: 'Failed to fetch data from S3', details: error.message });
  }
});

// Endpoint for specific title files
app.get('/json_titles/:filename', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${ENV_PREFIX}json_titles/${req.params.filename}`
    };
    
    const data = await s3.getObject(params).promise();
    res.json(JSON.parse(data.Body.toString()));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data from S3' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  console.log('Catchall route hit for:', req.url);
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
  });
}); 