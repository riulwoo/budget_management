import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall, formatAmount } from '../utils/api';

const AssetManager = () => {
  const { currentUser, authToken } = useAuth();
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 자산 폼 데이터
  const [assetForm, setAssetForm] = useState({
    name: '',
    asset_type_id: '',
    amount: '',
    description: ''
  });

  // 자산 유형 폼 데이터
  const [typeForm, setTypeForm] = useState({
    name: '',
    icon: 'fas fa-wallet',
    color: '#000000',
    description: ''
  });

  // 데이터 로드
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsData, typesData] = await Promise.all([
        apiCall('/assets', { token: authToken }),
        apiCall('/asset-types', { token: authToken })
      ]);
      setAssets(assetsData);
      setAssetTypes(typesData);
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 자산 추가/수정
  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingAsset) {
        await apiCall(`/assets/${editingAsset.id}`, {
          method: 'PUT',
          body: JSON.stringify(assetForm),
          token: authToken
        });
        setSuccess('자산이 성공적으로 수정되었습니다.');
      } else {
        await apiCall('/assets', {
          method: 'POST',
          body: JSON.stringify(assetForm),
          token: authToken
        });
        setSuccess('자산이 성공적으로 추가되었습니다.');
      }
      
      setShowAssetModal(false);
      setEditingAsset(null);
      setAssetForm({ name: '', asset_type_id: '', amount: '', description: '' });
      await loadData();
    } catch (error) {
      setError(error.message || '자산 저장에 실패했습니다.');
    }
  };

  // 자산 삭제
  const handleDeleteAsset = async (id) => {
    if (!window.confirm('정말로 이 자산을 삭제하시겠습니까?')) return;

    try {
      await apiCall(`/assets/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      setSuccess('자산이 성공적으로 삭제되었습니다.');
      await loadData();
    } catch (error) {
      setError('자산 삭제에 실패했습니다.');
    }
  };

  // 자산 유형 추가/수정
  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingType) {
        await apiCall(`/asset-types/${editingType.id}`, {
          method: 'PUT',
          body: JSON.stringify(typeForm),
          token: authToken
        });
        setSuccess('자산 유형이 성공적으로 수정되었습니다.');
      } else {
        await apiCall('/asset-types', {
          method: 'POST',
          body: JSON.stringify(typeForm),
          token: authToken
        });
        setSuccess('자산 유형이 성공적으로 추가되었습니다.');
      }
      
      setShowTypeModal(false);
      setEditingType(null);
      setTypeForm({ name: '', icon: 'fas fa-wallet', color: '#000000', description: '' });
      await loadData();
    } catch (error) {
      setError(error.message || '자산 유형 저장에 실패했습니다.');
    }
  };

  // 자산 유형 삭제
  const handleDeleteType = async (id) => {
    if (!window.confirm('정말로 이 자산 유형을 삭제하시겠습니까?')) return;

    try {
      await apiCall(`/asset-types/${id}`, {
        method: 'DELETE',
        token: authToken
      });
      setSuccess('자산 유형이 성공적으로 삭제되었습니다.');
      await loadData();
    } catch (error) {
      setError(error.message || '자산 유형 삭제에 실패했습니다.');
    }
  };

  // 자산 편집 시작
  const startEditAsset = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      asset_type_id: asset.asset_type_id,
      amount: asset.amount,
      description: asset.description || ''
    });
    setShowAssetModal(true);
  };

  // 자산 유형 편집 시작
  const startEditType = (type) => {
    if (type.is_default) {
      setError('기본 자산 유형은 수정할 수 없습니다.');
      return;
    }
    setEditingType(type);
    setTypeForm({
      name: type.name,
      icon: type.icon,
      color: type.color,
      description: type.description || ''
    });
    setShowTypeModal(true);
  };

  // 새 자산 추가 시작
  const startAddAsset = () => {
    setEditingAsset(null);
    setAssetForm({ name: '', asset_type_id: '', amount: '', description: '' });
    setShowAssetModal(true);
  };

  // 새 자산 유형 추가 시작
  const startAddType = () => {
    setEditingType(null);
    setTypeForm({ name: '', icon: 'fas fa-wallet', color: '#000000', description: '' });
    setShowTypeModal(true);
  };

  // 총 자산 계산
  const totalAssets = assets.reduce((sum, asset) => sum + parseFloat(asset.amount || 0), 0);

  // 자산 유형별 그룹화
  const assetsByType = assets.reduce((groups, asset) => {
    const type = asset.type_name;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(asset);
    return groups;
  }, {});

  if (!currentUser) {
    return (
      <div className="text-center mt-5">
        <h3>로그인이 필요합니다</h3>
        <p>자산 관리를 위해 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>자산 관리</h2>
        <div>
          <button className="btn btn-outline-primary me-2" onClick={startAddType}>
            <i className="fas fa-plus"></i> 자산 유형 추가
          </button>
          <button className="btn btn-primary" onClick={startAddAsset}>
            <i className="fas fa-plus"></i> 자산 추가
          </button>
        </div>
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* 총 자산 카드 */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col">
                  <h5 className="card-title mb-0">총 자산</h5>
                  <h2 className="mb-0">{formatAmount(totalAssets)}</h2>
                </div>
                <div className="col-auto">
                  <i className="fas fa-coins fa-3x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* 자산 목록 */}
          <div className="col-md-8">
            {Object.keys(assetsByType).length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-wallet fa-3x text-muted mb-3"></i>
                  <h5>등록된 자산이 없습니다</h5>
                  <p className="text-muted">자산을 추가하여 관리를 시작하세요.</p>
                  <button className="btn btn-primary" onClick={startAddAsset}>
                    첫 자산 추가하기
                  </button>
                </div>
              </div>
            ) : (
              Object.entries(assetsByType).map(([typeName, typeAssets]) => (
                <div key={typeName} className="card mb-3">
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        <i className={typeAssets[0]?.icon || 'fas fa-wallet'} style={{ color: typeAssets[0]?.color }}></i>
                        {typeName}
                      </h5>
                      <span className="badge bg-secondary">
                        {formatAmount(typeAssets.reduce((sum, asset) => sum + parseFloat(asset.amount), 0))}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {typeAssets.map(asset => (
                        <div key={asset.id} className="col-md-6 mb-3">
                          <div className="border rounded p-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{asset.name}</h6>
                                <p className="h5 text-primary mb-1">{formatAmount(asset.amount)}</p>
                                {asset.description && (
                                  <small className="text-muted">{asset.description}</small>
                                )}
                              </div>
                              <div className="dropdown">
                                <button className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                        data-bs-toggle="dropdown">
                                  <i className="fas fa-ellipsis-v"></i>
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button className="dropdown-item" onClick={() => startEditAsset(asset)}>
                                      <i className="fas fa-edit me-2"></i>수정
                                    </button>
                                  </li>
                                  <li>
                                    <button className="dropdown-item text-danger" onClick={() => handleDeleteAsset(asset.id)}>
                                      <i className="fas fa-trash me-2"></i>삭제
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 자산 유형 관리 */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">자산 유형 관리</h5>
              </div>
              <div className="card-body">
                {assetTypes.map(type => (
                  <div key={type.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div className="d-flex align-items-center">
                      <i className={type.icon} style={{ color: type.color, width: '20px' }}></i>
                      <span className="ms-2">{type.name}</span>
                      {type.is_default && (
                        <span className="badge bg-light text-dark ms-2">기본</span>
                      )}
                    </div>
                    {!type.is_default && (
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={() => startEditType(type)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => handleDeleteType(type.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 자산 추가/수정 모달 */}
      {showAssetModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAsset ? '자산 수정' : '자산 추가'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAssetModal(false)}></button>
              </div>
              <form onSubmit={handleAssetSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">자산 이름</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={assetForm.name}
                      onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">자산 유형</label>
                    <select 
                      className="form-select" 
                      value={assetForm.asset_type_id}
                      onChange={(e) => setAssetForm({ ...assetForm, asset_type_id: e.target.value })}
                      required
                    >
                      <option value="">선택하세요</option>
                      {assetTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">금액</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        className="form-control" 
                        value={assetForm.amount}
                        onChange={(e) => setAssetForm({ ...assetForm, amount: e.target.value })}
                        min="0"
                        step="1"
                        required 
                      />
                      <span className="input-group-text">원</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">설명 (선택사항)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={assetForm.description}
                      onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                      placeholder="자산에 대한 추가 설명을 입력하세요"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssetModal(false)}>
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingAsset ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 자산 유형 추가/수정 모달 */}
      {showTypeModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingType ? '자산 유형 수정' : '자산 유형 추가'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTypeModal(false)}></button>
              </div>
              <form onSubmit={handleTypeSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">유형 이름</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">아이콘</label>
                    <select 
                      className="form-select" 
                      value={typeForm.icon}
                      onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}
                    >
                      <option value="fas fa-wallet">지갑</option>
                      <option value="fas fa-university">은행</option>
                      <option value="fas fa-piggy-bank">저금통</option>
                      <option value="fas fa-chart-line">투자</option>
                      <option value="fas fa-home">부동산</option>
                      <option value="fas fa-car">자동차</option>
                      <option value="fas fa-gem">보석</option>
                      <option value="fas fa-box">기타</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">색상</label>
                    <input 
                      type="color" 
                      className="form-control form-control-color" 
                      value={typeForm.color}
                      onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">설명 (선택사항)</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                      placeholder="자산 유형에 대한 설명을 입력하세요"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTypeModal(false)}>
                    취소
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingType ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManager;