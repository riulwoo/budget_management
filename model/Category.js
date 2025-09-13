const pool = require('../config/database');
    
class Category {
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
            return rows;
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
            return rows;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 추가
    static async create(categoryData) {
        const { name, type, color, user_id } = categoryData;
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'INSERT INTO categories (name, type, color, user_id) VALUES (?, ?, ?, ?)',
                [name, type, color, user_id]
            );
            return { id: result.insertId, name, type, color, user_id };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 카테고리 수정
    static async update(id, categoryData, userId = null) {
        const { name, type, color } = categoryData;
        let conn;
        try {
            conn = await pool.getConnection();
            let query = 'UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?';
            let params = [name, type, color, id];
            if (userId) {
                query += ' AND (user_id = ? OR user_id IS NULL)';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            return { id, name, type, color };
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
            return { deletedRows: result.affectedRows };
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