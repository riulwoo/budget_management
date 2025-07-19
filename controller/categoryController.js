const Category = require('../model/Category');

class CategoryController {
    // 모든 카테고리 조회
    static async getAllCategories(req, res) {
        try {
            const userId = req.user ? req.user.id : null;
            const categories = await Category.getAllWithUsage(userId);
            res.json({ success: true, data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 타입별 카테고리 조회
    static async getCategoriesByType(req, res) {
        try {
            const { type } = req.params;
            const userId = req.user ? req.user.id : null;
            const categories = await Category.getByType(type, userId);
            res.json({ success: true, data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 카테고리 추가
    static async createCategory(req, res) {
        try {
            const { name, type, color } = req.body;
            const userId = req.user ? req.user.id : null;
            
            if (!name || !type) {
                return res.status(400).json({ 
                    success: false, 
                    message: '카테고리명과 타입은 필수입니다.' 
                });
            }

            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: '타입은 income 또는 expense여야 합니다.' 
                });
            }

            const category = await Category.create({ 
                name, 
                type, 
                color: color || '#007bff',
                user_id: userId
            });
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 카테고리 수정
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, type, color } = req.body;
            const userId = req.user ? req.user.id : null;
            
            if (!name || !type) {
                return res.status(400).json({ 
                    success: false, 
                    message: '카테고리명과 타입은 필수입니다.' 
                });
            }

            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: '타입은 income 또는 expense여야 합니다.' 
                });
            }

            // 소유권 확인
            if (userId) {
                const isOwner = await Category.isOwner(id, userId);
                if (!isOwner) {
                    return res.status(403).json({ 
                        success: false, 
                        message: '이 카테고리를 수정할 권한이 없습니다.' 
                    });
                }
            }

            const category = await Category.update(id, { name, type, color: color || '#007bff' }, userId);
            res.json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 카테고리 삭제
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user ? req.user.id : null;
            
            // 소유권 확인
            if (userId) {
                const isOwner = await Category.isOwner(id, userId);
                if (!isOwner) {
                    return res.status(403).json({ 
                        success: false, 
                        message: '이 카테고리를 삭제할 권한이 없습니다.' 
                    });
                }
            }

            const result = await Category.delete(id, userId);
            
            if (result.deletedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: '카테고리를 찾을 수 없습니다.' 
                });
            }
            
            res.json({ success: true, message: '카테고리가 삭제되었습니다.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 카테고리 사용 현황 조회
    static async getCategoryUsage(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user ? req.user.id : null;
            
            // 소유권 확인
            if (userId) {
                const isOwner = await Category.isOwner(id, userId);
                if (!isOwner) {
                    return res.status(403).json({ 
                        success: false, 
                        message: '이 카테고리의 사용 현황을 조회할 권한이 없습니다.' 
                    });
                }
            }

            const usage = await Category.getUsageStats(id, userId);
            res.json({ success: true, data: usage });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = CategoryController; 