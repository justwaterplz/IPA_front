import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, USER_ROLES } from '@/pages/auth/components/AuthContext';

/**
 * 권한 기반 라우트 보호 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
 * @param {string} props.requiredRole - 접근에 필요한 권한 레벨 (기본값: USER)
 * @param {string} props.redirectPath - 권한이 없을 때 리다이렉트할 경로
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = USER_ROLES.USER,
  redirectPath = '/login'
}) => {
  const { isAuthenticated, userRole, permissionStatus, loading } = useAuth();
  const location = useLocation();

  // 로딩 중일 때는 로딩 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 권한 확인
  const hasRequiredPermission = () => {
    // 관리자는 모든 페이지에 접근 가능
    if (userRole === USER_ROLES.ADMIN) return true;
    
    // 요구되는 권한에 따라 확인
    switch (requiredRole) {
      case USER_ROLES.ADMIN:
        return userRole === USER_ROLES.ADMIN;
      case USER_ROLES.USER:
        return userRole === USER_ROLES.USER || userRole === USER_ROLES.ADMIN;
      case USER_ROLES.PENDING:
        return userRole === USER_ROLES.PENDING || userRole === USER_ROLES.USER || userRole === USER_ROLES.ADMIN;
      default:
        return false;
    }
  };

  // 권한이 없는 경우 처리
  if (!hasRequiredPermission()) {
    // 승인 대기 중이거나 권한 신청이 필요한 경우 설정 페이지로 리다이렉트
    if (userRole === USER_ROLES.PENDING) {
      // 이미 설정 페이지에 있는 경우 무한 리다이렉트 방지
      if (location.pathname === '/settings') {
        return children;
      }
      return <Navigate to="/settings" state={{ from: location }} replace />;
    }
    
    // 그 외의 경우 지정된 리다이렉트 경로로 이동
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 권한이 있는 경우 자식 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute; 