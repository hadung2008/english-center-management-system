const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/teachers
router.post('/', asyncHandler(async (req, res) => {
    const { name, email, avatarUrl, phone, specialization, contractType, payRate } = req.body;
    const newId = `T${Date.now()}`;
    const startDate = new Date().toISOString().split('T')[0];
    const { rows } = await db.query(
        'INSERT INTO teachers(id, name, email, avatar_url, phone, specialization, contract_type, start_date, pay_rate) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [newId, name, email, avatarUrl, phone, specialization, contractType, startDate, payRate]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/teachers/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, specialization, contractType, payRate, avatarUrl } = req.body;
    const { rows } = await db.query(
        'UPDATE teachers SET name = $1, email = $2, phone = $3, specialization = $4, contract_type = $5, pay_rate = $6, avatar_url = $7 WHERE id = $8 RETURNING *',
        [name, email, phone, specialization, contractType, payRate, avatarUrl, id]
    );
    res.json(camelCaseKeys(rows[0]));
}));

module.exports = router;
