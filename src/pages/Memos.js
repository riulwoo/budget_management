import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import useMediaQuery from '../hooks/useMediaQuery';

// 메모 페이지는 DataContext를 사용하지 않고 독립적으로 동작

const Memos = () => {
  console.log('🔄 Memos 컴포넌트 렌더링');
  
  const { currentUser, authToken } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  console.log('Memos 상태:', { 
    hasUser: !!currentUser, 
    hasToken: !!authToken,
    userName: currentUser?.username,
    isMobile 
  });
  
  const loadingRef = useRef(false);

  // 안전한 날짜 포맷팅 함수
  const formatSafeDate = (dateString) => {
    try {
      if (!dateString) return '날짜 없음';
      
      // 여러 날짜 형식을 처리
      let date;
      
      // YYYY-MM-DD 형식 체크
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T00:00:00'); // 로컬 시간대로 설정
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('유효하지 않은 날짜:', dateString);
        return '잘못된 날짜';
      }
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('날짜 포맷팅 오류:', error, dateString);
      return '날짜 오류';
    }
  };
  const lastLoadParamsRef = useRef(null);
  const [memos, setMemos] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [viewMode, setViewMode] = useState(currentUser ? 'my' : 'public'); // 로그인 상태에 따라 초기값 설정
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    visibility: 'private',
    is_completed: false
  });

  // 메모 목록 로드
  const loadMemos = useCallback(async (page = 1, searchTerm = search) => {
    const requestKey = `${viewMode}-${currentUser?.id || 'anonymous'}-${page}-${searchTerm}`;
    
    // 이미 로딩 중이면 중복 요청 방지
    if (loadingRef.current) {
      console.log('⏳ Memos 로딩 중 - 요청 건너뜀');
      return;
    }
    
    // 동일한 파라미터로 이미 요청했으면 중복 방지
    if (lastLoadParamsRef.current === requestKey) {
      console.log('⏭️ 동일한 파라미터로 이미 로드됨:', requestKey);
      return;
    }
    
    try {
      loadingRef.current = true;
      lastLoadParamsRef.current = requestKey;
      setLoading(true);
      
      console.log('🚀 메모 API 호출:', requestKey);
      
      let endpoint;
      let requestOptions = {};
      
      if (viewMode === 'my') {
        if (!currentUser) {
          console.log('사용자가 로그인되지 않음');
          setLoading(false);
          return;
        }
        endpoint = `/memos/my?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`;
        // 현재 토큰 값을 함수 실행 시점에 가져오기
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
          requestOptions.token = currentToken;
        }
      } else {
        endpoint = `/memos/public?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`;
        // public 메모는 토큰 불필요
      }
      
      console.log('메모 로드 요청:', endpoint, requestOptions);
      const response = await apiCall(endpoint, requestOptions);
      
      // 메모 데이터 디버깅 (날짜 + user_id)
      if (response.memos && response.memos.length > 0) {
        console.log('📅 메모 데이터 상세:', response.memos.map(memo => ({
          id: memo.id,
          title: memo.title,
          date: memo.date,
          dateType: typeof memo.date,
          user_id: memo.user_id,
          username: memo.username,
          visibility: memo.visibility,
          hasUserId: !!memo.user_id
        })));
        
        // 공개 메모에서 user_id 누락 확인
        if (viewMode === 'public') {
          const memosWithoutUserId = response.memos.filter(memo => !memo.user_id);
          if (memosWithoutUserId.length > 0) {
            console.warn('⚠️ user_id가 누락된 공개 메모들:', memosWithoutUserId);
          }
        }
      }
      
      setMemos(response.memos || []);
      setPagination(response.pagination || { current: 1, limit: 10, total: 0, pages: 1 });
    } catch (error) {
      console.error('메모 로드 오류:', error);
      console.error('오류 상세:', error.message);
      console.error('오류 스택:', error.stack);
      
      // 오류가 발생해도 빈 데이터로 설정하여 UI는 정상 표시
      setMemos([]);
      setPagination({ current: 1, limit: 10, total: 0, pages: 1 });
      
      // 사용자에게 간단한 알림만 표시 (alert 대신 콘솔 로그)
      console.warn(`메모를 불러오는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const hasInitializedRef = useRef(false);
  const [pageInitialized, setPageInitialized] = useState(false);
  
  useEffect(() => {
    console.log('🔄 Memos useEffect 실행', { 
      viewMode, 
      hasUser: !!currentUser,
      pageInitialized
    });
    
    // 페이지 초기화가 완료되었으면 더 이상 실행하지 않음
    if (pageInitialized) {
      console.log('✅ 메모 페이지 이미 초기화됨 - 스킵');
      return;
    }
    
    if (viewMode === 'my' && !currentUser) {
      console.log('❌ 로그인되지 않은 상태에서 my 모드 - 로딩 안 함');
      return;
    }
    
    console.log('🚀 메모 초기 로딩 시작');
    setPageInitialized(true); // 초기화 완료 표시
    loadMemos(1);
  }, [viewMode, currentUser, pageInitialized]); // currentUser 의존성 제거

  // 검색
  const handleSearch = (e) => {
    e.preventDefault();
    loadMemos(1, search);
  };

  // 페이지 변경
  const handlePageChange = (page) => {
    loadMemos(page);
  };

  // 안전한 날짜 변환 함수
  const formatDateForInput = (dateValue) => {
    try {
      if (!dateValue) return new Date().toISOString().split('T')[0];
      
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('날짜 입력 변환 오류:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // 모달 열기
  const openModal = (memo = null) => {
    if (memo) {
      setEditingMemo(memo);
      setFormData({
        title: memo.title,
        content: memo.content,
        date: formatDateForInput(memo.date),
        priority: memo.priority,
        visibility: memo.visibility,
        is_completed: memo.is_completed
      });
    } else {
      setEditingMemo(null);
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium',
        visibility: 'private',
        is_completed: false
      });
    }
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setEditingMemo(null);
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    console.log('메모 저장 시도:', formData);
    console.log('사용할 토큰:', authToken);
    console.log('현재 사용자:', currentUser);
    console.log('편집 중인 메모:', editingMemo);

    if (!authToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const token = authToken;
      
      let response;
      if (editingMemo) {
        // 수정
        console.log('메모 수정 요청:', { 
          memoId: editingMemo.id, 
          userId: currentUser?.id,
          formData 
        });
        response = await apiCall(`/memos/${editingMemo.id}`, {
          method: 'PUT',
          token: token,
          body: JSON.stringify(formData)
        });
      } else {
        // 생성
        console.log('메모 생성:', formData);
        response = await apiCall('/memos', {
          method: 'POST',
          token: token,
          body: JSON.stringify(formData)
        });
      }
      
      console.log('API 응답:', response);
      closeModal();
      loadMemos(pagination.current);
    } catch (error) {
      console.error('메모 저장 오류:', error);
      console.error('오류 상세:', error.message, error.stack);
      
      // 권한 오류의 경우 더 구체적인 안내
      if (error.message && error.message.includes('권한이 없습니다')) {
        alert('메모를 수정할 권한이 없습니다. 본인이 작성한 메모만 수정할 수 있습니다.');
      } else {
        alert(`메모 저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      }
    }
  };

  // 메모 삭제
  const handleDelete = async (memoId) => {
    if (!window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      return;
    }

    console.log('메모 삭제 요청:', { 
      memoId, 
      userId: currentUser?.id, 
      token: !!authToken 
    });

    try {
      const token = authToken;
      await apiCall(`/memos/${memoId}`, {
        method: 'DELETE',
        token: token
      });
      
      console.log('메모 삭제 성공:', memoId);
      loadMemos(pagination.current);
    } catch (error) {
      console.error('메모 삭제 오류:', error);
      
      if (error.message && error.message.includes('권한이 없습니다')) {
        alert('메모를 삭제할 권한이 없습니다. 본인이 작성한 메모만 삭제할 수 있습니다.');
      } else {
        alert(`메모 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      }
    }
  };

  // 완료 상태 토글
  const toggleComplete = async (memoId) => {
    console.log('완료 상태 토글 요청:', { 
      memoId, 
      userId: currentUser?.id, 
      token: !!authToken 
    });

    try {
      const token = authToken;
      await apiCall(`/memos/${memoId}/toggle`, {
        method: 'PATCH',
        token: token
      });
      
      console.log('완료 상태 토글 성공:', memoId);
      loadMemos(pagination.current);
    } catch (error) {
      console.error('완료 상태 변경 오류:', error);
      
      if (error.message && error.message.includes('권한이 없습니다')) {
        alert('메모를 수정할 권한이 없습니다. 본인이 작성한 메모만 수정할 수 있습니다.');
      } else {
        alert(`완료 상태 변경에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
      }
    }
  };

  // 우선순위 배지 색상
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'badge bg-danger';
      case 'medium': return 'badge bg-warning';
      case 'low': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  };

  // 우선순위 텍스트
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
  };

  // 메모 소유권 확인 (user_id 기반)
  const isMyMemo = (memo) => {
    if (!currentUser || !memo.user_id) return false;
    return String(currentUser.id) === String(memo.user_id);
  };

  // 로그인하지 않은 사용자도 공개 메모는 볼 수 있도록 제거

  return (
    <div className="memos-page">
      {/* 헤더 */}
      <div className="row align-items-center mb-4">
        <div className="col-12 mb-3">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className={`${isMobile ? 'h4' : ''}`}>
                <i className="fas fa-sticky-note me-2"></i>메모 관리
              </h2>
              <p className="text-muted mb-0 small">
                일정과 아이디어를 기록하고 관리하세요
              </p>
            </div>
            
            {/* 모바일: 메모 추가 버튼만 표시 */}
            {isMobile && currentUser && viewMode === 'my' && (
              <button 
                className="btn btn-primary btn-sm rounded-pill px-3" 
                onClick={() => openModal()}
              >
                <i className="fas fa-plus me-1"></i>추가
              </button>
            )}
          </div>
        </div>
        
        {/* 뷰 모드 선택 및 액션 버튼 */}
        <div className="col-12">
          <div className={`d-flex ${isMobile ? 'flex-column gap-3' : 'justify-content-between align-items-center'}`}>
            {/* 뷰 모드 선택 */}
            <div className="btn-group w-100" role="group" style={{ maxWidth: isMobile ? '100%' : '300px' }}>
              {currentUser && (
                <>
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="viewMode" 
                    id="my" 
                    checked={viewMode === 'my'} 
                    onChange={() => {
                      setViewMode('my');
                      setPageInitialized(false);
                    }}
                  />
                  <label className={`btn btn-outline-primary ${isMobile ? 'py-2' : ''}`} htmlFor="my">
                    <i className="fas fa-user me-2"></i>내 메모
                  </label>
                </>
              )}
              
              <input 
                type="radio" 
                className="btn-check" 
                name="viewMode" 
                id="public" 
                checked={viewMode === 'public'} 
                onChange={() => {
                  setViewMode('public');
                  setPageInitialized(false);
                }}
              />
              <label className={`btn btn-outline-primary ${isMobile ? 'py-2' : ''}`} htmlFor="public">
                <i className="fas fa-globe me-2"></i>공개 메모
              </label>
            </div>
            
            {/* 데스크톱: 메모 추가 버튼 */}
            {!isMobile && currentUser && viewMode === 'my' && (
              <button 
                className="btn btn-primary" 
                onClick={() => openModal()}
              >
                <i className="fas fa-plus me-2"></i>메모 추가
              </button>
            )}
          </div>
        </div>
      </div>



      {/* 로그인 안내 */}
      {!currentUser && (
        <div className="alert alert-info mb-4">
          <i className="fas fa-info-circle me-2"></i>
          현재 공개 메모만 보고 계십니다. <strong>로그인</strong>하시면 개인 메모를 작성하고 관리할 수 있습니다.
        </div>
      )}

      {/* 검색 */}
      <div className={`card mb-4 ${isMobile ? 'shadow-sm border-0' : ''}`} 
           style={isMobile ? { borderRadius: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' } : {}}>
        <div className={`card-body ${isMobile ? 'p-3' : ''}`}>
          <form onSubmit={handleSearch} className={isMobile ? 'row g-3 align-items-center' : 'row g-3'}>
            {isMobile ? (
              /* 모바일: 세로 레이아웃 */
              <>
                <div className="col-12">
                  <div className="position-relative">
                    <i className="fas fa-search position-absolute top-50 translate-middle-y text-muted" 
                       style={{ 
                         left: '1rem', 
                         zIndex: 10, 
                         fontSize: '0.9em',
                         pointerEvents: 'none'
                       }}></i>
                    <input
                      type="text"
                      className="form-control border-0 shadow-sm"
                      placeholder="메모 검색..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ 
                        borderRadius: '30px', 
                        fontSize: '0.95em', 
                        paddingLeft: '3rem',
                        paddingRight: '1rem',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    />
                  </div>
                </div>
                <div className="col-12">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{ 
                      fontSize: '0.95em',
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                      border: 'none',
                      fontWeight: '500'
                    }}
                  >
                    <i className="fas fa-search"></i>
                    <span>검색하기</span>
                  </button>
                </div>
              </>
            ) : (
              /* 데스크톱: 가로 레이아웃 */
              <>
                <div className="col-md-10">
                  <div className="position-relative">
                    <i className="fas fa-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="메모 제목이나 내용으로 검색..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 rounded-pill"
                  >
                    <i className="fas fa-search me-1"></i>검색
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* 메모 목록 */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : memos.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-sticky-note fa-3x text-muted mb-3"></i>
              <h5>메모가 없습니다</h5>
              <p className="text-muted">첫 번째 메모를 작성해보세요!</p>
            </div>
          ) : (
            <>
              {/* 모바일: 카드형 레이아웃 */}
              {isMobile ? (
                <div className="row g-3">
                  {memos.map(memo => (
                    <div key={memo.id} className="col-12">
                      <div className={`card shadow-sm ${memo.is_completed ? 'bg-light' : ''}`} 
                           style={{ borderRadius: '15px' }}>
                        <div className="card-body p-3">
                          {/* 헤더 섹션 */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-start flex-grow-1">
                              {(viewMode === 'my' || isMyMemo(memo)) && (
                                <div className="me-2 mt-1">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={memo.is_completed}
                                    onChange={() => toggleComplete(memo.id)}
                                    style={{ transform: 'scale(1.2)' }}
                                  />
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <h6 className={`mb-1 ${memo.is_completed ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                                  {memo.title}
                                </h6>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                  <small className="text-muted">
                                    <i className="fas fa-calendar-alt me-1"></i>
                                    {formatSafeDate(memo.date)}
                                  </small>
                                  {viewMode === 'public' && (
                                    <small className="text-muted">
                                      <i className="fas fa-user me-1"></i>
                                      @{memo.username}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* 우선순위 */}
                            <span className={getPriorityBadgeClass(memo.priority)} style={{ fontSize: '0.75em' }}>
                              {getPriorityText(memo.priority)}
                            </span>
                          </div>
                          
                          {/* 내용 */}
                          {memo.content && (
                            <div className="mb-3">
                              <p className="text-muted small mb-0" style={{ fontSize: '0.9em', lineHeight: '1.4' }}>
                                {memo.content.length > 150 
                                  ? memo.content.substring(0, 150) + '...' 
                                  : memo.content}
                              </p>
                            </div>
                          )}
                          
                          {/* 하단 정보 및 액션 */}
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-2">
                              {memo.is_completed ? (
                                <span className="badge bg-success rounded-pill" style={{ fontSize: '0.7em' }}>
                                  <i className="fas fa-check me-1"></i>완료
                                </span>
                              ) : (
                                <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.7em' }}>
                                  <i className="fas fa-clock me-1"></i>진행중
                                </span>
                              )}
                              
                              {(viewMode === 'my' || isMyMemo(memo)) && (
                                <span className={`badge rounded-pill ${memo.visibility === 'public' ? 'bg-info' : 'bg-secondary'}`}
                                      style={{ fontSize: '0.7em' }}>
                                  <i className={`fas ${memo.visibility === 'public' ? 'fa-globe' : 'fa-lock'} me-1`}></i>
                                  {memo.visibility === 'public' ? '공개' : '비공개'}
                                </span>
                              )}
                            </div>
                            
                            {/* 액션 버튼 */}
                            {(viewMode === 'my' || isMyMemo(memo)) && (
                              <div className="d-flex gap-1">
                                <button
                                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                  onClick={() => openModal(memo)}
                                  style={{ fontSize: '0.8em' }}
                                >
                                  <i className="fas fa-edit me-1"></i>수정
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                  onClick={() => handleDelete(memo.id)}
                                  style={{ fontSize: '0.8em' }}
                                >
                                  <i className="fas fa-trash me-1"></i>삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* 데스크톱: 테이블 레이아웃 */
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        {viewMode === 'public' && <th width="15%">작성자</th>}
                        <th width={viewMode === 'public' ? '30%' : '40%'}>제목</th>
                        <th width="15%">날짜</th>
                        <th width="10%">우선순위</th>
                        <th width="10%">공개설정</th>
                        <th width="10%">상태</th>
                        <th width="15%">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memos.map(memo => (
                        <tr key={memo.id} className={memo.is_completed ? 'table-secondary' : ''}>
                          {viewMode === 'public' && (
                            <td>
                              <small className="text-muted">@{memo.username}</small>
                            </td>
                          )}
                          <td>
                            <div className="d-flex align-items-start">
                              {(viewMode === 'my' || isMyMemo(memo)) && (
                                <div className="me-2 mt-1">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={memo.is_completed}
                                    onChange={() => toggleComplete(memo.id)}
                                  />
                                </div>
                              )}
                              <div className="flex-grow-1">
                                <div className={`fw-bold ${memo.is_completed ? 'text-decoration-line-through text-muted' : ''}`}>
                                  {memo.title}
                                </div>
                                {memo.content && (
                                  <small className="text-muted d-block mt-1">
                                    {memo.content.length > 100 
                                      ? memo.content.substring(0, 100) + '...' 
                                      : memo.content}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <small>{formatSafeDate(memo.date)}</small>
                          </td>
                          <td>
                            <span className={getPriorityBadgeClass(memo.priority)}>
                              {getPriorityText(memo.priority)}
                            </span>
                          </td>
                          <td>
                            {(viewMode === 'my' || isMyMemo(memo)) ? (
                              <span className={`badge ${memo.visibility === 'public' ? 'bg-info' : 'bg-secondary'}`}>
                                <i className={`fas ${memo.visibility === 'public' ? 'fa-globe' : 'fa-lock'} me-1`}></i>
                                {memo.visibility === 'public' ? '공개' : '비공개'}
                              </span>
                            ) : (
                              <span className="badge bg-info">
                                <i className="fas fa-globe me-1"></i>공개
                              </span>
                            )}
                          </td>
                          <td>
                            {memo.is_completed ? (
                              <span className="badge bg-success">
                                <i className="fas fa-check me-1"></i>완료
                              </span>
                            ) : (
                              <span className="badge bg-primary">
                                <i className="fas fa-clock me-1"></i>진행중
                              </span>
                            )}
                          </td>
                          <td>
                            {(viewMode === 'my' || isMyMemo(memo)) ? (
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => openModal(memo)}
                                  title="수정"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(memo.id)}
                                  title="삭제"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            ) : (
                              <div className="text-muted small">
                                <i className="fas fa-user me-1"></i>@{memo.username}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 페이징 */}
              {pagination.pages > 1 && (
                <nav className="mt-4">
                  {isMobile ? (
                    /* 모바일: 간단한 이전/다음 버튼 */
                    <div className="d-flex justify-content-between align-items-center">
                      <button 
                        className="btn btn-outline-primary rounded-pill px-4"
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                        style={{ fontSize: '0.9em' }}
                      >
                        <i className="fas fa-chevron-left me-2"></i>이전
                      </button>
                      
                      <div className="d-flex align-items-center">
                        <span className="small text-muted me-2">페이지</span>
                        <select 
                          className="form-select form-select-sm" 
                          value={pagination.current}
                          onChange={(e) => handlePageChange(parseInt(e.target.value))}
                          style={{ width: 'auto', fontSize: '0.9em' }}
                        >
                          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                            <option key={page} value={page}>
                              {page}
                            </option>
                          ))}
                        </select>
                        <span className="small text-muted ms-2">/ {pagination.pages}</span>
                      </div>
                      
                      <button 
                        className="btn btn-outline-primary rounded-pill px-4"
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current === pagination.pages}
                        style={{ fontSize: '0.9em' }}
                      >
                        다음<i className="fas fa-chevron-right ms-2"></i>
                      </button>
                    </div>
                  ) : (
                    /* 데스크톱: 전체 페이징 */
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${pagination.current === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.current - 1)}
                          disabled={pagination.current === 1}
                        >
                          이전
                        </button>
                      </li>
                      
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${pagination.current === page ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${pagination.current === pagination.pages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(pagination.current + 1)}
                          disabled={pagination.current === pagination.pages}
                        >
                          다음
                        </button>
                      </li>
                    </ul>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* 메모 작성/수정 모달 */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className={`modal-dialog ${isMobile ? 'modal-fullscreen-sm-down' : 'modal-lg'}`}>
            <div className="modal-content" style={isMobile ? { borderRadius: '0' } : { borderRadius: '15px' }}>
              <div className={`modal-header ${isMobile ? 'pb-2' : ''}`}>
                <h5 className={`modal-title ${isMobile ? 'h6' : ''}`}>
                  <i className={`fas ${editingMemo ? 'fa-edit' : 'fa-plus'} me-2`}></i>
                  {editingMemo ? '메모 수정' : '메모 추가'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={`modal-body ${isMobile ? 'p-3' : ''}`}>
                  <div className={isMobile ? 'row g-2' : 'row g-3'}>
                    <div className="col-12">
                      <label className={`form-label ${isMobile ? 'small fw-semibold' : ''}`}>
                        <i className="fas fa-heading me-1"></i>제목 *
                      </label>
                      <input
                        type="text"
                        className={`form-control ${isMobile ? '' : ''}`}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="메모 제목을 입력하세요..."
                        required
                        style={isMobile ? { borderRadius: '10px' } : {}}
                      />
                    </div>
                    
                    <div className={isMobile ? 'col-6' : 'col-md-4'}>
                      <label className={`form-label ${isMobile ? 'small fw-semibold' : ''}`}>
                        <i className="fas fa-calendar me-1"></i>날짜
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        style={isMobile ? { borderRadius: '10px', fontSize: '0.9em' } : {}}
                      />
                    </div>
                    
                    <div className={isMobile ? 'col-6' : 'col-md-4'}>
                      <label className={`form-label ${isMobile ? 'small fw-semibold' : ''}`}>
                        <i className="fas fa-flag me-1"></i>우선순위
                      </label>
                      <select
                        className="form-select"
                        value={formData.priority}
                        style={isMobile ? { borderRadius: '10px', fontSize: '0.9em' } : {}}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                      </select>
                    </div>
                    
                    <div className={isMobile ? 'col-6' : 'col-md-4'}>
                      <label className={`form-label ${isMobile ? 'small fw-semibold' : ''}`}>
                        <i className="fas fa-eye me-1"></i>공개 설정
                      </label>
                      <select
                        className="form-select"
                        value={formData.visibility}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        style={isMobile ? { borderRadius: '10px', fontSize: '0.9em' } : {}}
                      >
                        <option value="private">🔒 비공개</option>
                        <option value="public">🌐 공개</option>
                      </select>
                    </div>
                    
                    {!isMobile && (
                      <div className="col-md-4">
                        <label className="form-label">상태</label>
                        <div className="form-check mt-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isCompleted"
                            checked={formData.is_completed}
                            onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
                          />
                          <label className="form-check-label" htmlFor="isCompleted">
                            완료됨
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* 모바일: 완료 상태를 다른 위치에 배치 */}
                    {isMobile && (
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isCompletedMobile"
                            checked={formData.is_completed}
                            onChange={(e) => setFormData({ ...formData, is_completed: e.target.checked })}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <label className={`form-check-label ${isMobile ? 'small fw-semibold' : ''}`} htmlFor="isCompletedMobile">
                            <i className="fas fa-check-circle me-1"></i>완료된 메모로 표시
                          </label>
                        </div>
                      </div>
                    )}
                    
                    <div className="col-12">
                      <label className={`form-label ${isMobile ? 'small fw-semibold' : ''}`}>
                        <i className="fas fa-align-left me-1"></i>내용
                      </label>
                      <textarea
                        className="form-control"
                        style={isMobile ? { borderRadius: '10px', fontSize: '0.9em' } : {}}
                        rows={isMobile ? "4" : "6"}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="메모 내용을 입력하세요..."
                      />
                    </div>
                  </div>
                </div>
                <div className={`modal-footer ${isMobile ? 'p-3 gap-2' : ''}`}>
                  {isMobile ? (
                    /* 모바일: 세로 배치 */
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary rounded-pill py-2">
                        <i className={`fas ${editingMemo ? 'fa-save' : 'fa-plus'} me-2`}></i>
                        {editingMemo ? '수정 완료' : '메모 추가'}
                      </button>
                      <button type="button" className="btn btn-outline-secondary rounded-pill py-2" onClick={closeModal}>
                        <i className="fas fa-times me-2"></i>취소
                      </button>
                    </div>
                  ) : (
                    /* 데스크톱: 가로 배치 */
                    <>
                      <button type="button" className="btn btn-secondary" onClick={closeModal}>
                        취소
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {editingMemo ? '수정' : '추가'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memos;