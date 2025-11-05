const express = require('express');
const router = express.Router();
const db = require('../db');
const { camelCaseKeys, asyncHandler } = require('../utils');

// PUT /api/redemptions/:id
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'

    let result = {};

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        
        const redemptionRes = await client.query('UPDATE redemptions SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        result.updatedRedemption = redemptionRes.rows[0];

        // If a pending request is rejected, refund points and restock the reward
        if (result.updatedRedemption.status === 'Rejected' && status === 'Rejected') {
            const studentId = result.updatedRedemption.student_id;
            const rewardId = result.updatedRedemption.reward_id;

            const rewardRes = await client.query('SELECT points FROM rewards WHERE id = $1', [rewardId]);
            const pointsToRefund = rewardRes.rows[0].points;
            
            // Refund points
            const studentRes = await client.query('UPDATE students SET reward_points = reward_points + $1 WHERE id = $2 RETURNING *', [pointsToRefund, studentId]);
            result.updatedStudent = studentRes.rows[0];

            // Restock reward
            const updatedRewardRes = await client.query('UPDATE rewards SET stock = stock + 1 WHERE id = $1 RETURNING *', [rewardId]);
            result.updatedReward = updatedRewardRes.rows[0];
            
            // Create a point transaction for the refund
            const ptId = `PT${Date.now()}`;
            const date = new Date().toISOString().split('T')[0];
            const reason = `Refund: Redemption for '${result.updatedReward.name}' rejected`;
            const ptRes = await client.query(
                'INSERT INTO point_transactions(id, student_id, points, reason, date) VALUES($1, $2, $3, $4, $5) RETURNING *',
                [ptId, studentId, pointsToRefund, reason, date]
            );
            result.newPointTransaction = ptRes.rows[0];
        }

        await client.query('COMMIT');
        res.json(camelCaseKeys(result));

    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

module.exports = router;
