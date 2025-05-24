const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Register user
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, department } = req.body;

        // Check if user already exists
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const stmt = db.prepare(`
            INSERT INTO users (name, email, password, department)
            VALUES (?, ?, ?, ?)
        `);
        
        const result = stmt.run(name, email, hashedPassword, department || 'Service Department');
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: result.lastInsertRowid },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Get user data (without password)
        const user = db.prepare('SELECT id, name, email, department, customer_name, created_at FROM users WHERE id = ?')
            .get(result.lastInsertRowid);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, email, name, department, customer_name, created_at FROM users WHERE id = ?');
        const user = stmt.get(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, name, email, department, customer_name, phone, created_at, last_login 
            FROM users WHERE id = ?
        `).get(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, department, customer_name, phone } = req.body;

        // Check if email is already taken by another user
        if (email) {
            const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
                .get(email, req.user.userId);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user
        const stmt = db.prepare(`
            UPDATE users 
            SET name = COALESCE(?, name),
                email = COALESCE(?, email),
                department = COALESCE(?, department),
                customer_name = COALESCE(?, customer_name),
                phone = COALESCE(?, phone),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(name, email, department, customer_name, phone, req.user.userId);

        // Get updated user data
        const user = db.prepare(`
            SELECT id, name, email, department, customer_name, phone, created_at, last_login 
            FROM users WHERE id = ?
        `).get(req.user.userId);

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Get current user
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(hashedNewPassword, req.user.userId);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 