const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/students
router.post('/', asyncHandler(async (req, res) => {
    const { name, email, avatarUrl, phone, dob, status, course, paymentStatus } = req.body;
    const newId = `S${Date.now()}`;
    const enrolledDate = new Date().toISOString().split('T')[0];
    const { rows } = await db.query(
        'INSERT INTO students(id, name, email, avatar_url, phone, dob, status, enrolled_date, course, payment_status, reward_points) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [newId, name, email, avatarUrl, phone, dob, status, enrolledDate, course, paymentStatus, 0]
    );
    res.status(201).json(camelCaseKeys(rows[0]));
}));

// PUT /api/students/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const studentData = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        // Handle side-effect: un-enroll from classes if inactivated
        if (studentData.status === 'Inactive') {
            await client.query('DELETE FROM class_enrollments WHERE student_id = $1', [id]);
        }
        
        const { rows } = await client.query(
            'UPDATE students SET name = $1, email = $2, phone = $3, course = $4, status = $5, payment_status = $6, dob = $7, avatar_url = $8 WHERE id = $9 RETURNING *',
            [studentData.name, studentData.email, studentData.phone, studentData.course, studentData.status, studentData.paymentStatus, studentData.dob, studentData.avatarUrl, id]
        );
        
        await client.query('COMMIT');
        res.json(camelCaseKeys(rows[0]));
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

// POST /api/students/:id/points
router.post('/:id/points', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { points, reason } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const studentRes = await client.query(
            'UPDATE students SET reward_points = reward_points + $1 WHERE id = $2 RETURNING *',
            [points, id]
        );
        
        const newTransactionId = `PT${Date.now()}`;
        const transactionDate = new Date().toISOString().split('T')[0];
        const transactionRes = await client.query(
            'INSERT INTO point_transactions(id, student_id, points, reason, date) VALUES($1, $2, $3, $4, $5) RETURNING *',
            [newTransactionId, id, points, reason, transactionDate]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json(camelCaseKeys({
            updatedStudent: studentRes.rows[0],
            newTransaction: transactionRes.rows[0]
        }));

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));


// POST /api/students/:id/redeem
router.post('/:id/redeem', asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const { rewardId, reason } = req.body;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Get student and reward, and lock rows to prevent race conditions
        const studentRes = await client.query('SELECT * FROM students WHERE id = $1 FOR UPDATE', [studentId]);
        const rewardRes = await client.query('SELECT * FROM rewards WHERE id = $1 FOR UPDATE', [rewardId]);
        
        const student = studentRes.rows[0];
        const reward = rewardRes.rows[0];

        if (!student || !reward) throw new Error('Student or Reward not found.');
        if (student.reward_points < reward.points) throw new Error('Not enough points.');
        if (reward.stock <= 0) throw new Error('Reward out of stock.');

        // 1. Deduct points from student
        const updatedStudentRes = await client.query('UPDATE students SET reward_points = reward_points - $1 WHERE id = $2 RETURNING *', [reward.points, studentId]);
        
        // 2. Decrement reward stock
        await client.query('UPDATE rewards SET stock = stock - 1 WHERE id = $1', [rewardId]);
        
        // 3. Create a point transaction
        const ptId = `PT${Date.now()}`;
        const date = new Date().toISOString().split('T')[0];
        const ptRes = await client.query(
            'INSERT INTO point_transactions(id, student_id, points, reason, date) VALUES($1, $2, $3, $4, $5) RETURNING *',
            [ptId, studentId, -reward.points, reason, date]
        );
        
        // 4. Create a redemption record
        const rdId = `RD${Date.now()}`;
        const rdRes = await client.query(
            'INSERT INTO redemptions(id, student_id, reward_id, date, status) VALUES($1, $2, $3, $4, $5) RETURNING *',
            [rdId, studentId, rewardId, date, 'Pending']
        );

        await client.query('COMMIT');

        res.status(201).json(camelCaseKeys({
            updatedStudent: updatedStudentRes.rows[0],
            newPointTransaction: ptRes.rows[0],
            newRedemption: rdRes.rows[0],
        }));

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));


module.exports = router;
