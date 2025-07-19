import React, { useState, useEffect } from 'react';
import { getTextColor } from '../../utils/api';

const CategoryModal = ({ show, onHide, onSubmit, title, category = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    color: '#007bff'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        type: category.type || '',
        color: category.color || '#007bff'
      });
    } else {
      setFormData({
        name: '',
        type: '',
        color: '#007bff'
      });
    }
  }, [category, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onHide();
      } else {
        setError(result.message || '카테고리 저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setError('카테고리 저장 중 오류가 발생했습니다.');
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

  const textColor = getTextColor(formData.color);

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} 
         style={{ display: show ? 'block' : 'none' }}
         tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
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
                <label className="form-label">카테고리명</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              </div>
              
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
                <label className="form-label">색상</label>
                <div className="d-flex gap-2 align-items-center">
                  <input 
                    type="color" 
                    className="form-control" 
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    style={{ width: '60px' }}
                  />
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: formData.color, 
                      color: textColor 
                    }}
                  >
                    미리보기
                  </span>
                </div>
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
              {loading ? '저장 중...' : (category ? '수정' : '추가')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal; 