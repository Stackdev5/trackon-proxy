const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trackon API endpoints
const TRACKON_BOOKING_URL = 'http://trackon.in:5455/CrmApi/Crm/UploadPickupRequestWithoutDockNo';
const TRACKON_TRACKING_URL = 'https://api.trackon.in/CrmApi/t1/AWBTrackingCustomer';

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Trackon Proxy Server is running',
        endpoints: {
            booking: '/api/trackon/booking',
            tracking: '/api/trackon/tracking'
        },
        timestamp: new Date().toISOString()
    });
});

// Trackon Booking API Proxy
app.post('/api/trackon/booking', async (req, res) => {
    try {
        console.log('Booking request received:', JSON.stringify(req.body, null, 2));
        
        // Validate required fields
        const requiredFields = ['Appkey', 'userId', 'password', 'ActionType'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    error: `Missing required field: ${field}`
                });
            }
        }
        
        // Forward request to Trackon API
        const response = await axios.post(TRACKON_BOOKING_URL, req.body, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Trackon-Proxy-Server/1.0'
            },
            timeout: 30000 // 30 seconds timeout
        });
        
        console.log('Trackon booking response:', response.data);
        
        // Parse AWB number from response
        let awbNumber = null;
        if (typeof response.data === 'string') {
            const awbMatch = response.data.match(/Docket No\. ?:?\s*(\d+)/);
            if (awbMatch) {
                awbNumber = awbMatch[1];
            }
        }
        
        res.json({
            success: true,
            data: {
                awb_number: awbNumber,
                raw_response: response.data,
                status_code: response.status
            }
        });
        
    } catch (error) {
        console.error('Booking API error:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
});

// Trackon Tracking API Proxy
app.get('/api/trackon/tracking', async (req, res) => {
    try {
        const { AWBNo, AppKey, userID, Password } = req.query;
        
        if (!AWBNo || !AppKey || !userID || !Password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: AWBNo, AppKey, userID, Password'
            });
        }
        
        const trackingUrl = `${TRACKON_TRACKING_URL}?AWBNo=${AWBNo}&AppKey=${AppKey}&userID=${userID}&Password=${Password}`;
        
        const response = await axios.get(trackingUrl, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'User-Agent': 'Trackon-Proxy-Server/1.0'
            },
            timeout: 30000
        });
        
        console.log('Tracking response:', response.data);
        
        res.json({
            success: true,
            data: response.data
        });
        
    } catch (error) {
        console.error('Tracking API error:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available_endpoints: [
            'GET /',
            'POST /api/trackon/booking',
            'GET /api/trackon/tracking'
        ]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Trackon Proxy Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
});
