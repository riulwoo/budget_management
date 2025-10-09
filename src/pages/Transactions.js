import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatAmount, formatDate } from '../utils/api';

const TransactionModal = lazy(() => import('../components/modals/TransactionModal'));

const Transactions = () => {
  const { currentUser } = useAuth();
  const { transactions, currentMonth, setCurrentMonth, deleteTransaction, addTransaction, updateTransaction } = useData();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 거래를 삭제하시겠습니까?')) {
      await deleteTransaction(id);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleModalSubmit = async (transactionData) => {
    if (editingTransaction) {
      // 수정 모드
      const result = await updateTransaction(editingTransaction.id, transactionData);
      if (result.success) {
        setEditingTransaction(null);
        setShowTransactionModal(false);
      }
      return result;
    } else {
      // 추가 모드
      return await addTransaction(transactionData);
    }
  };

  const handleModalHide = () => {
    setEditingTransaction(null);
    setShowTransactionModal(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>거래내역</h2>
        {currentUser && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowTransactionModal(true)}
          >
            <i className="fas fa-plus me-2"></i>거래 추가
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>거래내역</h5>
          <div>
            <input 
              type="month" 
              className="form-control" 
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {transactions.length === 0 ? (
            <p className="text-muted">거래내역이 없습니다.</p>
          ) : (
            transactions.map(transaction => (
              <div key={transaction.id} className="d-flex justify-content-between align-items-center mb-3 p-3 border rounded transaction-item">
                <div>
                  <div className="fw-bold">{transaction.description || '설명 없음'}</div>
                  <div className="d-flex align-items-center flex-wrap">
                    <small className="text-muted me-2">{formatDate(transaction.date)}</small>
                    {transaction.asset_name && (
                      <span className="badge bg-info text-dark me-2">
                        <i className={transaction.asset_icon || 'fas fa-wallet'}></i> {transaction.asset_name}
                      </span>
                    )}
                    {transaction.category_name && (
                      <span 
                        className="badge category-badge" 
                        style={{ backgroundColor: transaction.category_color }}
                      >
                        {transaction.category_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-end">
                  <div className={`fw-bold ${transaction.type === 'income' ? 'income' : 'expense'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </div>
                  {currentUser && (
                    <div className="btn-group btn-group-sm mt-2">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => handleEdit(transaction)}
                        title="수정"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => handleDelete(transaction.id)}
                        title="삭제"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showTransactionModal && (
        <Suspense fallback={
          <div className="modal fade show" style={{display: 'block'}}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">로딩 중...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }>
          <TransactionModal 
            show={showTransactionModal}
            onHide={handleModalHide}
            onSubmit={handleModalSubmit}
            transaction={editingTransaction}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Transactions; 