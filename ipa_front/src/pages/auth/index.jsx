import React, { useState, useEffect } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, USER_ROLES, PERMISSION_STATUS } from './components/AuthContext';

const AuthForm = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, userRole, permissionStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Google 로그인 함수
  const handleGoogleAuth = () => {
    console.log('Google 로그인 시도');
    // 실제 구현에서는 Google OAuth API를 호출해야 합니다
    // 예: window.location.href = '구글_OAuth_URL';
  };
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  
  // 이미 로그인한 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      // 권한이 수락된 사용자는 메인 페이지로 리다이렉트
      if (userRole === USER_ROLES.USER || userRole === USER_ROLES.ADMIN || 
          permissionStatus === PERMISSION_STATUS.APPROVED) {
        console.log('권한이 수락된 사용자: 메인 페이지로 리다이렉트');
        navigate('/', { replace: true });
      } else {
        // 권한이 수락되지 않은 사용자는 설정 페이지로 리다이렉트
        console.log('권한이 수락되지 않은 사용자: 설정 페이지로 리다이렉트');
        navigate('/settings', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, permissionStatus, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 입력이 있으면 해당 필드의 에러 메시지 제거
    if (value.length > 0) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
      isValid = false;
    }

    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = '사용자명을 입력해주세요';
        isValid = false;
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // 로그인 처리
        await login(formData.email, formData.password);
        // 로그인 성공 시 리다이렉트는 useEffect에서 처리
      } else {
        // 회원가입 처리
        await register({
          email: formData.email,
          password: formData.password,
          username: formData.username
          // profile_image 필드 제거 - 백엔드에서 기본 이미지 사용
        });
        
        // 회원가입 성공 시 로그인 폼으로 전환
        setIsLogin(true);
        setFormData({
          email: formData.email,
          password: '',
          confirmPassword: '',
          username: '',
        });
        setAuthError('회원가입이 완료되었습니다. 로그인해주세요.');
      }
    } catch (error) {
      console.error('인증 오류:', error);
      setAuthError(error.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
    });
    setAuthError('');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="w-full max-w-md p-8 space-y-8 bg-base-100 rounded-lg shadow-md relative">
        <div className="absolute top-4 right-4">
          <label className="swap swap-rotate">
            <input
              type="checkbox"
              checked={theme === 'dark'}
              onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <svg className="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
            <svg className="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
          </label>
        </div>
        
        <div className="text-center">
          <span className="text-7xl font-racing text-primary">IPA</span>
          <h1 className="text-2xl font-bold mt-2">
            {isLogin ? '로그인' : '회원가입'}
          </h1>
          <p className="mt-2 text-sm text-base-content/70">
            {isLogin ? '계정에 로그인하세요' : '새 계정을 만드세요'}
          </p>
        </div>
        
        {authError && (
          <div className={`alert ${authError.includes('완료') ? 'alert-success' : 'alert-error'}`}>
            <span>{authError}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">사용자명</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder="사용자명을 입력하세요"
                value={formData.username}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
              />
              {errors.username && <p className="text-error text-sm mt-1">{errors.username}</p>}
            </div>
          )}
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">이메일</span>
            </label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="이메일을 입력하세요" 
              className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
              value={formData.email} 
              onChange={handleChange}
            />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">비밀번호</span>
            </label>
            <input 
              type="password" 
              name="password"
              required
              placeholder="비밀번호를 입력하세요" 
              className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
              value={formData.password} 
              onChange={handleChange}
            />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
          </div>
          
          {!isLogin && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">비밀번호 확인</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
              />
              {errors.confirmPassword && <p className="text-error text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  처리 중...
                </>
              ) : (
                isLogin ? '로그인' : '회원가입'
              )}
            </button>
          </div>
          
          {isLogin && (
            <div className="text-center">
              <a href="#" className="text-sm text-primary hover:underline">
                비밀번호를 잊어버리셨나요?
              </a>
            </div>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-base-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-base-100 text-base-content/70">또는</span>
            </div>
          </div>
          
          <div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="btn btn-outline w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              <span>Google로 {isLogin ? '로그인' : '회원가입'}</span>
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={toggleForm}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {isLogin ? (
              <>계정이 없으신가요? <span className="font-bold">회원가입</span></>
            ) : (
              <>이미 계정이 있으신가요? <span className="font-bold">로그인</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;