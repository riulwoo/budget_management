import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ProfileModal = ({ show, onHide }) => {
  const { currentUser, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    const result = await changePassword(formData.currentPassword, formData.newPassword);
    
    if (result.success) {
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setFormData({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
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
            <h5 className="modal-title">프로필</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">사용자명</label>
              <input 
                type="text" 
                className="form-control" 
                value={currentUser?.username || ''} 
                readOnly 
              />
            </div>
            <div className="mb-3">
              <label className="form-label">이메일</label>
              <input 
                type="email" 
                className="form-control" 
                value={currentUser?.email || ''} 
                readOnly 
              />
            </div>
            <hr />
            <h6>비밀번호 변경</h6>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">현재 비밀번호</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">새 비밀번호</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">새 비밀번호 확인</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="newPasswordConfirm"
                  value={formData.newPasswordConfirm}
                  onChange={handleChange}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              닫기
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal; 