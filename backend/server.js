const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

//Import ticket routes file
const ticketRoutes = require('./routes/tickets');
const authRoutes = require('./routes/auth');
const technicianRoutes = require('./routes/technicians');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/technicians', technicianRoutes);

// Health check and database connection test endpoint
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ 
            status: 'success', 
            message: 'Connected to the logistics_hub database successfully!', 
            testResult: rows[0].solution 
        });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running live on port ${PORT}`);
});