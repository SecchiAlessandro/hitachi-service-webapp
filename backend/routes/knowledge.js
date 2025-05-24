const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Search knowledge base
router.get('/search', auth, (req, res) => {
    try {
        const { q, category, equipment_type, difficulty_level } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        let query = `
            SELECT * FROM knowledge_base 
            WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)
        `;
        let params = [`%${q}%`, `%${q}%`, `%${q}%`];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (equipment_type) {
            query += ' AND equipment_type = ?';
            params.push(equipment_type);
        }

        if (difficulty_level) {
            query += ' AND difficulty_level = ?';
            params.push(difficulty_level);
        }

        query += ' ORDER BY title ASC LIMIT 20';

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        // Highlight search terms in results
        const searchTerms = q.toLowerCase().split(' ');
        const highlightedResults = results.map(item => ({
            ...item,
            relevance_score: calculateRelevance(item, searchTerms)
        })).sort((a, b) => b.relevance_score - a.relevance_score);

        res.json({ 
            results: highlightedResults,
            total: results.length,
            query: q
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Calculate relevance score for search results
function calculateRelevance(item, searchTerms) {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    const tagsLower = (item.tags || '').toLowerCase();

    searchTerms.forEach(term => {
        if (titleLower.includes(term)) score += 10;
        if (contentLower.includes(term)) score += 5;
        if (tagsLower.includes(term)) score += 3;
    });

    return score;
}

// Get all knowledge base entries
router.get('/', auth, (req, res) => {
    try {
        const { category, equipment_type, difficulty_level, limit = 50 } = req.query;
        
        let query = 'SELECT * FROM knowledge_base WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (equipment_type) {
            query += ' AND equipment_type = ?';
            params.push(equipment_type);
        }

        if (difficulty_level) {
            query += ' AND difficulty_level = ?';
            params.push(difficulty_level);
        }

        query += ' ORDER BY category, title LIMIT ?';
        params.push(parseInt(limit));

        const stmt = db.prepare(query);
        const entries = stmt.all(...params);

        res.json({ entries });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get knowledge base entry by ID
router.get('/:id', auth, (req, res) => {
    try {
        const entryId = req.params.id;

        const stmt = db.prepare('SELECT * FROM knowledge_base WHERE id = ?');
        const entry = stmt.get(entryId);

        if (!entry) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        res.json({ entry });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new knowledge base entry
router.post('/', auth, [
    body('category').trim().isLength({ min: 2 }),
    body('title').trim().isLength({ min: 5 }),
    body('content').trim().isLength({ min: 20 }),
    body('tags').optional().trim(),
    body('equipment_type').optional().trim(),
    body('difficulty_level').optional().isIn(['easy', 'medium', 'hard'])
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            category,
            title,
            content,
            tags,
            equipment_type,
            difficulty_level = 'medium'
        } = req.body;

        const stmt = db.prepare(`
            INSERT INTO knowledge_base (
                category, title, content, tags, equipment_type, difficulty_level
            ) VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(category, title, content, tags, equipment_type, difficulty_level);

        res.status(201).json({
            message: 'Knowledge base entry created successfully',
            entryId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Create knowledge entry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update knowledge base entry
router.put('/:id', auth, [
    body('category').optional().trim().isLength({ min: 2 }),
    body('title').optional().trim().isLength({ min: 5 }),
    body('content').optional().trim().isLength({ min: 20 }),
    body('tags').optional().trim(),
    body('equipment_type').optional().trim(),
    body('difficulty_level').optional().isIn(['easy', 'medium', 'hard'])
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const entryId = req.params.id;
        const updates = req.body;

        // Build dynamic update query
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(entryId);

        const stmt = db.prepare(`
            UPDATE knowledge_base SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        
        const result = stmt.run(...values);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        res.json({ message: 'Knowledge base entry updated successfully' });
    } catch (error) {
        console.error('Update knowledge entry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete knowledge base entry
router.delete('/:id', auth, (req, res) => {
    try {
        const entryId = req.params.id;

        const stmt = db.prepare('DELETE FROM knowledge_base WHERE id = ?');
        const result = stmt.run(entryId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        res.json({ message: 'Knowledge base entry deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get categories
router.get('/meta/categories', auth, (req, res) => {
    try {
        const stmt = db.prepare('SELECT DISTINCT category FROM knowledge_base ORDER BY category');
        const results = stmt.all();

        const categories = results.map(row => row.category);
        res.json({ categories });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get equipment types
router.get('/meta/equipment-types', auth, (req, res) => {
    try {
        const stmt = db.prepare('SELECT DISTINCT equipment_type FROM knowledge_base WHERE equipment_type IS NOT NULL ORDER BY equipment_type');
        const results = stmt.all();

        const equipmentTypes = results.map(row => row.equipment_type);
        res.json({ equipmentTypes });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Chatbot endpoint - natural language processing
router.post('/chat', auth, [
    body('message').trim().isLength({ min: 1 })
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { message } = req.body;
        
        // Simple keyword extraction and matching
        const keywords = extractKeywords(message.toLowerCase());
        
        // Search for relevant knowledge base entries using both message and keywords
        let query = `
            SELECT *, 
                   (CASE 
                    WHEN title LIKE ? THEN 10
                    WHEN content LIKE ? THEN 5
                    WHEN tags LIKE ? THEN 3
                    ELSE 1
                   END) as relevance
            FROM knowledge_base 
            WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
        `;
        
        // Add additional searches for individual keywords if we have them
        if (keywords.length > 0) {
            const keywordConditions = keywords.map(() => 
                'title LIKE ? OR content LIKE ? OR tags LIKE ?'
            ).join(' OR ');
            query += ` OR ${keywordConditions}`;
        }
        
        query += ' ORDER BY relevance DESC LIMIT 3';
        
        // Build parameters: first for the full message, then for each keyword
        const messagePattern = `%${message}%`;
        const params = [messagePattern, messagePattern, messagePattern, messagePattern, messagePattern, messagePattern];
        
        // Add keyword parameters
        keywords.forEach(keyword => {
            const keywordPattern = `%${keyword}%`;
            params.push(keywordPattern, keywordPattern, keywordPattern);
        });

        const stmt = db.prepare(query);
        const results = stmt.all(...params);

        let response = generateChatbotResponse(message, results, keywords);
        
        res.json({
            response,
            suggestions: results.slice(0, 2).map(item => ({
                id: item.id,
                title: item.title,
                category: item.category
            })),
            keywords: keywords
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Extract keywords from user message
function extractKeywords(message) {
    // Common maintenance keywords
    const maintenanceKeywords = [
        'generator', 'hvac', 'elevator', 'fire', 'safety', 'battery', 'ups', 'oil', 'filter',
        'inspection', 'maintenance', 'repair', 'replace', 'check', 'test', 'clean', 'service',
        'emergency', 'scheduled', 'preventive', 'routine', 'annual', 'monthly', 'weekly',
        'electrical', 'mechanical', 'plumbing', 'cooling', 'heating', 'ventilation'
    ];

    const words = message.toLowerCase().split(/\W+/).filter(word => word.length > 2);
    return words.filter(word => maintenanceKeywords.includes(word) || word.length > 4);
}

// Generate chatbot response
function generateChatbotResponse(message, knowledgeResults, keywords) {
    const messageLower = message.toLowerCase();
    
    // Greeting patterns
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('help')) {
        return "Hello! I'm the Hitachi Service Assistant. I can help you with maintenance procedures, equipment information, and troubleshooting. What would you like to know about?";
    }

    // Question patterns
    if (messageLower.includes('how to') || messageLower.includes('how do')) {
        if (knowledgeResults.length > 0) {
            const bestMatch = knowledgeResults[0];
            return `Here's how to handle ${bestMatch.title.toLowerCase()}:\n\n${bestMatch.content.substring(0, 300)}...\n\nWould you like more detailed information about this procedure?`;
        } else {
            return "I understand you're looking for a procedure. Could you be more specific about what equipment or task you need help with?";
        }
    }

    // Specific equipment queries
    const equipmentMentioned = keywords.find(keyword => 
        ['generator', 'hvac', 'elevator', 'fire', 'ups', 'battery'].includes(keyword)
    );

    if (equipmentMentioned && knowledgeResults.length > 0) {
        const relevantResults = knowledgeResults.filter(result => 
            result.content.toLowerCase().includes(equipmentMentioned) ||
            result.title.toLowerCase().includes(equipmentMentioned)
        );

        if (relevantResults.length > 0) {
            const bestMatch = relevantResults[0];
            return `I found information about ${equipmentMentioned} maintenance:\n\n${bestMatch.title}\n\n${bestMatch.content.substring(0, 250)}...\n\nWould you like me to find more specific information?`;
        }
    }

    // General maintenance queries
    if (knowledgeResults.length > 0) {
        const bestMatch = knowledgeResults[0];
        return `I found this relevant information:\n\n${bestMatch.title}\n\n${bestMatch.content.substring(0, 200)}...\n\nIs this what you were looking for, or would you like me to search for something else?`;
    }

    // Default response
    return "I'm not sure I understand exactly what you're looking for. Could you try asking about specific equipment (generator, HVAC, elevator, etc.) or maintenance procedures? I have information about various maintenance tasks and safety procedures.";
}

module.exports = router; 