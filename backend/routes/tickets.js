const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { body, validationResult } = require('express-validator');

// GET all tickets
router.get('/', verifyToken, async (req, res) => {
    try {
    const { status, priority } = req.query;
    
    //Fetching all tickets with optional technician details
    let query = `
        SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.assigned_tech_id, 
        t.created_at,
        tech.name AS tech_name
        FROM tickets t
        LEFT JOIN technicians tech ON t.assigned_tech_id = tech.id
    `;
    
    const queryParams = [];
    const conditions = [];

    //Filter by role: technician, restrict to assigned tickets
    if (req.user.role === 'technician') {
      // Find the technician table ID corresponding to the user's login user_id
        const [techRows] = await db.query('SELECT id FROM technicians WHERE user_id = ?', [req.user.id]);
        const techId = techRows[0]?.id || 0;
        conditions.push('t.assigned_tech_id = ?');
        queryParams.push(techId);
    }

    // Apply URL status filter if present
    if (status) {
        conditions.push('t.status = ?');
        queryParams.push(status);
    }

    // Apply URL priority filter if present
    if (priority) {
        conditions.push('t.priority = ?');
        queryParams.push(priority);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.id DESC';

    const [tickets] = await db.query(query, queryParams);
    res.json({ tickets });
    } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets: ' + err.message });
    }
});

// ADD a new service ticket with validation
router.post('/', verifyToken, authorizeRoles('admin', 'dispatcher'), [
    body('title').notEmpty().withMessage('Ticket title is required').isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
    body('priority').optional().isIn(['emergency', 'high', 'normal']).withMessage('Invalid priority level')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description, priority } = req.body;
        const ticketPriority = priority || 'normal';
        
        const [result] = await db.query(
            'INSERT INTO tickets (title, description, priority, status) VALUES (?, ?, ?, "unassigned")',
            [title, description, ticketPriority]
        );
        res.status(201).json({ 
            id: result.insertId,
            title,
            description,
            priority: ticketPriority,
            status: 'unassigned',
            createdBy: req.user.username
        });
    } catch (err) {
        console.error('Database Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE ticket status or assigned tech with validation
router.put('/:id', verifyToken, authorizeRoles('admin', 'dispatcher'), [
    body('status').optional().isIn(['unassigned', 'dispatched', 'en_route', 'on_site', 'resolved', 'closed']).withMessage('Invalid status value'),
    body('assigned_tech_id').optional({ nullable: true }).custom(val => val === null || Number.isInteger(Number(val))).withMessage('Assigned technician ID must be a valid integer or null')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, assigned_tech_id } = req.body;
    const userID = req.user.id;
    
    try {
        const [ticketRows] = await db.query('SELECT * FROM tickets WHERE id = ?', [id]);
        if (ticketRows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        
        const oldTicket = ticketRows[0];
        const oldStatus = oldTicket.status;
        const oldTechId = oldTicket.assigned_tech_id;

        // Preserve existing values if not provided in request body
        const newStatus = status !== undefined ? status : oldStatus;
        const newTechId = assigned_tech_id !== undefined ? assigned_tech_id : oldTechId;

        const [result] = await db.query(
            'UPDATE tickets SET status = ?, assigned_tech_id = ? WHERE id = ?',
            [newStatus, newTechId, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const logNotes = `Status updated from ${oldStatus} to ${newStatus}. Assigned tech ID: ${newTechId}`;
        await db.query(
            'INSERT INTO ticket_logs (ticket_id, user_id, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?)',
            [id, userID, oldStatus, newStatus, logNotes]
        );

        res.json({ 
            message: 'Ticket updated and audit log recorded successfully',
            id, 
            status: newStatus, 
            assigned_tech_id: newTechId 
        });

    } catch (err) {
        console.error('Error updating ticket and logging activity:', err);
        res.status(500).json({ error: 'Failed to update ticket and create audit log: ' + err.message });
    }
});

// DELETE: Remove a ticket
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM tickets WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        res.json({ message: 'Ticket deleted successfully' });
    } catch (err) {
        console.error('Error deleting ticket:', err);
        res.status(500).json({ error: 'Failed to delete ticket' });
    }
});

module.exports = router;