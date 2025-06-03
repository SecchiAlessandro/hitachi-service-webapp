const nodemailer = require('nodemailer');
const cron = require('node-cron');
const db = require('../config/database');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
            process.env.EMAIL_USER === 'your_email@gmail.com' || 
            process.env.EMAIL_PASS === 'your_app_password') {
            console.log('📧 Email service: Credentials not configured. Email notifications disabled.');
            console.log('📧 To enable email notifications:');
            console.log('   1. Set EMAIL_USER to your Gmail address');
            console.log('   2. Set EMAIL_PASS to your Gmail App Password');
            console.log('   3. See README.md for setup instructions');
            this.transporter = null;
            return;
        }

        // Configure email transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        this.transporter.verify((error, success) => {
            if (error) {
                console.log('📧 Email service configuration error:', error.message);
                console.log('📧 Email notifications will be disabled until credentials are fixed');
                this.transporter = null;
            } else {
                console.log('📧 Email service ready to send emails');
            }
        });
    }

    async sendTaskReminder(task, userEmail, userName) {
        try {
            if (!this.transporter) {
                console.log('📧 Email service not configured. Skipping reminder for task:', task.title);
                return { success: false, error: 'Email service not configured' };
            }

            const dueDate = new Date(task.due_date);
            const formattedDate = dueDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@hitachi-service.com',
                to: userEmail,
                subject: `🔧 Hitachi Service Reminder: ${task.title} - Due Soon`,
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                            max-width: 600px; 
                            margin: 0 auto; 
                            padding: 20px; 
                        }
                        .header { 
                            background: linear-gradient(135deg, #d32f2f, #f44336); 
                            color: white; 
                            padding: 20px; 
                            text-align: center; 
                            border-radius: 8px 8px 0 0; 
                        }
                        .content { 
                            background: #f9f9f9; 
                            padding: 30px; 
                            border: 1px solid #ddd; 
                        }
                        .task-details { 
                            background: white; 
                            padding: 20px; 
                            border-radius: 8px; 
                            margin: 20px 0; 
                            border-left: 4px solid #d32f2f; 
                        }
                        .priority { 
                            display: inline-block; 
                            padding: 4px 12px; 
                            border-radius: 20px; 
                            font-size: 12px; 
                            font-weight: bold; 
                            text-transform: uppercase; 
                        }
                        .priority.high { background: #ffebee; color: #c62828; }
                        .priority.medium { background: #fff3e0; color: #ef6c00; }
                        .priority.low { background: #e8f5e8; color: #2e7d32; }
                        .button { 
                            display: inline-block; 
                            background: #d32f2f; 
                            color: white; 
                            padding: 12px 24px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin: 20px 0; 
                        }
                        .footer { 
                            background: #333; 
                            color: white; 
                            padding: 20px; 
                            text-align: center; 
                            font-size: 12px; 
                            border-radius: 0 0 8px 8px; 
                        }
                        .logo { 
                            font-size: 24px; 
                            font-weight: bold; 
                            margin-bottom: 10px; 
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">HITACHI</div>
                        <div>Service Department</div>
                    </div>
                    
                    <div class="content">
                        <h2>🔔 Maintenance Task Reminder</h2>
                        
                        <p>Hello ${userName},</p>
                        
                        <p>This is a friendly reminder that you have a maintenance task due soon:</p>
                        
                        <div class="task-details">
                            <h3>${task.title}</h3>
                            <p><strong>Due Date:</strong> ${formattedDate}</p>
                            <p><strong>Priority:</strong> <span class="priority ${task.priority}">${task.priority}</span></p>
                            ${task.location ? `<p><strong>Location:</strong> ${task.location}</p>` : ''}
                            ${task.equipment_id ? `<p><strong>Equipment:</strong> ${task.equipment_id}</p>` : ''}
                            ${task.estimated_hours ? `<p><strong>Estimated Time:</strong> ${task.estimated_hours} hours</p>` : ''}
                            
                            <h4>Description:</h4>
                            <p>${task.description || 'No description provided.'}</p>
                        </div>
                        
                        <p>Please ensure this task is completed by the due date to maintain our high service standards.</p>
                        
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks" class="button">
                            View Task Details
                        </a>
                        
                        <p><em>This is an automated reminder from the Hitachi Service Management System.</em></p>
                    </div>
                    
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Hitachi Service Department</p>
                        <p>This email was sent automatically. Please do not reply to this email.</p>
                    </div>
                </body>
                </html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Reminder email sent:', info.messageId);
            
            // Log to database
            this.logEmailNotification(task.id, userEmail, 'sent', 'due_reminder');
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending reminder email:', error);
            
            // Log failed attempt
            this.logEmailNotification(task.id, userEmail, 'failed', 'due_reminder');
            
            return { success: false, error: error.message };
        }
    }

    logEmailNotification(taskId, email, status, type = 'due_reminder') {
        try {
            const sentAt = status === 'sent' ? new Date().toISOString() : null;
            
            const stmt = db.prepare(`
                INSERT INTO email_notifications (task_id, email, sent_at, status, notification_type)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            stmt.run(taskId, email, sentAt, status, type);
        } catch (err) {
            console.error('Error logging email notification:', err);
        }
    }

    checkAndSendReminders() {
        if (!this.transporter) {
            console.log('📧 Email service not configured. Skipping reminder check.');
            return;
        }

        console.log('Checking for tasks due soon...');
        
        // Find tasks due within 7 days that haven't been sent reminders
        const query = `
            SELECT t.*, u.email, u.name 
            FROM tasks t
            JOIN users u ON t.assigned_to = u.id
            WHERE t.status = 'pending' 
            AND date(t.due_date) >= date('now')
            AND date(t.due_date) <= date('now', '+7 days')
            AND NOT EXISTS (
                SELECT 1 FROM email_notifications en 
                WHERE en.task_id = t.id 
                AND en.status = 'sent' 
                AND en.notification_type = 'due_reminder'
                AND date(en.created_at) >= date('now', '-1 days')
            )
        `;

        try {
            const stmt = db.prepare(query);
            const tasks = stmt.all();

            console.log(`Found ${tasks.length} tasks requiring reminders`);

            for (const task of tasks) {
                if (task.email) {
                    this.sendTaskReminder(task, task.email, task.name);
                    // Add delay between emails to avoid overwhelming the SMTP server
                    setTimeout(() => {}, 1000);
                }
            }
        } catch (err) {
            console.error('Error checking for reminder tasks:', err);
        }
    }

    startEmailScheduler() {
        // Check for reminders every day at 9:00 AM
        cron.schedule('0 9 * * *', () => {
            this.checkAndSendReminders();
        });

        // For testing - check every 30 minutes in development
        if (process.env.NODE_ENV === 'development') {
            cron.schedule('*/30 * * * *', () => {
                console.log('Development mode: Checking for reminders...');
                this.checkAndSendReminders();
            });
        }

        console.log('Email reminder scheduler started');
    }

    // Manual trigger for testing
    async sendTestReminder() {
        try {
            const query = `
                SELECT t.*, u.email, u.name 
                FROM tasks t
                JOIN users u ON t.assigned_to = u.id
                WHERE t.status = 'pending' 
                LIMIT 1
            `;

            const stmt = db.prepare(query);
            const task = stmt.get();

            if (!task) {
                return { message: 'No pending tasks found for testing' };
            }

            const result = await this.sendTaskReminder(task, task.email, task.name);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Force send reminder for specific user
    async forceUserReminder(userId) {
        try {
            const query = `
                SELECT t.*, u.email, u.name 
                FROM tasks t
                JOIN users u ON t.assigned_to = u.id
                WHERE t.status = 'pending' 
                AND t.assigned_to = ?
                AND date(t.due_date) >= date('now')
                ORDER BY t.due_date ASC
                LIMIT 1
            `;

            const stmt = db.prepare(query);
            const task = stmt.get(userId);

            if (!task) {
                return { success: false, message: 'No pending tasks found for this user' };
            }

            console.log(`Forcing reminder for task: ${task.title} to ${task.email}`);
            const result = await this.sendTaskReminder(task, task.email, task.name);
            return { success: result.success, task: task.title, email: task.email, ...result };
        } catch (error) {
            console.error('Error in forceUserReminder:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService(); 