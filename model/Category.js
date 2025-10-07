const pool = require('../config/database');

class Category {
    // 모든 카테고리 + 사용 현황(거래수, 총금액, 마지막 사용일) 반환
    static async getAllWithUsage(userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'SELECT * FROM categories';
            let params = [];
            if (userId) {
                query += ' WHERE user_id = ? OR user_id IS NULL';
                params.push(userId);
            }
            query += ' ORDER BY type, name';
            const categories = await conn.query(query, params);
            // 각 카테고리별 사용 현황 조회
            const result = [];
            for (const cat of categories) {
                // BigInt -> String 변환
                for (const key in cat) {
                    if (typeof cat[key] === 'bigint') cat[key] = cat[key].toString();
                }
                // 사용 현황 쿼리
                let usageQuery = `SELECT COUNT(*) as total_count, SUM(amount) as total_amount, MAX(date) as last_used FROM transactions WHERE category_id = ?`;
                let usageParams = [cat.id];
                if (userId) {
                    usageQuery += ' AND user_id = ?';
                    usageParams.push(userId);
                }
                const usageRows = await conn.query(usageQuery, usageParams);
                const usage = usageRows[0] || {};
                for (const key in usage) {
                    if (typeof usage[key] === 'bigint') usage[key] = usage[key].toString();
                }
                result.push({ ...cat, usage: {
                    total_count: usage.total_count || 0,
                    total_amount: usage.total_amount || 0,
                    last_used: usage.last_used || null
                }});
            }
            return result;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 모든 카테고리 조회 (사용자별)
    static async getAll(userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'SELECT * FROM categories';
            let params = [];
            if (userId) {
                query += ' WHERE user_id = ? OR user_id IS NULL';
                params.push(userId);
            }
            query += ' ORDER BY type, name';
            const rows = await conn.query(query, params);
            return rows.map(row => {
                for (const key in row) {
                    if (typeof row[key] === 'bigint') row[key] = row[key].toString();
                }
                return row;
            });
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 타입별 카테고리 조회 (사용자별)
    static async getByType(type, userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'SELECT * FROM categories WHERE type = ?';
            let params = [type];
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            query += ' ORDER BY name';
            const rows = await conn.query(query, params);
            return rows.map(row => {
                for (const key in row) {
                    if (typeof row[key] === 'bigint') row[key] = row[key].toString();
                }
                return row;
            });
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 추가
    // parent_id: null(대분류), 대분류id(중분류), 중분류id(소분류)
    static async create(categoryData) {
        const { name, type, color, user_id, parent_id = null } = categoryData;
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'INSERT INTO categories (name, type, color, user_id, parent_id) VALUES (?, ?, ?, ?, ?)',
                [name, type, color, user_id, parent_id]
            );
            return { id: typeof result.insertId === 'bigint' ? result.insertId.toString() : result.insertId, name, type, color, user_id, parent_id };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 수정
    static async update(id, categoryData, userId = null) {
        const { name, type, color, parent_id = null } = categoryData;
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'UPDATE categories SET name = ?, type = ?, color = ?, parent_id = ? WHERE id = ?';
            let params = [name, type, color, parent_id, id];
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            return { id: typeof id === 'bigint' ? id.toString() : id, name, type, color, parent_id };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 삭제
    static async delete(id, userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'DELETE FROM categories WHERE id = ?';
            let params = [id];
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            return { deletedRows: typeof result.affectedRows === 'bigint' ? result.affectedRows.toString() : result.affectedRows };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 소유권 확인
    static async isOwner(categoryId, userId) {
        let conn;
        try {
            conn = await pool.getConnection();
            const rows = await conn.query('SELECT user_id FROM categories WHERE id = ?', [categoryId]);
            const row = rows[0];
            if (row) {
                for (const key in row) {
                    if (typeof row[key] === 'bigint') row[key] = row[key].toString();
                }
            }
            return row && (row.user_id === userId || row.user_id === null);
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 사용 현황 조회
    static async getUsageStats(categoryId, userId = null) {
        let conn;
        try {
            conn = await pool.getConnection();
            let query = `
                SELECT 
                    COUNT(*) as total_count,
                    SUM(amount) as total_amount,
                    MAX(date) as last_used
                FROM transactions 
                WHERE category_id = ?
            `;
            let params = [categoryId];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            const rows = await conn.query(query, params);
            const row = rows[0] || {};
            for (const key in row) {
                if (typeof row[key] === 'bigint') row[key] = row[key].toString();
            }
            return {
                total_count: row.total_count || 0,
                total_amount: row.total_amount || 0,
                last_used: row.last_used
            };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Category;