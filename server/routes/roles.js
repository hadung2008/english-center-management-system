const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// POST /api/roles
router.post('/', asyncHandler(async (req, res) => {
    const { roleName } = req.body;
    if (!roleName) {
        return res.status(400).json({ message: 'Role name is required' });
    }
    await db.query('INSERT INTO roles (name) VALUES ($1)', [roleName]);
    const permissionsRes = await db.query('SELECT * FROM role_permissions');
    const rolePermissions = permissionsRes.rows.reduce((acc, row) => {
        if (!acc[row.role_name]) acc[row.role_name] = [];
        acc[row.role_name].push(row.permission);
        return acc;
    }, {});
    rolePermissions[roleName] = [];
    res.status(201).json(camelCaseKeys(rolePermissions));
}));

// DELETE /api/roles/:roleName
router.delete('/:roleName', asyncHandler(async (req, res) => {
    const { roleName } = req.params;
    if (roleName === 'Admin') {
        return res.status(403).json({ message: 'Cannot delete Admin role' });
    }
    // Check if role is in use
    const usersRes = await db.query('SELECT 1 FROM users WHERE role = $1 LIMIT 1', [roleName]);
    if (usersRes.rows.length > 0) {
        return res.status(400).json({ message: 'Cannot delete role. It is currently assigned to one or more users.' });
    }
    
    await db.query('DELETE FROM roles WHERE name = $1', [roleName]);

    // Fetch and return the updated permissions object
    const permissionsRes = await db.query('SELECT * FROM role_permissions');
    const rolePermissions = permissionsRes.rows.reduce((acc, row) => {
        if (!acc[row.role_name]) acc[row.role_name] = [];
        acc[row.role_name].push(row.permission);
        return acc;
    }, {});
    res.json(camelCaseKeys(rolePermissions));
}));

// PUT /api/roles/:roleName/permissions
router.put('/:roleName/permissions', asyncHandler(async (req, res) => {
    const { roleName } = req.params;
    const { permissions } = req.body;
    
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM role_permissions WHERE role_name = $1', [roleName]);
        if (permissions && permissions.length > 0) {
            const insertQuery = 'INSERT INTO role_permissions (role_name, permission) VALUES ' +
                permissions.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(insertQuery, [roleName, ...permissions]);
        }
        await client.query('COMMIT');

        // Fetch the updated full permissions object
        const permissionsRes = await db.query('SELECT * FROM role_permissions');
        const rolePermissions = permissionsRes.rows.reduce((acc, row) => {
            if (!acc[row.role_name]) acc[row.role_name] = [];
            acc[row.role_name].push(row.permission);
            return acc;
        }, {});
        res.json(camelCaseKeys(rolePermissions));

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

module.exports = router;
