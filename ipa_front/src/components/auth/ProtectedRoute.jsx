import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/pages/auth/components/AuthContext';

/**
 * 인증된 사용자만 접근할 수 있는 보호된 라우트 컴포넌트
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트하고 현재 위치를 state로 전달
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
};

export default ProtectedRoute; 