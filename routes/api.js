const express = require('express');
const router = express.Router();
const CategoryController = require('../controller/categoryController');
const TransactionController = require('../controller/transactionController');
const AuthController = require('../controller/authController');
const BalanceController = require('../controller/balanceController');
const MemoController = require("../controller/memoController");
const AssetController = require('../controller/assetController');
const AssetTypeController = require('../controller/assetTypeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// 헬스 체크 엔드포인트
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: '서버가 정상적으로 동작 중입니다.'
    }
  });
});

// 인증 라우트 (인증 불필요)
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);

// 인증이 필요한 라우트
router.get('/auth/profile', authenticateToken, AuthController.getProfile);
router.put('/auth/change-password', authenticateToken, AuthController.changePassword);

// 카테고리 라우트 (선택적 인증)
router.get('/categories', optionalAuth, CategoryController.getAllCategories);
router.get('/categories/:type', optionalAuth, CategoryController.getCategoriesByType);
router.post('/categories', authenticateToken, CategoryController.createCategory);
router.put('/categories/:id', authenticateToken, CategoryController.updateCategory);
router.delete('/categories/:id', authenticateToken, CategoryController.deleteCategory);
router.get('/categories/:id/usage', authenticateToken, CategoryController.getCategoryUsage);

// 거래 내역 라우트 (선택적 인증)
router.get('/transactions', optionalAuth, TransactionController.getAllTransactions);
router.get('/transactions/:year/:month', optionalAuth, TransactionController.getTransactionsByMonth);
router.post('/transactions', authenticateToken, TransactionController.createTransaction);
router.put('/transactions/:id', authenticateToken, TransactionController.updateTransaction);
router.delete('/transactions/:id', authenticateToken, TransactionController.deleteTransaction);

// 통계 라우트 (선택적 인증)
router.get('/stats/:year/:month', optionalAuth, TransactionController.getMonthlyStats);
router.get('/stats/:year/:month/categories', optionalAuth, TransactionController.getCategoryStats);

// 잔액 조회 라우트 (인증 필요)
router.get('/balance/total', authenticateToken, BalanceController.getTotalBalance);

// 자산 관리 라우트 (인증 필요)
router.get('/assets', authenticateToken, AssetController.getAssets);
router.post('/assets', authenticateToken, AssetController.createAsset);
router.put('/assets/:id', authenticateToken, AssetController.updateAsset);
router.delete('/assets/:id', authenticateToken, AssetController.deleteAsset);
router.get('/assets/total', authenticateToken, AssetController.getTotalAssets);
router.get('/assets/type/:typeId', authenticateToken, AssetController.getAssetsByType);

// 자산 유형 관리 라우트 (인증 필요)
router.get('/asset-types', authenticateToken, AssetTypeController.getAssetTypes);
router.post('/asset-types', authenticateToken, AssetTypeController.createAssetType);
router.put('/asset-types/:id', authenticateToken, AssetTypeController.updateAssetType);
router.delete('/asset-types/:id', authenticateToken, AssetTypeController.deleteAssetType);

// 메모 라우트
router.get('/memos/my', authenticateToken, MemoController.getMyMemos);
router.get('/memos/public', MemoController.getPublicMemos);
router.get('/memos/date/:date', authenticateToken, MemoController.getMemosByDate);
router.post('/memos', authenticateToken, MemoController.createMemo);
router.put('/memos/:id', authenticateToken, MemoController.updateMemo);
router.delete('/memos/:id', authenticateToken, MemoController.deleteMemo);
router.patch('/memos/:id/toggle', authenticateToken, MemoController.toggleComplete);

// 아이디 찾기
router.post('/auth/find-username', AuthController.findUsername);
// 비밀번호 초기화
router.post('/auth/reset-password', AuthController.resetPassword);

module.exports = router; 