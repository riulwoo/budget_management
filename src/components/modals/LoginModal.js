import React, { useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const LoginModal = ({ show, onHide }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFindPw, setShowFindPw] = useState(false);
  const [findPwEmail, setFindPwEmail] = useState('');
  const [findPwMsg, setFindPwMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      onHide();
      setFormData({ username: '', password: '' });
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={`modal fade ${show ? 'show' : ''}`}
         style={{ display: show ? 'block' : 'none' }}
         tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">로그인</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {!showFindPw ? (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">사용자명</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">비밀번호</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-link p-0" onClick={() => setShowFindPw(true)}>
                    비밀번호 찾기
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setFindPwMsg('');
                try {
                  const res = await api.post('/auth/reset-password', { email: findPwEmail });
                  if (res.data.success) {
                    setFindPwMsg(
                      res.data.tempPassword
                        ? `임시 비밀번호: ${res.data.tempPassword} (로그인 후 반드시 변경하세요)`
                        : '비밀번호가 재설정되었습니다.'
                    );
                  } else {
                    setFindPwMsg(res.data.message || '비밀번호 재설정 실패');
                  }
                } catch {
                  setFindPwMsg('서버 오류');
                }
              }}>
                <div className="mb-3">
                  <label className="form-label">이메일</label>
                  <input
                    type="email"
                    className="form-control"
                    value={findPwEmail}
                    onChange={e => setFindPwEmail(e.target.value)}
                    required
                  />
                </div>
                {findPwMsg && (
                  <div className="alert alert-info" role="alert">{findPwMsg}</div>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <button type="button" className="btn btn-link p-0" onClick={() => setShowFindPw(false)}>
                    로그인 화면으로
                  </button>
                  <button type="submit" className="btn btn-primary">메일 발송</button>
                </div>
              </form>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              취소
            </button>
            {!showFindPw && (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 