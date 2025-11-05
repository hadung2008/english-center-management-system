const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/grades (Upsert logic)
router.post('/', asyncHandler(async (req, res) => {
    const { classId, grades } = req.body;
    
    if (!grades || grades.length === 0) {
        return res.status(200).json([]);
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const savedGrades = [];
        const currentDate = new Date().toISOString().split('T')[0];

        for (const gradeData of grades) {
            const { studentId, assessmentName, score } = gradeData;
            
            // Check for existing grade
            const existing = await client.query(
                'SELECT * FROM grades WHERE class_id = $1 AND student_id = $2 AND assessment_name = $3',
                [classId, studentId, assessmentName]
            );

            if (existing.rows.length > 0) {
                // Update
                const { rows } = await client.query(
                    'UPDATE grades SET score = $1 WHERE id = $2 RETURNING *',
                    [score, existing.rows[0].id]
                );
                savedGrades.push(rows[0]);
            } else {
                // Insert
                const newId = `G${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
                const { rows } = await client.query(
                    'INSERT INTO grades(id, student_id, class_id, assessment_name, score, max_score, date) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                    [newId, studentId, classId, assessmentName, score, 100, currentDate]
                );
                savedGrades.push(rows[0]);
            }
        }
        
        await client.query('COMMIT');
        res.status(201).json(camelCaseKeys(savedGrades));
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

module.exports = router;
