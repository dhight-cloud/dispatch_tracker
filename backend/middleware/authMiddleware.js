const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dispatch_super_secret_key';

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    // Expecting header format: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Save user payload (id, username, role) to request
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = verifyToken;