import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatAmount, formatDate } from '../utils/api';

const RecentTransactions = () => {
  const { transactions } = useData();
  const { currentUser } = useAuth();

  const recentTransactions = transactions.slice(0, 5);

  if (recentTransactions.length === 0) {
    return <p className="text-muted">거래내역이 없습니다.</p>;
  }

  return (
    <div>
      {recentTransactions.map(transaction => (
        <div key={transaction.id} className="d-flex justify-content-between align-items-center mb-2 transaction-item">
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions; 