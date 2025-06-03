const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const knowledgeRoutes = require('./routes/knowledge');
const emailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
    try {
        const result = await emailService.sendTestReminder();
        res.json({ 
            success: true, 
            message: 'Test email sent',
            result: result 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test weekly reminders endpoint
app.post('/api/test-weekly-reminders', async (req, res) => {
    try {
        emailService.checkAndSendReminders();
        res.json({ 
            success: true, 
            message: 'Weekly reminder check triggered'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Force send reminder for specific user
app.post('/api/force-reminder/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await emailService.forceUserReminder(userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Debug endpoint to check email configuration
app.get('/api/debug-email', (req, res) => {
    res.json({
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not set',
        EMAIL_FROM: process.env.EMAIL_FROM
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Hitachi Service Backend running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize email reminder service
    emailService.startEmailScheduler();
    console.log('📧 Email reminder service started');
});

module.exports = app; 