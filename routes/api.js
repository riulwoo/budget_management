const express = require('express');
const router = express.Router();
const CategoryController = require('../controller/categoryController');
const TransactionController = require('../controller/transactionController');
const AuthController = require('../controller/authController');
const BalanceController = require('../controller/balanceController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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

// 초기 자본금 라우트 (인증 필요)
router.get('/balance/initial', authenticateToken, BalanceController.getInitialBalance);
router.post('/balance/initial', authenticateToken, BalanceController.setInitialBalance);
router.get('/balance/total', authenticateToken, BalanceController.getTotalBalance);

// 아이디 찾기
router.post('/auth/find-username', AuthController.findUsername);
// 비밀번호 초기화
router.post('/auth/reset-password', AuthController.resetPassword);

module.exports = router; 