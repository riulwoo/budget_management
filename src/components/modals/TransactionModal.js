import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import './TransactionModal.css';

// 한국 시간대 기준으로 오늘 날짜 가져오기
const getTodayKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (kstOffset * 60000));
  return kst.toISOString().split('T')[0];
};

const TransactionModal = ({ show, onHide, onSubmit, transaction = null }) => {
  const { categories } = useData();
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: '',
    date: getTodayKST()
  });
  const [selectedMain, setSelectedMain] = useState('');
  const [selectedMid, setSelectedMid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount || '',
        description: transaction.description || '',
        category_id: transaction.category_id || '',
        type: transaction.type || '',
        date: transaction.date || getTodayKST()
      });
      
      // 기존 거래의 카테고리 계층 구조 설정
      if (transaction.category_id) {
        const selectedCategory = categories.find(c => c.id == transaction.category_id);
        if (selectedCategory) {
          if (selectedCategory.parent_id) {
            // 중분류 또는 소분류인 경우
            const parentCategory = categories.find(c => c.id == selectedCategory.parent_id);
            if (parentCategory && parentCategory.parent_id) {
              // 소분류인 경우
              const grandParent = categories.find(c => c.id == parentCategory.parent_id);
              setSelectedMain(grandParent?.id || '');
              setSelectedMid(parentCategory.id);
            } else {
              // 중분류인 경우
              setSelectedMain(parentCategory?.id || '');
              setSelectedMid('');
            }
          } else {
            // 대분류인 경우
            setSelectedMain('');
            setSelectedMid('');
          }
        }
      }
    } else {
      setFormData({
        amount: '',
        description: '',
        category_id: '',
        type: '',
        date: getTodayKST()
      });
      setSelectedMain('');
      setSelectedMid('');
    }
  }, [transaction, show, categories]);

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
          date: getTodayKST()
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
    const { name, value } = e.target;
    
    if (name === 'type') {
      // 타입이 변경되면 카테고리 선택 초기화
      setSelectedMain('');
      setSelectedMid('');
      setFormData({
        ...formData,
        [name]: value,
        category_id: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleMainCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedMain(value);
    setSelectedMid('');
    setFormData({
      ...formData,
      category_id: value // 대분류를 선택한 경우 해당 ID를 설정
    });
  };

  const handleMidCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedMid(value);
    setFormData({
      ...formData,
      category_id: value // 중분류를 선택한 경우 해당 ID를 설정
    });
  };

  const handleSubCategoryChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      category_id: value // 소분류를 선택한 경우 해당 ID를 설정
    });
  };

  // 카테고리 필터링
  const typeFilteredCategories = categories.filter(cat => 
    !formData.type || cat.type === formData.type
  );
  
  const mainCategories = typeFilteredCategories.filter(c => !c.parent_id);
  const midCategories = selectedMain ? typeFilteredCategories.filter(c => c.parent_id == selectedMain) : [];
  const subCategories = selectedMid ? typeFilteredCategories.filter(c => c.parent_id == selectedMid) : [];

  return (
    <div className={`modal fade transaction-modal ${show ? 'show' : ''}`} 
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
              {/* 카테고리 선택 */}
              {formData.type && (
                <div className="mb-3">
                  <label className="form-label">카테고리</label>
                  
                  <div className="category-selection">
                    {/* 진행 표시 */}
                    <div className="category-progress">
                      <span className={`step ${selectedMain ? 'active' : ''}`}>대분류</span>
                      <span className="arrow">→</span>
                      <span className={`step ${selectedMid ? 'active' : ''}`}>중분류</span>
                      <span className="arrow">→</span>
                      <span className={`step ${selectedMid && subCategories.length > 0 && formData.category_id && subCategories.find(c => c.id == formData.category_id) ? 'active' : ''}`}>소분류</span>
                    </div>
                    
                    {/* 대분류 선택 */}
                    <div className="category-step">
                      <label>1. 대분류 선택</label>
                      <select 
                        className="form-select" 
                        value={selectedMain}
                        onChange={handleMainCategoryChange}
                        disabled={!formData.type}
                      >
                        <option value="">대분류를 선택하세요</option>
                        {mainCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* 중분류 선택 */}
                    {selectedMain && midCategories.length > 0 && (
                      <div className="category-step">
                        <label>2. 중분류 선택 (선택사항)</label>
                        <select 
                          className="form-select" 
                          value={selectedMid}
                          onChange={handleMidCategoryChange}
                        >
                          <option value="">중분류를 선택하세요</option>
                          {midCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* 소분류 선택 */}
                    {selectedMid && subCategories.length > 0 && (
                      <div className="category-step">
                        <label>3. 소분류 선택 (선택사항)</label>
                        <select 
                          className="form-select" 
                          value={subCategories.find(c => c.id == formData.category_id)?.id || ''}
                          onChange={handleSubCategoryChange}
                        >
                          <option value="">소분류를 선택하세요</option>
                          {subCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* 선택된 카테고리 표시 */}
                    {formData.category_id && (
                      <div className="selected-category">
                        <i className="fas fa-check-circle me-2"></i>
                        선택된 카테고리: {categories.find(c => c.id == formData.category_id)?.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
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