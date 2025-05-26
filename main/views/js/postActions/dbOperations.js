const mysql = require('mysql2/promise');
const dbConfig = require('./dbConfig');

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 检查用户对帖子的操作状态
async function checkUserPostState(postId, userId) {
    try {
        const [rows] = await pool.execute(
            `SELECT is_liked, is_collected FROM user_post_actions WHERE post_id = ? AND user_id = ?`,
            [postId, userId]
        );
        if (rows.length > 0) {
            return {
                is_liked: rows[0].is_liked,
                is_collected: rows[0].is_collected
            };
        }
        return {
            is_liked: false,
            is_collected: false
        };
    } catch (error) {
        console.error('检查用户操作状态失败:', error);
        throw error;
    }
}

// 更新用户操作状态
async function updateUserPostState(postId, userId, type, isActive) {
    try {
        // 先检查是否存在记录
        const [existing] = await pool.execute(
            `SELECT id FROM user_post_actions WHERE post_id = ? AND user_id = ?`,
            [postId, userId]
        );

        if (existing.length === 0) {
            // 如果不存在记录，创建新记录
            await pool.execute(
                `INSERT INTO user_post_actions (post_id, user_id, is_liked, is_collected) 
                 VALUES (?, ?, ?, ?)`,
                [postId, userId, type === 'like' ? isActive : false, type === 'collection' ? isActive : false]
            );
        } else {
            // 如果存在记录，更新对应字段
            const field = type === 'like' ? 'is_liked' : 'is_collected';
            await pool.execute(
                `UPDATE user_post_actions SET ${field} = ? WHERE post_id = ? AND user_id = ?`,
                [isActive, postId, userId]
            );
        }

        // 更新帖子计数
        const increment = isActive ? 1 : -1;
        const column = type === 'like' ? 'like_count' : 'collection_count';
        await pool.execute(
            `UPDATE posts SET ${column} = ${column} + ? WHERE id = ?`,
            [increment, postId]
        );
    } catch (error) {
        console.error('更新用户操作状态失败:', error);
        throw error;
    }
}

// 获取帖子热度
async function getPostHeat(postId) {
    try {
        const [rows] = await pool.execute(
            `SELECT like_count, collection_count FROM posts WHERE id = ?`,
            [postId]
        );
        if (rows.length > 0) {
            const { like_count, collection_count } = rows[0];
            return (2 * like_count + 3 * collection_count) * 10;
        }
        return 0;
    } catch (error) {
        console.error('获取帖子热度失败:', error);
        throw error;
    }
}

module.exports = {
    checkUserPostState,
    updateUserPostState,
    getPostHeat
}; 

// const mysql = require('mysql2/promise');
// const dbConfig = require('./dbConfig');

// // 创建数据库连接池
// const pool = mysql.createPool(dbConfig);

// // 检查用户是否点赞/收藏
// async function checkUserAction(postId, userId, actionType) {
//     try {
//         const [rows] = await pool.execute(
//             `SELECT * FROM user_actions WHERE post_id = ? AND user_id = ? AND action_type = ?`,
//             [postId, userId, actionType]
//         );
//         return rows.length > 0;
//     } catch (error) {
//         console.error('检查用户操作失败:', error);
//         throw error;
//     }
// }

// // 更新用户操作状态
// async function updateUserAction(postId, userId, actionType, isActive) {
//     try {
//         if (isActive) {
//             // 添加用户操作记录
//             await pool.execute(
//                 `INSERT INTO user_actions (post_id, user_id, action_type) VALUES (?, ?, ?)`,
//                 [postId, userId, actionType]
//             );
//         } else {
//             // 删除用户操作记录
//             await pool.execute(
//                 `DELETE FROM user_actions WHERE post_id = ? AND user_id = ? AND action_type = ?`,
//                 [postId, userId, actionType]
//             );
//         }
//     } catch (error) {
//         console.error('更新用户操作失败:', error);
//         throw error;
//     }
// }

// // 更新帖子点赞/收藏数
// async function updatePostCount(postId, actionType, increment) {
//     try {
//         const column = actionType === 'like' ? 'like_count' : 'collection_count';
//         await pool.execute(
//             `UPDATE posts SET ${column} = ${column} + ? WHERE id = ?`,
//             [increment, postId]
//         );
//     } catch (error) {
//         console.error('更新帖子计数失败:', error);
//         throw error;
//     }
// }

// // 获取帖子热度
// async function getPostHeat(postId) {
//     try {
//         const [rows] = await pool.execute(
//             `SELECT like_count, collection_count FROM posts WHERE id = ?`,
//             [postId]
//         );
//         if (rows.length > 0) {
//             const { like_count, collection_count } = rows[0];
//             return (2 * like_count + 3 * collection_count) * 10;
//         }
//         return 0;
//     } catch (error) {
//         console.error('获取帖子热度失败:', error);
//         throw error;
//     }
// }

// module.exports = {
//     checkUserAction,
//     updateUserAction,
//     updatePostCount,
//     getPostHeat
// }; 