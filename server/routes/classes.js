const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/classes
router.post('/', asyncHandler(async (req, res) => {
    const { name, course, teacher, schedule, studentIds, capacity, roomId } = req.body;
    const newId = `C${Date.now()}`;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const classRes = await client.query(
            'INSERT INTO classes(id, name, course, teacher, schedule, capacity, room_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [newId, name, course, teacher, schedule, capacity, roomId]
        );
        
        if (studentIds && studentIds.length > 0) {
            const enrollQuery = 'INSERT INTO class_enrollments (class_id, student_id) VALUES ' + studentIds.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(enrollQuery, [newId, ...studentIds]);
        }
        
        await client.query('COMMIT');
        const newClass = { ...classRes.rows[0], studentIds: studentIds || [] };
        res.status(201).json(camelCaseKeys(newClass));
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

// PUT /api/classes/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, course, teacher, schedule, studentIds, capacity, roomId } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const classRes = await client.query(
            'UPDATE classes SET name = $1, course = $2, teacher = $3, schedule = $4, capacity = $5, room_id = $6 WHERE id = $7 RETURNING *',
            [name, course, teacher, schedule, capacity, roomId, id]
        );
        
        // Sync enrollments
        await client.query('DELETE FROM class_enrollments WHERE class_id = $1', [id]);
        if (studentIds && studentIds.length > 0) {
            const enrollQuery = 'INSERT INTO class_enrollments (class_id, student_id) VALUES ' + studentIds.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(enrollQuery, [id, ...studentIds]);
        }
        
        await client.query('COMMIT');
        const updatedClass = { ...classRes.rows[0], studentIds: studentIds || [] };
        res.json(camelCaseKeys(updatedClass));
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));


module.exports = router;
