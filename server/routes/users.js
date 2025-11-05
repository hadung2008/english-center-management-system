const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/users
router.post('/', asyncHandler(async (req, res) => {
    const { name, email, avatarUrl, role, profileId } = req.body;
    const newId = `U${Date.now()}`;
    const { rows } = await db.query(
        'INSERT INTO users(id, name, email, avatar_url, role, profile_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
        [newId, name, email, avatarUrl, role, profileId]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/users/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, avatarUrl, role, profileId } = req.body;
    const { rows } = await db.query(
        'UPDATE users SET name = $1, email = $2, avatar_url = $3, role = $4, profile_id = $5 WHERE id = $6 RETURNING *',
        [name, email, avatarUrl, role, profileId, id]
    );
    res.json(camelCaseKeys(rows[0]));
}));

module.exports = router;
