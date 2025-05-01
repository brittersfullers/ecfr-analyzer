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

// Enable CORS for all routes
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Endpoint for small_summary.json
app.get('/small_summary.json', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: 'small_summary.json'
    };
    
    const data = await s3.getObject(params).promise();
    res.json(JSON.parse(data.Body.toString()));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data from S3' });
  }
});

// Endpoint for specific title files
app.get('/json_titles/:filename', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `json_titles/${req.params.filename}`
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
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 