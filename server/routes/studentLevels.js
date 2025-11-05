const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/student-levels
router.post('/', asyncHandler(async (req, res) => {
    const { studentId, level, assessmentDate, notes } = req.body;
    const newId = `SL${Date.now()}`;
    const { rows } = await db.query(
        'INSERT INTO student_levels(id, student_id, level, assessment_date, notes) VALUES($1, $2, $3, $4, $5) RETURNING *',
        [newId, studentId, level, assessmentDate, notes]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

module.exports = router;
