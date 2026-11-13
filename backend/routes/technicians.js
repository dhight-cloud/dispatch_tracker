const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Get all technicians
router.get('/', verifyToken, async (req, res) => {
    try {
        const [technicians] = await db.query('SELECT * FROM technicians');
        res.json({ technicians });
    } catch (err) {
        console.error('Error fetching technicians:', err);
        res.status(500).json({ error: 'Failed to fetch technicians' });
    }
});

// Create technician profile AND auto-provision a user login account
router.post('/', verifyToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
    const { name, email, phone, specialization, status, region } = req.body;
    
    const techEmail = email || `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@logistics.com`;
    const defaultPassword = 'LogisticsPass123!'; // Temporary default password

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if user email already exists in users table
        const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [techEmail]);
        let userId = null;

        if (existingUsers.length > 0) {
            userId = existingUsers[0].id;
        } else {
            // Hash default password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

            // 2. Create the user login account (including unique username)
            const [userResult] = await connection.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [techEmail, techEmail, hashedPassword, 'technician']
            );
            userId = userResult.insertId;
        }

        // 3. Create the technician operational profile linked to the user_id
        const [techResult] = await connection.query(
            `INSERT INTO technicians (user_id, name, email, phone, specialization, status, region) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId, 
                name, 
                techEmail, 
                phone, 
                specialization, 
                status || 'active', 
                region || 'North'
            ]
        );

        await connection.commit();
        connection.release();

        res.status(201).json({ 
            message: 'Technician profile and login account created successfully', 
            technicianId: techResult.insertId,
            user_id: userId,
            email: techEmail,
            tempPassword: defaultPassword
        });

    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Error creating technician with login:', err);
        res.status(500).json({ error: 'Failed to create technician profile: ' + err.message });
    }
});

module.exports = router;