import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { currentUser, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: ''
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/api/user/profile', {
        username: formData.username,
        email: formData.email
      });
      if (res.data.success) {
        setSuccess('프로필이 성공적으로 수정되었습니다.');
        refreshUser();
      } else {
        setError(res.data.message || '수정 실패');
      }
    } catch (err) {
      setError('서버 오류');
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
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
    try {
      const res = await api.put('/api/user/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      if (res.data.success) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setFormData({ ...formData, currentPassword: '', newPassword: '', newPasswordConfirm: '' });
      } else {
        setError(res.data.message || '비밀번호 변경 실패');
      }
    } catch (err) {
      setError('서버 오류');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h2>개인정보 수정</h2>
      <form onSubmit={handleProfileUpdate} className="mb-4">
        {error && (
          <div className="alert alert-danger" role="alert">{error}</div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">{success}</div>
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
          <label className="form-label">이메일</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '저장 중...' : '프로필 저장'}
        </button>
      </form>
      <hr />
      <h4>비밀번호 변경</h4>
      <form onSubmit={handlePasswordChange}>
        <div className="mb-3">
          <label className="form-label">현재 비밀번호</label>
          <input
            type="password"
            className="form-control"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
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
            required
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
            required
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
