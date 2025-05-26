const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 点赞/收藏API
router.post('/like', async (req, res) => {
    try {
        const { postId, type } = req.body;
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.json({ success: false, message: '请先登录' });
        }

        // 检查是否已经点赞/收藏
        const checkQuery = `
            SELECT * FROM user_actions 
            WHERE user_id = ? AND post_id = ? AND action_type = ?
        `;
        const [existingAction] = await db.query(checkQuery, [userId, postId, type]);

        if (existingAction.length > 0) {
            // 如果已经点赞/收藏，则取消
            const deleteQuery = `
                DELETE FROM user_actions 
                WHERE user_id = ? AND post_id = ? AND action_type = ?
            `;
            await db.query(deleteQuery, [userId, postId, type]);

            // 更新帖子表中的计数
            const updatePostQuery = `
                UPDATE posts 
                SET ${type === 'like' ? 'like_count' : 'collection_count'} = 
                    ${type === 'like' ? 'like_count' : 'collection_count'} - 1 
                WHERE id = ?
            `;
            await db.query(updatePostQuery, [postId]);
        } else {
            // 如果没有点赞/收藏，则添加
            const insertQuery = `
                INSERT INTO user_actions (user_id, post_id, action_type) 
                VALUES (?, ?, ?)
            `;
            await db.query(insertQuery, [userId, postId, type]);

            // 更新帖子表中的计数
            const updatePostQuery = `
                UPDATE posts 
                SET ${type === 'like' ? 'like_count' : 'collection_count'} = 
                    ${type === 'like' ? 'like_count' : 'collection_count'} + 1 
                WHERE id = ?
            `;
            await db.query(updatePostQuery, [postId]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error in like API:', error);
        res.json({ success: false, message: '服务器错误' });
    }
});

module.exports = router; 