import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatAmount, formatDate } from '../utils/api';
import TransactionModal from '../components/modals/TransactionModal';

const Transactions = () => {
  const { currentUser } = useAuth();
  const { transactions, currentMonth, setCurrentMonth, deleteTransaction, addTransaction } = useData();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 거래를 삭제하시겠습니까?')) {
      await deleteTransaction(id);
    }
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
                  <small className="text-muted">{formatDate(transaction.date)}</small>
                  {transaction.category_name && (
                    <span 
                      className="badge category-badge ms-2" 
                      style={{ backgroundColor: transaction.category_color }}
                    >
                      {transaction.category_name}
                    </span>
                  )}
                </div>
                <div className="text-end">
                  <div className={`fw-bold ${transaction.type === 'income' ? 'income' : 'expense'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </div>
                  {currentUser && (
                    <div className="btn-group btn-group-sm mt-2">
                      <button 
                        className="btn btn-outline-danger" 
                        onClick={() => handleDelete(transaction.id)}
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

      <TransactionModal 
        show={showTransactionModal}
        onHide={() => setShowTransactionModal(false)}
        onSubmit={addTransaction}
      />
    </div>
  );
};

export default Transactions; 