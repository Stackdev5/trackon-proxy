const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors()); // Enables CORS for frontend requests
app.use(express.json());

// 🟢 Trackon API URLs
const trackonBookingUrl = 'http://trackon.in:5455/CrmApi/Crm/UploadPickupRequestWithoutDockNo';
const trackonTrackingUrl = 'https://api.trackon.in/CrmApi/t1/AWBTrackingCustomer';

// 📦 Booking proxy route
app.post("/proxy/booking", async (req, res) => {
  try {
    const response = await axios.post(trackonBookingUrl, req.body, {
      headers: { "Content-Type": "application/json" }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Booking failed", details: error.message });
  }
});

// 📦 Tracking proxy route
app.post("/proxy/tracking", async (req, res) => {
  try {
    const response = await axios.post(trackonTrackingUrl, req.body, {
      headers: { "Content-Type": "application/json" }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Tracking failed", details: error.message });
  }
});

// 🏠 Default route
app.get("/", (req, res) => {
  res.send("Trackon Proxy Server Running");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
