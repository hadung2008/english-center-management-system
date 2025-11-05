const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/transactions
router.post('/', asyncHandler(async (req, res) => {
    const { description, category, type, amount, status } = req.body;
    const newId = `TRN${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const { rows } = await db.query(
        'INSERT INTO transactions(id, date, description, category, type, amount, status) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [newId, date, description, category, type, amount, status]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/transactions/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, description, category, type, amount, status } = req.body;
    const { rows } = await db.query(
        'UPDATE transactions SET date = $1, description = $2, category = $3, type = $4, amount = $5, status = $6 WHERE id = $7 RETURNING *',
        [date, description, category, type, amount, status, id]
    );
    res.json(camelCaseKeys(rows[0]));
}));

module.exports = router;
