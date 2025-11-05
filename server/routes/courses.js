const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/courses
router.post('/', asyncHandler(async (req, res) => {
    const { name, level, duration, fee, description } = req.body;
    const newId = `CRS${Date.now()}`;
    const { rows } = await db.query(
        'INSERT INTO courses(id, name, level, duration, fee, description) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
        [newId, name, level, duration, fee, description]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/courses/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, level, duration, fee, description } = req.body;
    const { rows } = await db.query(
        'UPDATE courses SET name = $1, level = $2, duration = $3, fee = $4, description = $5 WHERE id = $6 RETURNING *',
        [name, level, duration, fee, description, id]
    );
    res.json(camelCaseKeys(rows[0]));
}));

module.exports = router;
