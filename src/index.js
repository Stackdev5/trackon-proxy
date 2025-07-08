const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const TRACKON_BOOKING_URL = 'http://trackon.in:5455/CrmApi/Crm/UploadPickupRequestWithoutDockNo';

app.post('/proxy', async (req, res) => {
  try {
    const response = await axios.post(TRACKON_BOOKING_URL, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/', (req, res) => {
  res.send('Trackon Proxy Server Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
