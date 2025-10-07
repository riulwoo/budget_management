const Transaction = require('../model/Transaction');
const Category = require('../model/Category');

class TransactionController {
    // 모든 거래 내역 조회
    static async getAllTransactions(req, res) {
        try {
            const userId = req.user ? req.user.id : null;
            const transactions = await Transaction.getAll(userId);
            res.json({ success: true, data: transactions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 월별 거래 내역 조회
    static async getTransactionsByMonth(req, res) {
        try {
            const { year, month } = req.params;
            const userId = req.user ? req.user.id : null;
            const transactions = await Transaction.getByMonth(parseInt(year), parseInt(month), userId);
            res.json({ success: true, data: transactions });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 거래 내역 추가
    static async createTransaction(req, res) {
        try {
            const { amount, description, category_id, type, date, account, card, memo } = req.body;
            const userId = req.user ? req.user.id : null;
            
            if (!amount || !type || !date) {
                return res.status(400).json({ 
                    success: false, 
                    message: '금액, 타입, 날짜는 필수입니다.' 
                });
            }

            if (!['income', 'expense', 'transfer'].includes(type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: '타입은 income, expense, transfer 중 하나여야 합니다.' 
                });
            }

            if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: '유효한 금액을 입력해주세요.' 
                });
            }

            // 카테고리 소유권 확인
            if (category_id && userId) {
                const isCategoryOwner = await Category.isOwner(category_id, userId);
                if (!isCategoryOwner) {
                    return res.status(403).json({ 
                        success: false, 
                        message: '선택한 카테고리에 대한 권한이 없습니다.' 
                    });
                }
            }

            const transaction = await Transaction.create({ 
                amount: parseFloat(amount), 
                description: description || '', 
                category_id: category_id || null, 
                type, 
                date,
                user_id: userId,
                account: account || null,
                card: card || null,
                memo: memo || null
            });
            
            res.status(201).json({ success: true, data: transaction });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 거래 내역 수정
    static async updateTransaction(req, res) {
        try {
            const id = req.params.id;
            const { amount, description, category_id, type, date, account, card, memo } = req.body;
            const userId = req.user ? req.user.id : null;
            
            if (!amount || !type || !date) {
                return res.status(400).json({ 
                    success: false, 
                    message: '금액, 타입, 날짜는 필수입니다.' 
                });
            }

            if (!['income', 'expense', 'transfer'].includes(type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: '타입은 income, expense, transfer 중 하나여야 합니다.' 
                });
            }

            if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: '유효한 금액을 입력해주세요.' 
                });
            }

            // 소유권 확인
            if (userId) {
                const isOwner = await Transaction.isOwner(id, userId);
                if (!isOwner) {
                    return res.status(403).json({ 
                        success: false, 
                        message: '이 거래 내역을 수정할 권한이 없습니다.' 
                    });
                }

                // 카테고리 소유권 확인
                if (category_id) {
                    const isCategoryOwner = await Category.isOwner(category_id, userId);
                    if (!isCategoryOwner) {
                        return res.status(403).json({ 
                            success: false, 
                            message: '선택한 카테고리에 대한 권한이 없습니다.' 
                        });
                    }
                }
            }

            const transaction = await Transaction.update(id, { 
                amount: parseFloat(amount), 
                description: description || '', 
                category_id: category_id || null, 
                type, 
                date,
                account: account || null,
                card: card || null,
                memo: memo || null
            }, userId);
            
            res.json({ success: true, data: transaction });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 거래 내역 삭제
    static async deleteTransaction(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user ? req.user.id : null;
            
            console.log('삭제 요청:', { transactionId: id, userId: userId });
            
            // 소유권 확인
            if (userId) {
                const isOwner = await Transaction.isOwner(id, userId);
                console.log('소유권 확인 결과:', { transactionId: id, userId: userId, isOwner: isOwner });
                
                if (!isOwner) {
                    console.log('권한 없음 - 삭제 거부');
                    return res.status(403).json({ 
                        success: false, 
                        message: '이 거래 내역을 삭제할 권한이 없습니다.' 
                    });
                }
            }

            const result = await Transaction.delete(id, userId);
            
            if (result.deletedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: '거래 내역을 찾을 수 없습니다.' 
                });
            }
            
            res.json({ success: true, message: '거래 내역이 삭제되었습니다.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 월별 통계 조회
    static async getMonthlyStats(req, res) {
        try {
            const { year, month } = req.params;
            const userId = req.user ? req.user.id : null;
            const stats = await Transaction.getMonthlyStats(parseInt(year), parseInt(month), userId);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 카테고리별 통계 조회
    static async getCategoryStats(req, res) {
        try {
            const { year, month } = req.params;
            const userId = req.user ? req.user.id : null;
            const stats = await Transaction.getCategoryStats(parseInt(year), parseInt(month), userId);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = TransactionController; 