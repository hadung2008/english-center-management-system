const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/attendance
router.post('/', asyncHandler(async (req, res) => {
    const { classId, date, attendance } = req.body;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // Clear existing records for this class and date to prevent duplicates
        await client.query('DELETE FROM attendance_records WHERE class_id = $1 AND date = $2', [classId, date]);
        
        const newRecordsData = Object.entries(attendance);
        if (newRecordsData.length === 0) {
            await client.query('COMMIT');
            return res.status(201).json([]);
        }

        const insertQuery = 'INSERT INTO attendance_records (id, student_id, class_id, date, status) VALUES ' +
            newRecordsData.map((_, i) => `($${i*5 + 1}, $${i*5 + 2}, $${i*5 + 3}, $${i*5 + 4}, $${i*5 + 5})`).join(', ') +
            ' RETURNING *';

        const values = newRecordsData.flatMap(([studentId, status]) => [
            `ATT-${classId}-${studentId}-${date}`, studentId, classId, date, status
        ]);

        const { rows } = await client.query(insertQuery, values);
        await client.query('COMMIT');
        res.status(201).json(camelCaseKeys(rows));
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

module.exports = router;
