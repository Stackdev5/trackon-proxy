const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// 🟢 Trackon API URLs
const trackonBookingUrl = 'http://trackon.in:5455/CrmApi/Crm/UploadPickupRequestWithoutDockNo';
const trackonTrackingUrl = 'https://api.trackon.in/CrmApi/t1/AWBTrackingCustomer';

// 📦 Booking proxy route
app.post("/proxy/booking", async (req, res) => {
  try {
    console.log('📦 Booking request received:', JSON.stringify(req.body, null, 2));
    
    const response = await axios.post(trackonBookingUrl, req.body, {
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Trackon-Proxy-Server"
      },
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log('✅ Trackon booking response:', response.data);
    
    // Check if response contains AWB number
    const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const awbMatch = responseText.match(/Docket No\. ?:?\s*(\d+)/);
    
    if (awbMatch) {
      res.json({
        success: true,
        awb_number: awbMatch[1],
        message: 'Shipment created successfully via Render.com proxy',
        raw_response: response.data
      });
    } else {
      res.json({
        success: false,
        message: 'AWB not found in response',
        raw_response: response.data
      });
    }
    
  } catch (error) {
    console.error('❌ Booking error:', error.message);
    
    if (error.response) {
      console.error('Error response:', error.response.data);
      res.status(error.response.status).json({ 
        success: false,
        error: "Booking failed", 
        details: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: "Network error", 
        details: error.message 
      });
    }
  }
});

// 📍 Tracking proxy route
app.get("/proxy/tracking", async (req, res) => {
  try {
    const { AWBNo, AppKey, userID, Password } = req.query;
    
    if (!AWBNo || !AppKey || !userID || !Password) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }
    
    const trackingUrl = `${trackonTrackingUrl}?AWBNo=${AWBNo}&AppKey=${AppKey}&userID=${userID}&Password=${Password}`;
    
    console.log('📍 Tracking request for AWB:', AWBNo);
    
    const response = await axios.get(trackingUrl, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Trackon-Proxy-Server"
      },
      timeout: 60000
    });
    
    console.log('✅ Tracking response received');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Tracking error:', error.message);
    res.status(500).json({ 
      success: false,
      error: "Tracking failed", 
      details: error.message 
    });
  }
});

// 🏠 Health check route
app.get("/", (req, res) => {
  res.json({
    status: "🚀 Trackon Proxy Server Running",
    timestamp: new Date().toISOString(),
    endpoints: {
      booking: "/proxy/booking (POST)",
      tracking: "/proxy/tracking (GET)"
    }
  });
});

// 🔍 Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Trackon Proxy Server running on port ${PORT}`);
  console.log(`📦 Booking endpoint: /proxy/booking`);
  console.log(`📍 Tracking endpoint: /proxy/tracking`);
});
