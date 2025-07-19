import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import CategoryModal from '../components/modals/CategoryModal';

const Categories = () => {
  const { currentUser } = useAuth();
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    loading 
  } = useData();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      await deleteCategory(id);
    }
  };

  const handleAddSubmit = async (categoryData) => {
    const result = await addCategory(categoryData);
    if (result.success) {
      setShowAddModal(false);
    }
    return result;
  };

  const handleEditSubmit = async (categoryData) => {
    const result = await updateCategory(editingCategory.id, categoryData);
    if (result.success) {
      setShowEditModal(false);
      setEditingCategory(null);
    }
    return result;
  };

  // 필터링 및 정렬
  const filteredCategories = categories
    .filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !typeFilter || category.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'usage':
          return (b.usage_count || 0) - (a.usage_count || 0);
        default:
          return 0;
      }
    });

  // 통계 계산
  const totalCategories = categories.length;
  const incomeCategories = categories.filter(c => c.type === 'income').length;
  const expenseCategories = categories.filter(c => c.type === 'expense').length;
  const usedCategories = categories.filter(c => (c.usage_count || 0) > 0).length;

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <h3>로그인이 필요합니다</h3>
        <p>카테고리 관리를 위해 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>카테고리 관리</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>카테고리 추가
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div className="row mb-3">
        <div className="col-md-4">
          <input 
            type="text" 
            className="form-control" 
            placeholder="카테고리명 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select 
            className="form-select" 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">모든 타입</option>
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
        </div>
        <div className="col-md-3">
          <select 
            className="form-select" 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">이름순</option>
            <option value="type">타입순</option>
            <option value="usage">사용순</option>
          </select>
        </div>
      </div>

      {/* 카테고리 통계 */}
      <div className="row mb-3">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h6>전체 카테고리</h6>
              <h4>{totalCategories}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h6>수입 카테고리</h6>
              <h4>{incomeCategories}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body text-center">
              <h6>지출 카테고리</h6>
              <h4>{expenseCategories}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h6>사용 중</h6>
              <h4>{usedCategories}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 목록 */}
      <div className="card">
        <div className="card-body">
          {filteredCategories.length === 0 ? (
            <p className="text-muted">검색 결과가 없습니다.</p>
          ) : (
            filteredCategories.map(category => (
              <div key={category.id} className="d-flex justify-content-between align-items-center mb-2 p-3 border rounded category-item">
                <div className="d-flex align-items-center">
                  <span 
                    className="badge category-badge me-2" 
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </span>
                  <div>
                    <small className="text-muted d-block">
                      {category.type === 'income' ? '수입' : '지출'}
                    </small>
                    <small className="text-muted">
                      사용 횟수: {category.usage_count || 0}회
                    </small>
                  </div>
                </div>
                <div className="btn-group btn-group-sm">
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={() => handleEdit(category)}
                    title="수정"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-outline-danger" 
                    onClick={() => handleDelete(category.id)}
                    title="삭제"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 모달들 */}
      <CategoryModal 
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        title="카테고리 추가"
      />
      
      <CategoryModal 
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingCategory(null);
        }}
        onSubmit={handleEditSubmit}
        title="카테고리 수정"
        category={editingCategory}
      />
    </div>
  );
};

export default Categories; 