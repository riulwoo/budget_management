import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentUser, onLoginClick, onRegisterClick, onProfileClick }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* 모바일 탑바 */}
      <nav className="mobile-topbar d-md-none">
        <div className="d-flex justify-content-between align-items-center p-3">
          <h5 className="mb-0 text-white">
            <i className="fas fa-wallet me-2"></i>가계부
          </h5>
          <button 
            className="btn btn-outline-light hamburger-btn"
            onClick={toggleMenu}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </nav>

      {/* 모바일 오버레이 */}
      {isMenuOpen && (
        <div 
          className="mobile-overlay d-md-none"
          onClick={closeMenu}
        ></div>
      )}

      {/* 사이드바 (데스크톱) / 모바일 메뉴 */}
      <div className={`sidebar ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
        <div className="sidebar-content p-4 text-white">
          {/* 데스크톱에서만 보이는 헤더 */}
          <h4 className="mb-4 d-none d-md-block">
            <i className="fas fa-wallet me-2"></i>가계부
          </h4>
          
          {/* 사용자 정보 */}
          {currentUser ? (
            <div className="user-info mb-3">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-user me-2"></i>
                <span>{currentUser.username}</span>
              </div>
              <button 
                className="btn btn-sm btn-outline-light w-100 mb-2" 
                onClick={() => {
                  onProfileClick();
                  closeMenu();
                }}
              >
                <i className="fas fa-user-cog me-2"></i>프로필
              </button>
              <button 
                className="btn btn-sm btn-outline-light w-100" 
                onClick={() => {
                  logout();
                  closeMenu();
                }}
              >
                <i className="fas fa-sign-out-alt me-2"></i>로그아웃
              </button>
            </div>
          ) : (
            <div className="auth-buttons mb-3">
              <button 
                className="btn btn-outline-light w-100 mb-2" 
                onClick={() => {
                  onLoginClick();
                  closeMenu();
                }}
              >
                <i className="fas fa-sign-in-alt me-2"></i>로그인
              </button>
              <button 
                className="btn btn-outline-light w-100" 
                onClick={() => {
                  onRegisterClick();
                  closeMenu();
                }}
              >
                <i className="fas fa-user-plus me-2"></i>회원가입
              </button>
            </div>
          )}
          
          <nav className="nav flex-column">
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/') ? 'active' : ''}`}
              to="/"
              onClick={closeMenu}
            >
              <i className="fas fa-tachometer-alt me-2"></i>대시보드
            </Link>
            
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/calendar') ? 'active' : ''}`}
              to="/calendar"
              onClick={closeMenu}
            >
              <i className="fas fa-calendar-alt me-2"></i>달력
            </Link>
            
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/transactions') ? 'active' : ''}`}
              to="/transactions"
              onClick={closeMenu}
            >
              <i className="fas fa-list me-2"></i>거래내역
            </Link>
            
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/categories') ? 'active' : ''}`}
              to="/categories"
              onClick={closeMenu}
            >
              <i className="fas fa-tags me-2"></i>카테고리
            </Link>
            
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/memos') ? 'active' : ''}`}
              to="/memos"
              onClick={closeMenu}
            >
              <i className="fas fa-sticky-note me-2"></i>메모
            </Link>
            
            <Link 
              className={`nav-link text-white mb-2 ${isActive('/statistics') ? 'active' : ''}`}
              to="/statistics"
              onClick={closeMenu}
            >
              <i className="fas fa-chart-pie me-2"></i>통계
            </Link>
            
            {currentUser && (
              <>
                <Link 
                  className={`nav-link text-white mb-2 ${isActive('/assets') ? 'active' : ''}`}
                  to="/assets"
                  onClick={closeMenu}
                >
                  <i className="fas fa-coins me-2"></i>자산 관리
                </Link>
                
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;``