const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tasks with filtering and pagination
router.get('/', auth, (req, res) => {
    try {
        const {
            status,
            priority,
            assigned_to,
            search,
            page = 1,
            limit = 10,
            sort = 'due_date',
            order = 'ASC'
        } = req.query;

        let query = `
            SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email,
                   c.name as created_by_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users c ON t.created_by = c.id
            WHERE 1=1
        `;
        
        const params = [];

        // Add filters
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND t.priority = ?';
            params.push(priority);
        }

        if (assigned_to) {
            query += ' AND t.assigned_to = ?';
            params.push(assigned_to);
        }

        if (search) {
            query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.equipment_id LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Add sorting
        const validSortFields = ['due_date', 'priority', 'created_at', 'title'];
        const validOrder = ['ASC', 'DESC'];
        
        if (validSortFields.includes(sort) && validOrder.includes(order.toUpperCase())) {
            query += ` ORDER BY t.${sort} ${order.toUpperCase()}`;
        } else {
            query += ' ORDER BY t.due_date ASC';
        }

        // Add pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const stmt = db.prepare(query);
        const tasks = stmt.all(...params);

        // Add computed fields
        const tasksWithStatus = tasks.map(task => {
            const dueDate = new Date(task.due_date);
            const today = new Date();
            const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            
            return {
                ...task,
                days_until_due: daysDiff,
                is_overdue: daysDiff < 0 && task.status === 'pending',
                is_due_soon: daysDiff <= 7 && daysDiff >= 0 && task.status === 'pending'
            };
        });

        res.json({ tasks: tasksWithStatus });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get task by ID
router.get('/:id', auth, (req, res) => {
    try {
        const taskId = req.params.id;

        const stmt = db.prepare(`
            SELECT t.*, u.name as assigned_to_name, u.email as assigned_to_email,
                   c.name as created_by_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN users c ON t.created_by = c.id
            WHERE t.id = ?
        `);
        
        const task = stmt.get(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Add computed fields
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        const taskWithStatus = {
            ...task,
            days_until_due: daysDiff,
            is_overdue: daysDiff < 0 && task.status === 'pending',
            is_due_soon: daysDiff <= 7 && daysDiff >= 0 && task.status === 'pending'
        };

        res.json({ task: taskWithStatus });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new task
router.post('/', auth, [
    body('title').trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('due_date').isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('equipment_id').optional().trim(),
    body('location').optional().trim(),
    body('estimated_hours').optional().isInt({ min: 1 })
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            description,
            due_date,
            priority = 'medium',
            assigned_to,
            equipment_id,
            location,
            estimated_hours
        } = req.body;

        const stmt = db.prepare(`
            INSERT INTO tasks (
                title, description, due_date, priority, assigned_to, 
                created_by, equipment_id, location, estimated_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            title, description, due_date, priority, assigned_to,
            req.user.userId, equipment_id, location, estimated_hours
        );

        res.status(201).json({
            message: 'Task created successfully',
            taskId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task
router.put('/:id', auth, [
    body('title').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('due_date').optional().isISO8601(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['pending', 'completed']),
    body('equipment_id').optional().trim(),
    body('location').optional().trim(),
    body('estimated_hours').optional().isInt({ min: 1 }),
    body('actual_hours').optional().isInt({ min: 1 }),
    body('completion_notes').optional().trim()
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const taskId = req.params.id;
        const updates = req.body;

        // If status is being changed to completed, add completion timestamp
        if (updates.status === 'completed') {
            updates.completed_at = new Date().toISOString();
        } else if (updates.status === 'pending') {
            updates.completed_at = null;
        }

        // Build dynamic update query
        const fields = Object.keys(updates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(taskId);

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const stmt = db.prepare(`
            UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        
        const result = stmt.run(...values);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete task
router.delete('/:id', auth, (req, res) => {
    try {
        const taskId = req.params.id;

        const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
        const result = stmt.run(taskId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task status
router.put('/:id/status', auth, [
    body('status').isIn(['pending', 'completed'])
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const taskId = req.params.id;
        const { status } = req.body;

        const completedAt = status === 'completed' ? new Date().toISOString() : null;

        const stmt = db.prepare(`
            UPDATE tasks 
            SET status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        
        const result = stmt.run(status, completedAt, taskId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ 
            message: `Task marked as ${status}`,
            status: status 
        });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle task status (pending <-> completed)
router.patch('/:id/toggle', auth, (req, res) => {
    try {
        const taskId = req.params.id;

        // First get current status
        const task = db.prepare('SELECT status FROM tasks WHERE id = ?').get(taskId);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

        const stmt = db.prepare(`
            UPDATE tasks 
            SET status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        
        const result = stmt.run(newStatus, completedAt, taskId);

        res.json({ 
            message: `Task marked as ${newStatus}`,
            status: newStatus 
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get task statistics
router.get('/stats/overview', auth, (req, res) => {
    try {
        const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
        const pendingTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('pending').count;
        const completedTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('completed').count;
        
        // Get overdue tasks (pending tasks past due date)
        const overdueTasks = db.prepare(`
            SELECT COUNT(*) as count FROM tasks 
            WHERE status = 'pending' AND date(due_date) < date('now')
        `).get().count;

        res.json({
            total: totalTasks,
            pending: pendingTasks,
            completed: completedTasks,
            overdue: overdueTasks
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 