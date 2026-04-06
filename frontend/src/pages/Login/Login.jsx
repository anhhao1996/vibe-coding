/**
 * Login Page
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          setLoading(false);
          return;
        }
        if (formData.password.length < 4) {
          setError('Mật khẩu phải có ít nhất 4 ký tự');
          setLoading(false);
          return;
        }

        const result = await register(
          formData.username,
          formData.password,
          formData.displayName,
          formData.email
        );
        
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      } else {
        const result = await login(formData.username, formData.password);
        
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      email: ''
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <span className="login-brand-icon">🌱</span>
          <div className="login-brand-name">InvestTracker</div>
          <div className="login-brand-tagline">Quản lý danh mục đầu tư cá nhân</div>
        </div>

        <div className="login-card">
          <form className="login-card-body" onSubmit={handleSubmit}>
            <h2 className="login-title">
              {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
            </h2>

            {error && (
              <div className="login-error">
                <span className="login-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="login-field">
              <label className="login-label" htmlFor="username">Tên đăng nhập</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">👤</span>
                <input
                  className="login-input"
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập..."
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {isRegister && (
              <>
                <div className="login-field">
                  <label className="login-label" htmlFor="displayName">Tên hiển thị</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">✏️</span>
                    <input
                      className="login-input"
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      placeholder="Nhập tên hiển thị..."
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="email">Email (tùy chọn)</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">📧</span>
                    <input
                      className="login-input"
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email..."
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="login-field">
              <label className="login-label" htmlFor="password">Mật khẩu</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">🔒</span>
                <input
                  className="login-input"
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu..."
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {isRegister && (
              <div className="login-field">
                <label className="login-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">🔒</span>
                  <input
                    className="login-input"
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu..."
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="login-submit"
              disabled={loading}
            >
              {loading ? '⏳ Đang xử lý...' : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
            </button>
          </form>

          <div className="login-card-footer">
            <p>
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              <button 
                type="button" 
                className="login-toggle"
                onClick={toggleMode}
                disabled={loading}
              >
                {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
