const { pool, getUtf8Connection } = require('../config/database');

// BigInt �??�짜 변???�수
function convertBigIntToString(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'bigint') {
        return String(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    
    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'bigint') {
                converted[key] = String(value);
            } else if (key === 'date' && value instanceof Date) {
                // Date 객체�?YYYY-MM-DD ?�식?�로 변??
                converted[key] = value.toISOString().split('T')[0];
            } else if (key === 'created_at' || key === 'updated_at') {
                // ?�?�스?�프 ?�드 처리
                if (value instanceof Date) {
                    converted[key] = value.toISOString();
                } else {
                    converted[key] = value;
                }
            } else {
                converted[key] = convertBigIntToString(value);
            }
        }
        return converted;
    }
    
    return obj;
}

class Memo {
    // ??메모 조회 (?�이�??�함)
    static async getMy(userId, page = 1, limit = 10, search = '') {
        let conn;
        try {
            conn = await getUtf8Connection();
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE m.user_id = ?';
            let params = [userId];
            
            if (search) {
                whereClause += ' AND (m.title LIKE ? OR m.content LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            // ?�체 개수 조회
            const countQuery = `SELECT COUNT(*) as total FROM memos m ${whereClause}`;
            const countResult = await conn.query(countQuery, params);
            const total = Number(countResult[0].total);
            
            // 메모 목록 조회
            const dataQuery = `
                SELECT m.*, u.username 
                FROM memos m
                JOIN users u ON m.user_id = u.id
                ${whereClause} 
                ORDER BY m.created_at DESC 
                LIMIT ? OFFSET ?
            `;
            const memos = await conn.query(dataQuery, [...params, limit, offset]);
            
            return {
                memos: convertBigIntToString(memos),
                pagination: {
                    current: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
        } finally {
            if (conn) conn.release();
        }
    }

    // 공개 메모 조회 (?�이�??�함)
    static async getPublic(page = 1, limit = 10, search = '') {
        let conn;
        try {
            conn = await getUtf8Connection();
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE m.visibility = "public"';
            let params = [];
            
            if (search) {
                whereClause += ' AND (m.title LIKE ? OR m.content LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }
            
            // ?�체 개수 조회
            const countQuery = `SELECT COUNT(*) as total FROM memos m ${whereClause}`;
            const countResult = await conn.query(countQuery, params);
            const total = Number(countResult[0].total);
            
            // 메모 목록 조회
            const dataQuery = `
                SELECT m.*, u.username 
                FROM memos m
                JOIN users u ON m.user_id = u.id
                ${whereClause} 
                ORDER BY m.created_at DESC 
                LIMIT ? OFFSET ?
            `;
            const memos = await conn.query(dataQuery, [...params, limit, offset]);
            
            return {
                memos: convertBigIntToString(memos),
                pagination: {
                    current: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
        } finally {
            if (conn) conn.release();
        }
    }

    // ?�정 ?�짜??메모 조회
    static async getByDate(userId, date) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            const query = `
                SELECT m.*, u.username 
                FROM memos m
                JOIN users u ON m.user_id = u.id
                WHERE m.user_id = ? AND m.date = ?
                ORDER BY m.created_at DESC
            `;
            const memos = await conn.query(query, [userId, date]);
            return convertBigIntToString(memos);
        } finally {
            if (conn) conn.release();
        }
    }

    // 메모 ?�성
    static async create(memoData) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            console.log('DB ?�결 ?�공, 메모 ?�성 ?�작');
            
            const query = `
                INSERT INTO memos (user_id, title, content, date, priority, visibility, is_completed) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                memoData.user_id,
                memoData.title,
                memoData.content || null,
                memoData.date,
                memoData.priority || 'medium',
                memoData.visibility || 'private',
                memoData.is_completed || false
            ];
            
            console.log('쿼리 ?�행:', query);
            console.log('값들:', values);
            
            const result = await conn.query(query, values);
            console.log('쿼리 결과:', result);
            
            // BigInt�?먼�? 문자?�로 변??
            const memoWithId = {
                id: String(result.insertId),
                ...memoData
            };
            
            return convertBigIntToString(memoWithId);
        } catch (error) {
            console.error('Memo.create ?�류:', error);
            throw error;
        } finally {
            if (conn) {
                conn.release();
                console.log('DB ?�결 ?�제');
            }
        }
    }

    // 메모 ?�정
    static async update(id, memoData) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            const query = `
                UPDATE memos 
                SET title = ?, content = ?, date = ?, priority = ?, visibility = ?, is_completed = ?
                WHERE id = ?
            `;
            const values = [
                memoData.title,
                memoData.content || null,
                memoData.date,
                memoData.priority || 'medium',
                memoData.visibility || 'private',
                memoData.is_completed || false,
                id
            ];
            
            const result = await conn.query(query, values);
            return result.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    }

    // 메모 ??��
    static async delete(id) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            const query = 'DELETE FROM memos WHERE id = ?';
            const result = await conn.query(query, [id]);
            return result.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    }

    // 메모 ?�유???�인
    static async isOwner(memoId, userId) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            const query = 'SELECT user_id FROM memos WHERE id = ?';
            const result = await conn.query(query, [memoId]);
            
            if (result.length === 0) {
                console.log('메모�?찾을 ???�음:', memoId);
                return false;
            }
            
            const dbUserId = String(result[0].user_id);
            const requestUserId = String(userId);
            
            console.log('?�유???�인:', { 
                memoId, 
                dbUserId, 
                requestUserId, 
                isOwner: dbUserId === requestUserId 
            });
            
            return dbUserId === requestUserId;
        } finally {
            if (conn) conn.release();
        }
    }

    // 메모 ?�료 ?�태 ?��?
    static async toggleComplete(id) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            const query = 'UPDATE memos SET is_completed = NOT is_completed WHERE id = ?';
            const result = await conn.query(query, [id]);
            return result.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    }

    // ID�??�일 메모 조회
    static async getById(id) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            const query = `
                SELECT m.*, u.username 
                FROM memos m
                JOIN users u ON m.user_id = u.id
                WHERE m.id = ?
            `;
            const result = await conn.query(query, [id]);
            return result.length > 0 ? convertBigIntToString(result[0]) : null;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Memo;
