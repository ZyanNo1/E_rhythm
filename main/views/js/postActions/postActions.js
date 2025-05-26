// 处理点赞和收藏操作
export async function handlePostAction(postId, type, isActive) {
    try {
        const response = await fetch('/api/post/action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                postId,
                type,  // 'like' 或 'collection'
                isActive
            })
        });

        if (!response.ok) {
            throw new Error('操作失败');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('操作失败:', error);
        throw error;
    }
}

// 更新热度显示
export function updateHeatDisplay(postElement, newHeat) {
    const heatElement = postElement.querySelector('.heat');
    if (heatElement) {
        heatElement.textContent = `🔥 ${newHeat}`;
    }
}

// 初始化帖子状态
export async function initializePostState(postId, userId) {
    try {
        const response = await fetch(`/api/post/state?postId=${postId}&userId=${userId}`);
        if (!response.ok) {
            throw new Error('获取状态失败');
        }

        const state = await response.json();
        // 返回包含点赞和收藏状态的对象
        return {
            is_liked: state.is_liked || false,
            is_collected: state.is_collected || false
        };
    } catch (error) {
        console.error('初始化状态失败:', error);
        throw error;
    }
} 

// // 处理点赞和收藏操作
// export async function handlePostAction(postId, actionType, isActive) {
//     try {
//         const response = await fetch('/api/post/action', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 postId,
//                 actionType,
//                 isActive
//             })
//         });

//         if (!response.ok) {
//             throw new Error('操作失败');
//         }

//         const result = await response.json();
//         return result;
//     } catch (error) {
//         console.error('操作失败:', error);
//         throw error;
//     }
// }

// // 更新热度显示
// export function updateHeatDisplay(postElement, newHeat) {
//     const heatElement = postElement.querySelector('.heat');
//     if (heatElement) {
//         heatElement.textContent = `🔥 ${newHeat}`;
//     }
// }

// // 初始化帖子状态
// export async function initializePostState(postId, userId) {
//     try {
//         const response = await fetch(`/api/post/state?postId=${postId}&userId=${userId}`);
//         if (!response.ok) {
//             throw new Error('获取状态失败');
//         }

//         const state = await response.json();
//         return state;
//     } catch (error) {
//         console.error('初始化状态失败:', error);
//         throw error;
//     }
// } 