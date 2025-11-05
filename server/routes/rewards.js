const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/rewards
router.post('/', asyncHandler(async (req, res) => {
    const { name, imageUrl, points, stock } = req.body;
    const newId = `RWD${Date.now()}`;
    const { rows } = await db.query(
        'INSERT INTO rewards(id, name, image_url, points, stock) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [newId, name, imageUrl, points, stock]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/rewards/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, imageUrl, points, stock } = req.body;
    const { rows } = await db.query(
        'UPDATE rewards SET name = $1, image_url = $2, points = $3, stock = $4 WHERE id = $5 RETURNING *',
        [name, imageUrl, points, stock, id]
    );
    res.json(camelCaseKeys(rows[0]));
}));

module.exports = router;
