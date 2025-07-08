const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
  try {
    const response = await axios.post('http://trackon.in:5455/CrmApi/Crm/UploadPickupRequestWithoutDockNo', req.body);
    res.status(200).json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => console.log('Proxy server running on port 3000'));
