import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentUser, onLoginClick, onRegisterClick, onProfileClick }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="col-md-3 col-lg-2 sidebar p-0">
      <div className="p-4 text-white">
        <h4 className="mb-4">
          <i className="fas fa-wallet me-2"></i>가계부
        </h4>
        
        {/* 사용자 정보 */}
        {currentUser ? (
          <div className="user-info">
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-user me-2"></i>
              <span>{currentUser.username}</span>
            </div>
            <button 
              className="btn btn-sm btn-outline-light w-100 mb-2" 
              onClick={onProfileClick}
            >
              <i className="fas fa-user-cog me-2"></i>프로필
            </button>
            <button 
              className="btn btn-sm btn-outline-light w-100" 
              onClick={logout}
            >
              <i className="fas fa-sign-out-alt me-2"></i>로그아웃
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button 
              className="btn btn-outline-light w-100 mb-2" 
              onClick={onLoginClick}
            >
              <i className="fas fa-sign-in-alt me-2"></i>로그인
            </button>
            <button 
              className="btn btn-outline-light w-100" 
              onClick={onRegisterClick}
            >
              <i className="fas fa-user-plus me-2"></i>회원가입
            </button>
          </div>
        )}
        
        <nav className="nav flex-column">
          <Link 
            className={`nav-link text-white mb-2 ${isActive('/') ? 'active' : ''}`}
            to="/"
          >
            <i className="fas fa-tachometer-alt me-2"></i>대시보드
          </Link>
          
          <Link 
            className={`nav-link text-white mb-2 ${isActive('/calendar') ? 'active' : ''}`}
            to="/calendar"
          >
            <i className="fas fa-calendar-alt me-2"></i>달력
          </Link>
          
          <Link 
            className={`nav-link text-white mb-2 ${isActive('/transactions') ? 'active' : ''}`}
            to="/transactions"
          >
            <i className="fas fa-list me-2"></i>거래내역
          </Link>
          
          <Link 
            className={`nav-link text-white mb-2 ${isActive('/categories') ? 'active' : ''}`}
            to="/categories"
          >
            <i className="fas fa-tags me-2"></i>카테고리
          </Link>
          
          <Link 
            className={`nav-link text-white mb-2 ${isActive('/statistics') ? 'active' : ''}`}
            to="/statistics"
          >
            <i className="fas fa-chart-pie me-2"></i>통계
          </Link>
          
          {currentUser && (
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/balance-settings') ? 'active' : ''}`}
              to="/balance-settings"
            >
              <i className="fas fa-wallet me-2"></i>자본금 설정
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 