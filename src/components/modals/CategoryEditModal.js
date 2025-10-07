import React, { useState, useEffect } from 'react';

const CategoryEditModal = ({ show, onHide, onSubmit, title, category = null, parentOptions = [], level = 'main', activeType = 'expense', showTypeSelection = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: activeType,
    color: '#007bff',
    parent_id: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        type: category.type || activeType,
        color: category.color || '#007bff',
        parent_id: category.parent_id || null
      });
    } else {
      setFormData({
        name: '',
        type: activeType,
        color: '#007bff',
        parent_id: null
      });
    }
  }, [category, show, activeType]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onHide();
      } else {
        setError(result.message || '저장 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} style={{ display: show ? 'block' : 'none' }} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">이름</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">타입</label>
                {showTypeSelection ? (
                  <select className="form-select" name="type" value={formData.type} onChange={handleChange} required>
                    <option value="">선택</option>
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                  </select>
                ) : (
                  <div className="form-control-static" style={{ padding: '0.375rem 0.75rem', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '0.375rem' }}>
                    {activeType === 'income' ? '수입' : '지출'}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">색상</label>
                <input type="color" className="form-control form-control-color" name="color" value={formData.color} onChange={handleChange} />
              </div>
              {level !== 'main' && (
                <div className="mb-3">
                  <label className="form-label">상위 카테고리</label>
                  <select className="form-select" name="parent_id" value={formData.parent_id || ''} onChange={handleChange} required>
                    <option value="">선택</option>
                    {parentOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {error && <div className="alert alert-danger">{error}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>취소</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '저장 중...' : '저장'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditModal;
