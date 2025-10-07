const { pool, getUtf8Connection } = require('../config/database');

class Transaction {
    // Î™®Îì† Í±∞Îûò ?¥Ïó≠ Ï°∞Ìöå (?¨Ïö©?êÎ≥Ñ)
    static async getAll(userId = null) {
        let conn;
        try {
            conn = await getUtf8Connection();
            let query = `
                SELECT t.*, c.name as category_name, c.color as category_color,
                       DATE_FORMAT(t.date, '%Y-%m-%d') as date_formatted
                FROM transactions t 
                LEFT JOIN categories c ON t.category_id = c.id 
            `;
            let params = [];
            if (userId) {
                query += ' WHERE t.user_id = ?';
                params.push(userId);
            }
            query += ' ORDER BY t.date DESC, t.created_at DESC';
            const rows = await conn.query(query, params);
            // date ?ÑÎìúÎ•?Î¨∏Ïûê?¥Î°ú Î≥Ä??
            return rows.map(row => ({
                ...row,
                date: row.date_formatted || (row.date ? row.date.toISOString().split('T')[0] : null)
            }));
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // ?îÎ≥Ñ Í±∞Îûò ?¥Ïó≠ Ï°∞Ìöå (?¨Ïö©?êÎ≥Ñ)
    static async getByMonth(year, month, userId = null) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        let conn;
        try {
            conn = await getUtf8Connection();
            let query = `
                SELECT t.*, c.name as category_name, c.color as category_color,
                       DATE_FORMAT(t.date, '%Y-%m-%d') as date_formatted
                FROM transactions t 
                LEFT JOIN categories c ON t.category_id = c.id 
                WHERE t.date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            if (userId) {
                query += ' AND t.user_id = ?';
                params.push(userId);
            }
            query += ' ORDER BY t.date DESC, t.created_at DESC';
            const rows = await conn.query(query, params);
            // date ?ÑÎìúÎ•?Î¨∏Ïûê?¥Î°ú Î≥Ä??
            return rows.map(row => ({
                ...row,
                date: row.date_formatted || (row.date ? row.date.toISOString().split('T')[0] : null)
            }));
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // Í±∞Îûò ?¥Ïó≠ Ï∂îÍ?
    static async create(transactionData) {
        const { amount, description, category_id, type, date, user_id, account, card, memo } = transactionData;
        console.log('Í±∞Îûò ?ùÏÑ± ?∞Ïù¥??', { user_id, user_id_type: typeof user_id, transactionData });
        
        let conn;
        try {
            conn = await getUtf8Connection();
            const result = await conn.query(
                'INSERT INTO transactions (amount, description, category_id, type, date, user_id, account, card, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [amount, description, category_id, type, date, user_id, account || null, card || null, memo || null]
            );
            
            console.log('Í±∞Îûò ?ùÏÑ± ?ÑÎ£å:', { insertId: result.insertId, user_id });
            
            return { 
                id: result.insertId, 
                ...transactionData,
                date: typeof date === 'string' ? date : date.toISOString().split('T')[0]
            };
        } catch (err) {
            console.error('Í±∞Îûò ?ùÏÑ± ?§Î•ò:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // Í±∞Îûò ?¥Ïó≠ ?òÏ†ï
    static async update(id, transactionData, userId = null) {
        const { amount, description, category_id, type, date, account, card, memo } = transactionData;
        let conn;
        try {
            conn = await getUtf8Connection();
            let query = 'UPDATE transactions SET amount = ?, description = ?, category_id = ?, type = ?, date = ?, account = ?, card = ?, memo = ? WHERE id = ?';
            let params = [amount, description, category_id, type, date, account || null, card || null, memo || null, id];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            return { 
                id, 
                ...transactionData,
                date: typeof date === 'string' ? date : date.toISOString().split('T')[0]
            };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // Í±∞Îûò ?¥Ïó≠ ??†ú (async/await + pool)
    static async delete(id, userId = null) {
        let conn;
        try {
            conn = await getUtf8Connection();
            let query = 'DELETE FROM transactions WHERE id = ?';
            let params = [id];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            const result = await conn.query(query, params);
            // result.affectedRows: ??†ú??????(MariaDB)
            return { deletedRows: result.affectedRows };
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // ?îÎ≥Ñ ?µÍ≥Ñ Ï°∞Ìöå (?¨Ïö©?êÎ≥Ñ, async/await + pool)
    static async getMonthlyStats(year, month, userId = null) {
        let conn;
        try {
            conn = await getUtf8Connection();
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            let query = `
                SELECT 
                    type,
                    SUM(amount) as total_amount,
                    COUNT(*) as count
                FROM transactions 
                WHERE date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }
            query += ' GROUP BY type';
            const rows = await conn.query(query, params);
            const stats = {
                income: { total: 0, count: 0 },
                expense: { total: 0, count: 0 }
            };
            rows.forEach(row => {
                stats[row.type] = {
                    total: parseFloat(row.total_amount),
                    count: row.count
                };
            });
            return stats;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // Ïπ¥ÌÖåÍ≥†Î¶¨Î≥??µÍ≥Ñ Ï°∞Ìöå (?¨Ïö©?êÎ≥Ñ, async/await + pool)
    static async getCategoryStats(year, month, userId = null) {
        let conn;
        try {
            conn = await getUtf8Connection();
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            let query = `
                SELECT 
                    c.name as category_name,
                    c.color as category_color,
                    t.type,
                    SUM(t.amount) as total_amount,
                    COUNT(*) as count
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            if (userId) {
                query += ' AND t.user_id = ?';
                params.push(userId);
            }
            query += ' GROUP BY c.id, t.type ORDER BY t.type, total_amount DESC';
            const rows = await conn.query(query, params);
            return rows;
        } catch (err) {
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // Í±∞Îûò ?¥Ïó≠ ?åÏú†Í∂??ïÏù∏ (async/await + pool)
    static async isOwner(transactionId, userId) {
        let conn;
        try {
            conn = await getUtf8Connection();
            const rows = await conn.query('SELECT user_id FROM transactions WHERE id = ?', [transactionId]);
            const row = rows[0];
            
            console.log('isOwner ?ïÏù∏:', {
                transactionId: transactionId,
                userId: userId,
                dbResult: row,
                userIdFromDB: row ? row.user_id : null,
                userIdType: typeof userId,
                dbUserIdType: row ? typeof row.user_id : 'null',
                isEqual: row && row.user_id === userId,
                isEqualStrict: row && parseInt(row.user_id) === parseInt(userId)
            });
            
            // ?Ä??Î≥Ä?òÌïò??ÎπÑÍµê (Î¨∏Ïûê???´Ïûê Î∂àÏùºÏπ?Î¨∏Ï†ú ?¥Í≤∞)
            return row && parseInt(row.user_id) === parseInt(userId);
        } catch (err) {
            console.error('isOwner ?§Î•ò:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Transaction; 
