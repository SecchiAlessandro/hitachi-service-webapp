const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Create database directory if it doesn't exist
const fs = require('fs');
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'hitachi_service.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to SQLite database.');
});

// Create tables
const createTables = () => {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            department TEXT DEFAULT 'Service',
            customer_name TEXT DEFAULT 'Service Department',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating users table:', err.message);
        else console.log('Users table created successfully');
    });

    // Tasks table
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            due_date DATE NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
            assigned_to INTEGER,
            created_by INTEGER,
            equipment_id TEXT,
            location TEXT,
            estimated_hours INTEGER,
            actual_hours INTEGER,
            completion_notes TEXT,
            completed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assigned_to) REFERENCES users (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `, (err) => {
        if (err) console.error('Error creating tasks table:', err.message);
        else console.log('Tasks table created successfully');
    });

    // Knowledge base table
    db.run(`
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            tags TEXT,
            equipment_type TEXT,
            difficulty_level TEXT DEFAULT 'medium' CHECK(difficulty_level IN ('easy', 'medium', 'hard')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating knowledge_base table:', err.message);
        else console.log('Knowledge base table created successfully');
    });

    // Email notifications table
    db.run(`
        CREATE TABLE IF NOT EXISTS email_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            email TEXT NOT NULL,
            sent_at DATETIME,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
            notification_type TEXT DEFAULT 'due_reminder',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks (id)
        )
    `, (err) => {
        if (err) console.error('Error creating email_notifications table:', err.message);
        else console.log('Email notifications table created successfully');
    });
};

// Insert sample data
const insertSampleData = async () => {
    try {
        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        db.run(`
            INSERT OR IGNORE INTO users (email, password, name, department)
            VALUES (?, ?, ?, ?)
        `, ['admin@hitachi-service.com', hashedPassword, 'System Administrator', 'Service'], (err) => {
            if (err) console.error('Error inserting admin user:', err.message);
            else console.log('Admin user created successfully');
        });

        // Insert sample maintenance tasks
        const sampleTasks = [
            {
                title: 'Monthly Generator Inspection',
                description: 'Perform monthly inspection of backup generators including oil levels, battery condition, and operational testing.',
                due_date: '2024-01-15',
                priority: 'high',
                equipment_id: 'GEN-001',
                location: 'Building A - Basement',
                estimated_hours: 4
            },
            {
                title: 'HVAC Filter Replacement',
                description: 'Replace air filters in all HVAC units across the facility. Check for any unusual wear or damage.',
                due_date: '2024-01-22',
                priority: 'medium',
                equipment_id: 'HVAC-MAIN',
                location: 'Rooftop Units 1-6',
                estimated_hours: 6
            },
            {
                title: 'Fire Safety System Check',
                description: 'Comprehensive inspection of fire detection systems, sprinklers, and emergency exits.',
                due_date: '2024-02-01',
                priority: 'high',
                equipment_id: 'FIRE-SYS',
                location: 'All Buildings',
                estimated_hours: 8
            },
            {
                title: 'Elevator Maintenance',
                description: 'Quarterly maintenance of all elevator systems including safety checks and mechanical inspections.',
                due_date: '2024-02-10',
                priority: 'medium',
                equipment_id: 'ELEV-001,ELEV-002',
                location: 'Buildings A & B',
                estimated_hours: 12
            },
            {
                title: 'UPS Battery Replacement',
                description: 'Replace aging UPS batteries in data center and critical systems.',
                due_date: '2024-02-28',
                priority: 'high',
                equipment_id: 'UPS-DC-001',
                location: 'Data Center',
                estimated_hours: 3
            }
        ];

        sampleTasks.forEach((task, index) => {
            db.run(`
                INSERT OR IGNORE INTO tasks (title, description, due_date, priority, equipment_id, location, estimated_hours, assigned_to, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
            `, [task.title, task.description, task.due_date, task.priority, task.equipment_id, task.location, task.estimated_hours], (err) => {
                if (err) console.error(`Error inserting task ${index + 1}:`, err.message);
                else console.log(`Sample task ${index + 1} created successfully`);
            });
        });

        // Insert knowledge base data
        const knowledgeBaseData = [
            {
                category: 'Generator Maintenance',
                title: 'Generator Oil Change Procedure',
                content: 'Step-by-step procedure for changing generator oil: 1. Turn off generator and wait for cool down. 2. Drain old oil completely. 3. Replace oil filter. 4. Add new oil as per manufacturer specifications. 5. Check oil level and run test cycle.',
                tags: 'generator,oil,maintenance,safety',
                equipment_type: 'Generator',
                difficulty_level: 'medium'
            },
            {
                category: 'HVAC Maintenance',
                title: 'Air Filter Selection Guide',
                content: 'Proper air filter selection is crucial for HVAC efficiency. MERV ratings: 6-8 for residential, 9-12 for commercial, 13-16 for hospitals. Replace every 1-3 months depending on usage and environment. Always check airflow direction before installation.',
                tags: 'hvac,filters,merv,airflow',
                equipment_type: 'HVAC',
                difficulty_level: 'easy'
            },
            {
                category: 'Fire Safety',
                title: 'Fire Sprinkler System Testing',
                content: 'Monthly visual inspection: Check for corrosion, damage, or obstructions. Annual testing: Test water flow, pressure, and alarm systems. Always coordinate with building occupants and security before testing. Document all findings.',
                tags: 'fire,sprinkler,safety,testing',
                equipment_type: 'Fire Safety',
                difficulty_level: 'hard'
            },
            {
                category: 'Elevator Maintenance',
                title: 'Elevator Safety Checklist',
                content: 'Daily checks: Door operation, emergency phone, lighting. Weekly: Lubrication points, cable inspection. Monthly: Emergency brake test, load testing. Annual: Full safety inspection by certified technician. Report any unusual noises immediately.',
                tags: 'elevator,safety,inspection,certification',
                equipment_type: 'Elevator',
                difficulty_level: 'medium'
            },
            {
                category: 'Electrical Systems',
                title: 'UPS Battery Maintenance',
                content: 'Battery maintenance schedule: Monthly - voltage checks and visual inspection. Quarterly - load testing and temperature monitoring. Annually - full capacity test and replacement planning. Keep battery room well-ventilated and at optimal temperature (20-25°C).',
                tags: 'ups,battery,electrical,power',
                equipment_type: 'UPS',
                difficulty_level: 'medium'
            }
        ];

        knowledgeBaseData.forEach((kb, index) => {
            db.run(`
                INSERT OR IGNORE INTO knowledge_base (category, title, content, tags, equipment_type, difficulty_level)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [kb.category, kb.title, kb.content, kb.tags, kb.equipment_type, kb.difficulty_level], (err) => {
                if (err) console.error(`Error inserting knowledge base entry ${index + 1}:`, err.message);
                else console.log(`Knowledge base entry ${index + 1} created successfully`);
            });
        });

    } catch (error) {
        console.error('Error inserting sample data:', error.message);
    }
};

// Initialize database
createTables();
setTimeout(() => {
    insertSampleData();
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database initialization completed and connection closed.');
            }
        });
    }, 2000);
}, 1000); 