const { pool, getUtf8Connection } = require('../config/database');

class Transaction {
    // 모든 거래 ?�역 조회 (?�용?�별)
    static async getAll(userId = null) {
        let conn;
        try {
            conn = await getUtf8Connection();
            let query = `
                SELECT t.*, c.name as category_name, c.color as category_color,
                       a.name as asset_name, at.name as asset_type_name, at.icon as asset_icon, at.color as asset_color,
                       DATE_FORMAT(t.date, '%Y-%m-%d') as date_formatted
                FROM transactions t 
                LEFT JOIN categories c ON t.category_id = c.id 
                LEFT JOIN assets a ON t.asset_id = a.id
                LEFT JOIN asset_types at ON a.asset_type_id = at.id
            `;
            let params = [];
            if (userId) {
                query += ' WHERE t.user_id = ?';
                params.push(userId);
            }
            query += ' ORDER BY t.date DESC, t.created_at DESC';
            const rows = await conn.query(query, params);
            // date ?�드�?문자?�로 변??
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

    // ?�별 거래 ?�역 조회 (?�용?�별)
    static async getByMonth(year, month, userId = null) {
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
        let conn;
        try {
            conn = await getUtf8Connection();
            let query = `
                SELECT t.*, c.name as category_name, c.color as category_color,
                       a.name as asset_name, at.name as asset_type_name, at.icon as asset_icon, at.color as asset_color,
                       DATE_FORMAT(t.date, '%Y-%m-%d') as date_formatted
                FROM transactions t 
                LEFT JOIN categories c ON t.category_id = c.id 
                LEFT JOIN assets a ON t.asset_id = a.id
                LEFT JOIN asset_types at ON a.asset_type_id = at.id
                WHERE t.date BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];
            if (userId) {
                query += ' AND t.user_id = ?';
                params.push(userId);
            }
            query += ' ORDER BY t.date DESC, t.created_at DESC';
            const rows = await conn.query(query, params);
            // date ?�드�?문자?�로 변??
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

    // 거래 ?�역 추�?
    static async create(transactionData) {
        const { amount, description, category_id, type, date, user_id, account, card, memo, asset_id } = transactionData;
        console.log('거래 생성 시작:', { user_id, user_id_type: typeof user_id, transactionData });
        
        let conn;
        try {
            conn = await getUtf8Connection();
            
            // 트랜잭션 시작
            await conn.beginTransaction();
            
            // 거래 생성
            const result = await conn.query(
                'INSERT INTO transactions (amount, description, category_id, type, date, user_id, account, card, memo, asset_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [amount, description, category_id, type, date, user_id, account || null, card || null, memo || null, asset_id || null]
            );
            
            // 자산 금액 업데이트 (자산이 선택된 경우)
            if (asset_id) {
                await this.updateAssetAmount(conn, asset_id, amount, type, 'add');
            }
            
            // 트랜잭션 커밋
            await conn.commit();
            
            console.log('거래 생성 완료:', { insertId: result.insertId, user_id, asset_updated: !!asset_id });
            
            return { 
                id: result.insertId, 
                ...transactionData,
                date: typeof date === 'string' ? date : date.toISOString().split('T')[0]
            };
        } catch (err) {
            console.error('거래 생성 오류:', err);
            if (conn) {
                await conn.rollback();
            }
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 자산 금액 업데이트 헬퍼 메서드
    static async updateAssetAmount(conn, assetId, amount, transactionType, operation) {
        try {
            let updateQuery;
            const parsedAmount = parseFloat(amount);
            
            if (operation === 'add') {
                // 거래 추가 시
                if (transactionType === 'income') {
                    // 수입: 자산 증가
                    updateQuery = 'UPDATE assets SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                } else {
                    // 지출: 자산 감소
                    updateQuery = 'UPDATE assets SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                }
            } else if (operation === 'subtract') {
                // 거래 삭제 시 (역방향)
                if (transactionType === 'income') {
                    // 수입 삭제: 자산 감소
                    updateQuery = 'UPDATE assets SET amount = amount - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                } else {
                    // 지출 삭제: 자산 증가
                    updateQuery = 'UPDATE assets SET amount = amount + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                }
            }
            
            await conn.query(updateQuery, [parsedAmount, assetId]);
            console.log(`자산 ${assetId} 금액 업데이트: ${operation} ${parsedAmount} (${transactionType})`);
        } catch (err) {
            console.error('자산 금액 업데이트 오류:', err);
            throw err;
        }
    }

    // 거래 내역 수정
    static async update(id, transactionData, userId = null) {
        const { amount, description, category_id, type, date, account, card, memo, asset_id } = transactionData;
        let conn;
        try {
            conn = await getUtf8Connection();
            
            // 트랜잭션 시작
            await conn.beginTransaction();
            
            // 기존 거래 정보 조회 (자산 업데이트를 위해)
            let selectQuery = 'SELECT amount, type, asset_id FROM transactions WHERE id = ?';
            let selectParams = [id];
            if (userId) {
                selectQuery += ' AND user_id = ?';
                selectParams.push(userId);
            }
            const existingTransaction = await conn.query(selectQuery, selectParams);
            
            if (existingTransaction.length === 0) {
                throw new Error('수정할 거래를 찾을 수 없습니다.');
            }
            
            const oldTransaction = existingTransaction[0];
            
            // 기존 자산에서 이전 거래 금액 제거
            if (oldTransaction.asset_id) {
                await this.updateAssetAmount(conn, oldTransaction.asset_id, oldTransaction.amount, oldTransaction.type, 'subtract');
            }
            
            // 거래 업데이트
            let updateQuery = 'UPDATE transactions SET amount = ?, description = ?, category_id = ?, type = ?, date = ?, account = ?, card = ?, memo = ?, asset_id = ? WHERE id = ?';
            let updateParams = [amount, description, category_id, type, date, account || null, card || null, memo || null, asset_id || null, id];
            if (userId) {
                updateQuery += ' AND user_id = ?';
                updateParams.push(userId);
            }
            await conn.query(updateQuery, updateParams);
            
            // 새로운 자산에 새로운 거래 금액 추가
            if (asset_id) {
                await this.updateAssetAmount(conn, asset_id, amount, type, 'add');
            }
            
            // 트랜잭션 커밋
            await conn.commit();
            
            return { 
                id, 
                ...transactionData,
                date: typeof date === 'string' ? date : date.toISOString().split('T')[0]
            };
        } catch (err) {
            console.error('거래 수정 오류:', err);
            if (conn) {
                await conn.rollback();
            }
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // 거래 내역 삭제 (async/await + pool)
    static async delete(id, userId = null) {
        let conn;
        try {
            conn = await getUtf8Connection();
            
            // 트랜잭션 시작
            await conn.beginTransaction();
            
            // 삭제할 거래 정보 조회 (자산 업데이트를 위해)
            let selectQuery = 'SELECT amount, type, asset_id FROM transactions WHERE id = ?';
            let selectParams = [id];
            if (userId) {
                selectQuery += ' AND user_id = ?';
                selectParams.push(userId);
            }
            const transaction = await conn.query(selectQuery, selectParams);
            
            if (transaction.length === 0) {
                throw new Error('삭제할 거래를 찾을 수 없습니다.');
            }
            
            const transactionData = transaction[0];
            
            // 자산에서 거래 금액 제거 (거래 삭제이므로 역방향)
            if (transactionData.asset_id) {
                await this.updateAssetAmount(conn, transactionData.asset_id, transactionData.amount, transactionData.type, 'subtract');
            }
            
            // 거래 삭제
            let deleteQuery = 'DELETE FROM transactions WHERE id = ?';
            let deleteParams = [id];
            if (userId) {
                deleteQuery += ' AND user_id = ?';
                deleteParams.push(userId);
            }
            const result = await conn.query(deleteQuery, deleteParams);
            
            // 트랜잭션 커밋
            await conn.commit();
            
            console.log(`거래 삭제 완료: ${id}, 자산 업데이트: ${!!transactionData.asset_id}`);
            
            // result.affectedRows: 삭제된 행 수(MariaDB)
            return { deletedRows: result.affectedRows };
        } catch (err) {
            console.error('거래 삭제 오류:', err);
            if (conn) {
                await conn.rollback();
            }
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }

    // ?�별 ?�계 조회 (?�용?�별, async/await + pool)
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

    // 카테고리�??�계 조회 (?�용?�별, async/await + pool)
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

    // 거래 ?�역 ?�유�??�인 (async/await + pool)
    static async isOwner(transactionId, userId) {
        let conn;
        try {
            conn = await getUtf8Connection();
            const rows = await conn.query('SELECT user_id FROM transactions WHERE id = ?', [transactionId]);
            const row = rows[0];
            
            console.log('isOwner ?�인:', {
                transactionId: transactionId,
                userId: userId,
                dbResult: row,
                userIdFromDB: row ? row.user_id : null,
                userIdType: typeof userId,
                dbUserIdType: row ? typeof row.user_id : 'null',
                isEqual: row && row.user_id === userId,
                isEqualStrict: row && parseInt(row.user_id) === parseInt(userId)
            });
            
            // ?�??변?�하??비교 (문자???�자 불일�?문제 ?�결)
            return row && parseInt(row.user_id) === parseInt(userId);
        } catch (err) {
            console.error('isOwner ?�류:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Transaction; 
