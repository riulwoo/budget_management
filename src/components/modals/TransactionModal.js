import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

const TransactionModal = ({ show, onHide, onSubmit, transaction = null }) => {
  const { categories } = useData();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount || '',
        description: transaction.description || '',
        category_id: transaction.category_id || '',
        type: transaction.type || '',
        date: transaction.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        type: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [transaction, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onHide();
        setFormData({
          amount: '',
          description: '',
          category_id: '',
          type: '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('거래 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const filteredCategories = categories.filter(cat => 
    !formData.type || cat.type === formData.type
  );

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} 
         style={{ display: show ? 'block' : 'none' }}
         tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {transaction ? '거래 수정' : '거래 추가'}
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">타입</label>
                <select 
                  className="form-select" 
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="income">수입</option>
                  <option value="expense">지출</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">금액</label>
                <input 
                  type="number" 
                  className="form-control" 
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="form-label">설명</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">카테고리</label>
                <select 
                  className="form-select" 
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">선택하세요</option>
                  {filteredCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">날짜</label>
                <input 
                  type="date" 
                  className="form-control" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required 
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              취소
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '저장 중...' : (transaction ? '수정' : '추가')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal; 