import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './AuthForms.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [showLogin, setShowLogin] = useState(true);
  
  if (!isOpen) return null;
  
  const toggleForm = () => {
    setShowLogin(!showLogin);
  };
  
  const handleAuthSuccess = () => {
    onClose();
  };
  
  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        {showLogin ? (
          <LoginForm 
            toggleForm={toggleForm} 
            onAuthSuccess={handleAuthSuccess} 
          />
        ) : (
          <RegisterForm 
            toggleForm={toggleForm} 
            onAuthSuccess={handleAuthSuccess} 
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;