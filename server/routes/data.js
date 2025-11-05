const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// GET /api/data/initial
router.get('/initial', asyncHandler(async (req, res) => {
    const [
        studentsRes, teachersRes, classesRes, coursesRes, transactionsRes,
        usersRes, rolePermissionsRes, roomsRes, attendanceRes, gradesRes,
        rewardsRes, redemptionsRes, pointTransactionsRes, studentLevelsRes
    ] = await Promise.all([
        db.query('SELECT * FROM students ORDER BY enrolled_date DESC'),
        db.query('SELECT * FROM teachers ORDER BY start_date DESC'),
        db.query('SELECT c.*, array_agg(ce.student_id) FILTER (WHERE ce.student_id IS NOT NULL) AS student_ids FROM classes c LEFT JOIN class_enrollments ce ON c.id = ce.class_id GROUP BY c.id ORDER BY c.name'),
        db.query('SELECT * FROM courses ORDER BY name'),
        db.query('SELECT * FROM transactions ORDER BY date DESC'),
        db.query('SELECT * FROM users ORDER BY name'),
        db.query('SELECT * FROM role_permissions'),
        db.query('SELECT * FROM rooms ORDER BY name'),
        db.query('SELECT * FROM attendance_records'),
        db.query('SELECT * FROM grades'),
        db.query('SELECT * FROM rewards ORDER BY points'),
        db.query('SELECT * FROM redemptions ORDER BY date DESC'),
        db.query('SELECT * FROM point_transactions ORDER BY date DESC'),
        db.query('SELECT * FROM student_levels ORDER BY assessment_date DESC')
    ]);
    
    // Process enrollments for classes
    const classes = classesRes.rows.map(c => ({
        ...c,
        studentIds: c.student_ids || [] // handle null from array_agg
    }));

    // Group permissions by role
    const rolePermissions = rolePermissionsRes.rows.reduce((acc, row) => {
        if (!acc[row.role_name]) {
            acc[row.role_name] = [];
        }
        acc[row.role_name].push(row.permission);
        return acc;
    }, {});

    res.json(camelCaseKeys({
        students: studentsRes.rows,
        teachers: teachersRes.rows,
        classes,
        courses: coursesRes.rows,
        transactions: transactionsRes.rows,
        users: usersRes.rows,
        rolePermissions,
        rooms: roomsRes.rows,
        attendanceRecords: attendanceRes.rows,
        grades: gradesRes.rows,
        rewards: rewardsRes.rows,
        redemptions: redemptionsRes.rows,
        pointTransactions: pointTransactionsRes.rows,
        studentLevels: studentLevelsRes.rows
    }));
}));

module.exports = router;
