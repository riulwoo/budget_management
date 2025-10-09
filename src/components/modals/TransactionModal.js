import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../utils/api';
import './TransactionModal.css';

// 한국 시간대 기준으로 오늘 날짜 가져오기
const getTodayKST = () => {
  const now = new Date();
  const kstOffset = 9 * 60; // KST는 UTC+9
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (kstOffset * 60000));
  return kst.toISOString().split('T')[0];
};

// 그리드 행 컴포넌트
const GridRow = ({ 
  row, 
  index, 
  assets, 
  categories, 
  onUpdate, 
  onRemove, 
  getMidCategoriesForRow,
  getSubCategoriesForRow,
  getMainCategoriesForType 
}) => {
  const [selectedMain, setSelectedMain] = useState(row.selectedMain || '');
  const [selectedMid, setSelectedMid] = useState(row.selectedMid || '');

  const handleTypeChange = (value) => {
    onUpdate(row.id, 'type', value);
    // 타입 변경 시 카테고리 초기화
    onUpdate(row.id, 'category_id', '');
    onUpdate(row.id, 'selectedMain', '');
    onUpdate(row.id, 'selectedMid', '');
    setSelectedMain('');
    setSelectedMid('');
  };

  const handleMainCategoryChange = (value) => {
    setSelectedMain(value);
    onUpdate(row.id, 'selectedMain', value);
    onUpdate(row.id, 'category_id', value);
    onUpdate(row.id, 'selectedMid', '');
    setSelectedMid('');
  };

  const handleMidCategoryChange = (value) => {
    setSelectedMid(value);
    onUpdate(row.id, 'selectedMid', value);
    onUpdate(row.id, 'category_id', value);
  };

  const handleSubCategoryChange = (value) => {
    onUpdate(row.id, 'category_id', value);
  };

  // row 데이터에서 선택된 카테고리 상태 동기화
  React.useEffect(() => {
    setSelectedMain(row.selectedMain || '');
    setSelectedMid(row.selectedMid || '');
  }, [row.selectedMain, row.selectedMid]);

  const mainCategories = getMainCategoriesForType(row.type);
  const midCategories = getMidCategoriesForRow(selectedMain, row.type);
  const subCategories = getSubCategoriesForRow(selectedMid, row.type);

  return (
    <tr>
      <td>
        <select 
          className="form-select form-select-sm"
          value={row.type}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <option value="">선택</option>
          <option value="income">수입</option>
          <option value="expense">지출</option>
        </select>
      </td>
      <td>
        <input 
          type="number"
          className="form-control form-control-sm"
          value={row.amount}
          onChange={(e) => onUpdate(row.id, 'amount', e.target.value)}
          placeholder="금액"
        />
      </td>
      <td>
        <input 
          type="text"
          className="form-control form-control-sm"
          value={row.description}
          onChange={(e) => onUpdate(row.id, 'description', e.target.value)}
          placeholder="거래 내용"
        />
      </td>
      <td>
        <select 
          className="form-select form-select-sm"
          value={row.asset_id}
          onChange={(e) => onUpdate(row.id, 'asset_id', e.target.value)}
        >
          <option value="">자산 선택</option>
          {assets.map(asset => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="category-select-grid">
          {/* 대분류 선택 */}
          <select 
            className="form-select form-select-sm mb-1"
            value={selectedMain}
            onChange={(e) => handleMainCategoryChange(e.target.value)}
            disabled={!row.type}
          >
            <option value="">대분류 선택</option>
            {mainCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          {/* 중분류 선택 (대분류 선택 시 표시) */}
          {selectedMain && (
            <select 
              className="form-select form-select-sm mb-1"
              value={selectedMid}
              onChange={(e) => handleMidCategoryChange(e.target.value)}
            >
              <option value="">중분류 선택</option>
              {midCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
          
          {/* 소분류 선택 (중분류 선택 시 표시) */}
          {selectedMid && subCategories.length > 0 && (
            <select 
              className="form-select form-select-sm"
              value={subCategories.find(c => c.id == row.category_id)?.id || ''}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
            >
              <option value="">소분류 선택</option>
              {subCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
          
          {/* 선택된 카테고리 표시 */}
          {row.category_id && (
            <div className="selected-category-info">
              <small className="text-primary">
                <i className="fas fa-check-circle me-1"></i>
                {categories.find(c => c.id == row.category_id)?.name}
              </small>
            </div>
          )}
        </div>
      </td>
      <td>
        <input 
          type="date"
          className="form-control form-control-sm"
          value={row.date}
          onChange={(e) => onUpdate(row.id, 'date', e.target.value)}
        />
      </td>
      <td>
        <button 
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => onRemove(row.id)}
        >
          <i className="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  );
};

const TransactionModal = ({ show, onHide, onSubmit, transaction = null, initialDate = null }) => {
  const { categories } = useData();
  const { authToken } = useAuth();
  const [cssLoaded, setCssLoaded] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    type: '',
    date: initialDate || getTodayKST(),
    asset_id: ''
  });
  const [selectedMain, setSelectedMain] = useState('');
  const [selectedMid, setSelectedMid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assets, setAssets] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [transactionList, setTransactionList] = useState([]);
  const [isGridMode, setIsGridMode] = useState(false);

  // CSS 로딩 상태 확인
  useEffect(() => {
    // CSS가 로드되었는지 확인
    const checkCssLoaded = () => {
      const testElement = document.createElement('div');
      testElement.className = 'transaction-modal';
      testElement.style.visibility = 'hidden';
      testElement.style.position = 'absolute';
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      const isLoaded = styles.position === 'fixed' || styles.zIndex === '1050';
      
      document.body.removeChild(testElement);
      setCssLoaded(true); // 일단 항상 true로 설정하여 블로킹 방지
      
      return isLoaded;
    };
    
    // 약간의 지연 후 CSS 확인
    const timer = setTimeout(checkCssLoaded, 100);
    return () => clearTimeout(timer);
  }, []);

  // 자산 목록 로드 - 모달이 열릴 때마다 최신 데이터 로드
  useEffect(() => {
    console.log('TransactionModal useEffect 실행:', { 
      show, 
      authToken: authToken ? `${authToken.substring(0, 20)}...` : 'null',
      hasAuthToken: !!authToken 
    });
    if (show && authToken) {
      console.log('조건 충족: 자산 로딩 시작');
      // 기존 자산 목록 초기화 후 새로 로드
      setAssets([]);
      loadAssets();
    } else {
      console.log('자산 로드 조건 미충족:', { 
        show, 
        hasAuthToken: !!authToken,
        reason: !show ? 'modal not shown' : !authToken ? 'no auth token' : 'unknown'
      });
      // 모달이 닫히면 자산 목록도 초기화
      if (!show) {
        setAssets([]);
      }
    }
  }, [show, authToken]);

  // 모달이 닫힐 때 폼 리셋
  useEffect(() => {
    if (!show && !transaction) {
      resetForm();
    }
  }, [show, transaction]);

  // initialDate가 변경될 때 날짜 업데이트
  useEffect(() => {
    if (initialDate && !transaction) {
      setFormData(prev => ({
        ...prev,
        date: initialDate
      }));
      // 그리드 모드에서도 새 행에 날짜 적용
      if (isGridMode && transactionList.length > 0) {
        setTransactionList(prev => 
          prev.map(row => ({ ...row, date: initialDate }))
        );
      }
    }
  }, [initialDate, transaction, isGridMode]);

  // PC 버전 감지 및 그리드 모드 설정
  useEffect(() => {
    if (show && !transaction) {
      const checkScreenSize = () => {
        const isPC = window.innerWidth >= 768;
        setIsGridMode(isPC);
        if (isPC && transactionList.length === 0) {
          // PC에서 첫 빈 행 추가
          addNewRow();
        } else if (!isPC) {
          // 모바일에서는 그리드 데이터 초기화
          setTransactionList([]);
        }
      };
      
      checkScreenSize();
      
      // 화면 크기 변경 감지
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, [show, transaction]);

  const loadAssets = async () => {
    try {
      console.log('자산 목록 로딩 시작, authToken:', !!authToken);
      
      const assetsData = await apiCall('/assets', { token: authToken });
      console.log('API 응답:', assetsData);
      console.log('API 응답 타입:', typeof assetsData, Array.isArray(assetsData));
      console.log('API 응답 길이:', assetsData?.length);
      
      // API 응답 그대로 사용 (비어있어도 빈 배열로 설정)
      if (!assetsData || !Array.isArray(assetsData)) {
        console.log('API 응답이 올바르지 않음. 빈 배열로 설정.');
        setAssets([]);
      } else {
        console.log('자산 목록 로드 완료:', assetsData);
        setAssets(assetsData);
      }
    } catch (error) {
      console.error('자산 목록 로드 오류:', error);
      console.log('오류로 인해 빈 배열 설정');
      setAssets([]);
    }
  };

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount || '',
        description: transaction.description || '',
        category_id: transaction.category_id || '',
        type: transaction.type || '',
        date: transaction.date || getTodayKST(),
        asset_id: transaction.asset_id || ''
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
        date: getTodayKST(),
        asset_id: ''
      });
      setSelectedMain('');
      setSelectedMid('');
    }
  }, [transaction, show, categories]);

  const handleSubmit = async (e, keepOpen = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 자산 선택 필수 검증
    if (!formData.asset_id) {
      if (assets.length > 0) {
        setError('자산을 선택해주세요.');
      } else {
        setError('거래를 추가하려면 먼저 자산을 등록해야 합니다. 자산 관리 페이지에서 자산을 추가해주세요.');
      }
      setLoading(false);
      return;
    }

    try {
      const result = await onSubmit(formData);
      if (result.success) {
        if (keepOpen) {
          // 계속 추가 모드: 폼만 초기화하고 모달은 열린 상태 유지
          setFormData({
            amount: '',
            description: '',
            category_id: '',
            type: formData.type, // 거래 타입은 유지
            date: getTodayKST(),
            asset_id: formData.asset_id // 자산도 유지
          });
          setSelectedMain('');
          setSelectedMid('');
          setError('');
          // 성공 메시지 표시 (3초 후 자동 삭제)
          setSuccessMessage('거래가 추가되었습니다! 계속 추가할 수 있습니다.');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          // 일반 모드: 모달 닫기
          onHide();
          resetForm();
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('거래 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      type: '',
      date: initialDate || getTodayKST(),
      asset_id: ''
    });
    setSelectedMain('');
    setSelectedMid('');
    setError('');
    setSuccessMessage('');
    setTransactionList([]);
    setIsGridMode(false);
  };

  // 그리드 모드 함수들
  const addNewRow = () => {
    const newRow = {
      id: Date.now() + Math.random(),
      amount: '',
      description: '',
      category_id: '',
      type: '',
      date: initialDate || getTodayKST(),
      asset_id: '',
      selectedMain: '',
      selectedMid: ''
    };
    setTransactionList(prev => [...prev, newRow]);
  };

  const removeRow = (id) => {
    setTransactionList(prev => prev.filter(row => row.id !== id));
  };

  const updateRow = (id, field, value) => {
    setTransactionList(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleGridSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // 유효성 검증
    const validRows = transactionList.filter(row => 
      row.amount && row.description && row.type && row.category_id && row.asset_id
    );

    // 자산이 선택되지 않은 행 확인
    const rowsWithoutAsset = transactionList.filter(row => 
      row.amount && row.description && row.type && row.category_id && !row.asset_id
    );

    if (validRows.length === 0) {
      if (rowsWithoutAsset.length > 0) {
        setError('모든 거래에 자산을 선택해주세요.');
      } else {
        setError('최소 한 건의 완전한 거래를 입력해주세요.');
      }
      setLoading(false);
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of validRows) {
        try {
          const result = await onSubmit({
            amount: row.amount,
            description: row.description,
            category_id: row.category_id,
            type: row.type,
            date: row.date,
            asset_id: row.asset_id
          });
          
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`${successCount}건의 거래가 성공적으로 추가되었습니다.`);
        if (errorCount === 0) {
          setTimeout(() => {
            onHide();
            resetForm();
          }, 2000);
        }
      }
      
      if (errorCount > 0) {
        setError(`${errorCount}건의 거래 추가에 실패했습니다.`);
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

  // 그리드용 카테고리 헬퍼 함수들
  const getMidCategoriesForRow = (mainCategoryId, type) => {
    const filtered = categories.filter(cat => !type || cat.type === type);
    return filtered.filter(category => 
      mainCategoryId && category.parent_id == mainCategoryId
    );
  };

  const getSubCategoriesForRow = (midCategoryId, type) => {
    const filtered = categories.filter(cat => !type || cat.type === type);
    return filtered.filter(category => 
      midCategoryId && category.parent_id == midCategoryId
    );
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id == categoryId);
    return category ? category.name : '';
  };

  const getMainCategoriesForType = (type) => {
    const filtered = categories.filter(cat => !type || cat.type === type);
    return filtered.filter(c => !c.parent_id);
  };

  return (
    <div className={`modal fade transaction-modal ${isGridMode ? 'grid-mode' : ''} ${show ? 'show' : ''}`} 
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
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
              </div>
            )}

            {/* PC 버전: 그리드 모드 */}
            {isGridMode ? (
              <div className="transaction-grid">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">거래 목록</h6>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-primary"
                    onClick={addNewRow}
                  >
                    <i className="fas fa-plus me-1"></i>행 추가
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th width="80">타입</th>
                        <th width="110">금액</th>
                        <th width="180">내용</th>
                        <th width="140">자산</th>
                        <th width="200">카테고리</th>
                        <th width="130">날짜</th>
                        <th width="60">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionList.map((row, index) => (
                        <GridRow 
                          key={row.id}
                          row={row}
                          index={index}
                          assets={assets}
                          categories={categories}
                          onUpdate={updateRow}
                          onRemove={removeRow}
                          getMidCategoriesForRow={getMidCategoriesForRow}
                          getSubCategoriesForRow={getSubCategoriesForRow}
                          getMainCategoriesForType={getMainCategoriesForType}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // 모바일 버전: 기존 폼
              <form onSubmit={handleSubmit}>
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
              
              {/* 자산 선택 */}
              {formData.type && (
                <div className="mb-3">
                  <label className="form-label">
                    자산 <span className="text-danger">*</span>
                  </label>
                  <select 
                    className="form-select" 
                    name="asset_id"
                    value={formData.asset_id}
                    onChange={handleChange}
                    required={assets.length > 0}
                  >
                    <option value="">자산을 선택하세요 (총 {assets.length}개)</option>
                    {assets.length > 0 ? (
                      assets.map((asset, index) => {
                        console.log('Asset 렌더링:', asset);
                        return (
                          <option key={asset.id} value={asset.id}>
                            {asset.type_name} - {asset.name}
                          </option>
                        );
                      })
                    ) : (
                      <option disabled>등록된 자산이 없습니다 (디버그: assets.length = {assets.length})</option>
                    )}
                  </select>
                  {assets.length === 0 && (
                    <div className="alert alert-warning mt-2">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      거래를 추가하려면 먼저 자산을 등록해야 합니다.
                      <br />
                      <a href="/assets" className="btn btn-sm btn-outline-primary mt-2">
                        <i className="fas fa-plus me-1"></i>자산 추가하러 가기
                      </a>
                    </div>
                  )}
                  <small className="form-text text-muted">
                    거래가 발생할 자산을 선택해주세요. {formData.type === 'income' ? '수입 시 자산이 증가됩니다.' : '지출 시 자산이 감소됩니다.'}
                    <br />
                    <strong>현재 로드된 자산 개수: {assets.length}개</strong>
                    {assets.length === 0 && (
                      <div className="text-warning mt-1">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        먼저 <a href="/assets" target="_blank" rel="noopener noreferrer">자산 관리</a>에서 자산을 등록해주세요.
                      </div>
                    )}
                  </small>
                </div>
              )}
              
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
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              취소
            </button>
            
            {isGridMode ? (
              // 그리드 모드: 일괄 저장 버튼
              <>
                <button 
                  type="button" 
                  className="btn btn-outline-primary me-2" 
                  onClick={addNewRow}
                  disabled={loading}
                >
                  <i className="fas fa-plus me-1"></i>행 추가
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleGridSubmit}
                  disabled={loading || transactionList.length === 0}
                >
                  {loading ? '저장 중...' : `${transactionList.length}건 일괄 저장`}
                </button>
              </>
            ) : (
              // 단일 모드: 기존 버튼들
              <>
                {!transaction && (
                  <button 
                    type="button" 
                    className="btn btn-success d-none d-md-inline-block me-2" 
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={loading}
                  >
                    {loading ? '추가 중...' : '추가 후 계속'}
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading}
                >
                  {loading ? '저장 중...' : (transaction ? '수정' : '추가 완료')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal; 