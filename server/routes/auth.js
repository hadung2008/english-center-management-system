const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
    const { email } = req.body;
    // Password check would happen here in a real app with hashing (e.g., bcrypt)
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows[0]) {
        res.json(camelCaseKeys(rows[0]));
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
}));

module.exports = router;
