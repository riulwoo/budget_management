import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import CategoryManager from '../components/CategoryManager';
import CategoryEditModal from '../components/modals/CategoryEditModal';
import '../styles/Categories.css';

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useData();
  const [showModal, setShowModal] = useState(false);
  const [modalLevel, setModalLevel] = useState('main'); // main, mid, sub
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentOptions, setParentOptions] = useState([]);
  const [parentId, setParentId] = useState(null); // 선택된 부모 카테고리 ID (null이면 중분류/소분류 숨김)
  const [modalParentId, setModalParentId] = useState(null); // 모달에서 사용할 기본 parent_id
  const [activeTab, setActiveTab] = useState('all'); // all, income, expense

  // 현재 탭에 따른 카테고리 필터링
  const filteredCategories = activeTab === 'all' ? categories : categories.filter(c => c.type === activeTab);
  
  // 3단 분류용 필터 (탭별로)
  const mainCategories = filteredCategories.filter(c => !c.parent_id); // 대분류 (parent_id가 없는 카테고리)
  const midCategories = filteredCategories.filter(c => c.parent_id === parentId && mainCategories.some(m => m.id === c.parent_id)); // 선택된 대분류의 중분류
  const subCategories = filteredCategories.filter(c => midCategories.some(m => m.id === c.parent_id)); // 선택된 중분류의 소분류

  // 모달 열기
  const openModal = (level, mode, category = null, parentOptions = [], defaultParentId = null) => {
    setModalLevel(level);
    setModalMode(mode);
    setEditingCategory(category);
    setParentOptions(parentOptions);
    setModalParentId(defaultParentId); // 모달에서 사용할 기본 parent_id
    setShowModal(true);
  };

  // 추가/수정 핸들러
  const handleAdd = (level, parent = null) => {
    console.log('handleAdd 호출:', { level, parent });
    let options = [];
    if (level === 'mid') {
      options = mainCategories;
    } else if (level === 'sub') {
      // 소분류 추가 시, 현재 선택된 대분류의 모든 중분류를 옵션으로 제공
      // parent가 중분류인 경우, 그 중분류가 속한 대분류의 모든 중분류를 찾음
      if (parent && parent.parent_id) {
        // parent가 중분류인 경우 (parent.parent_id가 있음)
        options = filteredCategories.filter(c => c.parent_id === parent.parent_id);
      } else {
        // 현재 표시되는 중분류들을 사용
        options = midCategories;
      }
    }
    console.log('openModal 호출:', { level, options, parentId: parent ? parent.id : null });
    openModal(level, 'add', null, options, parent ? parent.id : null);
  };
  const handleEdit = (level, category, parentOptions = []) => {
    openModal(level, 'edit', category, parentOptions, category.parent_id);
  };
  const handleDelete = async (category) => {
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      await deleteCategory(category.id);
    }
  };

  // 모달 제출
  const handleModalSubmit = async (formData) => {
    // activeTab이 'all'일 때는 formData의 type을 그대로 사용
    const finalType = activeTab === 'all' ? formData.type : activeTab;
    const dataWithType = { ...formData, type: finalType, parent_id: formData.parent_id || null };
    
    if (modalMode === 'add') {
      const result = await addCategory(dataWithType);
      if (result.success) setShowModal(false);
      return result;
    } else if (modalMode === 'edit') {
      const result = await updateCategory(editingCategory.id, dataWithType);
      if (result.success) setShowModal(false);
      return result;
    }
  };

  return (
    <div className="categories-page">
      {/* 페이지 헤더 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">카테고리 관리</h1>
            <p className="page-subtitle">수입과 지출을 체계적으로 분류해보세요</p>
          </div>
          <div className="header-stats">
            <div 
              className={`stat-card clickable ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                setParentId(null);
              }}
            >
              <div className="stat-icon">
                <i className="fas fa-list"></i>
              </div>
              <div className="stat-number">{categories.length}</div>
              <div className="stat-label">전체</div>
            </div>
            <div 
              className={`stat-card clickable ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('income');
                setParentId(null);
              }}
            >
              <div className="stat-icon">
                <i className="fas fa-arrow-up"></i>
              </div>
              <div className="stat-number">{categories.filter(c => c.type === 'income').length}</div>
              <div className="stat-label">수입</div>
            </div>
            <div 
              className={`stat-card clickable ${activeTab === 'expense' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('expense');
                setParentId(null);
              }}
            >
              <div className="stat-icon">
                <i className="fas fa-arrow-down"></i>
              </div>
              <div className="stat-number">{categories.filter(c => c.type === 'expense').length}</div>
              <div className="stat-label">지출</div>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="instruction-banner">
        <div className="instruction-content">
          <div className="instruction-icon">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div className="instruction-text">
            <strong>사용법:</strong> 우측 상단의 전체/수입/지출 카드를 클릭하여 카테고리를 필터링하세요. 
            대분류를 선택하면 중분류가 나타나고, 중분류를 선택하면 소분류가 나타납니다. 각 단계에서 카테고리를 추가, 수정, 삭제할 수 있습니다.
          </div>
        </div>
      </div>



      {/* 카테고리 매니저 */}
      <CategoryManager
        categories={filteredCategories}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />
      
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>처리 중...</span>
          </div>
        </div>
      )}

      <CategoryEditModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        title={modalMode === 'add' ? '카테고리 추가' : '카테고리 수정'}
        category={editingCategory}
        parentOptions={parentOptions}
        level={modalLevel}
        activeType={activeTab === 'all' ? 'expense' : activeTab}
        showTypeSelection={activeTab === 'all'}
        defaultParentId={modalParentId}
      />
    </div>
  );
};

export default Categories;