const express = require('express');
const cors = require('cors');
const request = require('request');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/proxy', (req, res) => {
  const trackonUrl = 'http://api.trackon.in/Service.svc/your-endpoint'; // replace with actual Trackon URL

  request.post({
    url: trackonUrl,
    json: true,
    body: req.body
  }, (error, response, body) => {
    if (error) return res.status(500).json({ error });
    res.status(response.statusCode).json(body);
  });
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
