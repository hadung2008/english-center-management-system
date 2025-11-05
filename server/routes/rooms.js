const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/rooms
router.post('/', asyncHandler(async (req, res) => {
    const { name, capacity } = req.body;
    const newId = `R${Date.now()}`;
    const { rows } = await db.query(
        'INSERT INTO rooms(id, name, capacity) VALUES($1, $2, $3) RETURNING *',
        [newId, name, capacity]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/rooms/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, capacity } = req.body;
    const { rows } = await db.query(
        'UPDATE rooms SET name = $1, capacity = $2 WHERE id = $3 RETURNING *',
        [name, capacity, id]
    );
    res.json(camelCaseKeys(rows[0]));
}));

module.exports = router;
