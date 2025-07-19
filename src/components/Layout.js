import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import LoginModal from './modals/LoginModal';
import RegisterModal from './modals/RegisterModal';
import ProfileModal from './modals/ProfileModal';

const Layout = () => {
  const { currentUser, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <Sidebar 
          currentUser={currentUser}
          onLoginClick={() => setShowLoginModal(true)}
          onRegisterClick={() => setShowRegisterModal(true)}
          onProfileClick={() => setShowProfileModal(true)}
        />
        
        <div className="col-md-9 col-lg-10 main-content p-4">
          <Outlet />
        </div>
      </div>

      {/* 모달들 */}
      <LoginModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
      />
      
      <RegisterModal 
        show={showRegisterModal}
        onHide={() => setShowRegisterModal(false)}
      />
      
      <ProfileModal 
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default Layout; 