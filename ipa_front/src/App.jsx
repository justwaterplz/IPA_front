import './App.css'
import PostList from '@/pages/post'
import Header from "@/components/layout/header.jsx";
import RootLayout from "@/components/layout/RootLayout.jsx";
import AuthForm from '@/pages/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PostDetail from '@/pages/postDetail';
import { AuthProvider, useAuth, USER_ROLES } from '@/pages/auth/components/AuthContext';
import { ModelProvider } from '@/contexts/ModelContext';
import Profile from '@/pages/personal';
import PublicProfile from './pages/personal/components/publicProfile';
import Search from '@/pages/search';
import UploadPage from '@/pages/upload';
import Settings from '@/settings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect } from 'react';
import AdminPanel from '@/pages/admin';

// 홈 리다이렉트 컴포넌트 - 로그인 상태에 따라 적절한 페이지로 리다이렉트
const HomeRedirect = () => {
  const { isAuthenticated, userRole } = useAuth();
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 권한이 없는 사용자는 설정 페이지로 리다이렉트
  if (userRole === USER_ROLES.PENDING) {
    return <Navigate to="/settings" replace />;
  }
  
  // 권한이 있는 사용자는 포스트 목록으로 리다이렉트
  return <Navigate to="/post" replace />;
};

// 회원가입 후 리다이렉트 컴포넌트
const RegisterRedirect = () => {
  const { isAuthenticated, userRole } = useAuth();
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 회원가입 후 설정 페이지로 리다이렉트
  return <Navigate to="/settings" replace />;
};

const App = () => {
  const [theme, setTheme] = useState(() => {
    // 로컬 스토리지에서 테마 불러오기 또는 기본값 설정
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // 테마 변경 시 document에 적용 및 로컬 스토리지에 저장
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Tailwind의 dark 모드 동기화를 위해 dark 클래스 추가/제거
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
        <AuthProvider>
          <ModelProvider>
            <Router>
                <Routes>
                    <Route element={<RootLayout theme={theme} setTheme={setTheme} />}>
                        <Route path="/" element={<HomeRedirect />} />
                        <Route path="/post" element={
                            <ProtectedRoute requiredRole={USER_ROLES.USER}>
                                <PostList />
                            </ProtectedRoute>
                        } />
                        <Route path="/post/:id" element={<PostDetail />} />
                        <Route path="/login" element={<AuthForm theme={theme} setTheme={setTheme} />} />
                        <Route path="/register" element={<AuthForm theme={theme} setTheme={setTheme} isRegister={true} />} />
                        <Route path="/register/success" element={<RegisterRedirect />} />
                        <Route path="/posts/:id" element={<PostDetail />} />
                        <Route path="/profile" element={
                            <ProtectedRoute requiredRole={USER_ROLES.USER}>
                                <Profile />
                            </ProtectedRoute>
                        } />
                        <Route path="/users/:id" element={<PublicProfile />} />
                        <Route path="/search" element={
                            <ProtectedRoute requiredRole={USER_ROLES.USER}>
                                <Search />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute requiredRole={USER_ROLES.PENDING}>
                                <Settings theme={theme} setTheme={setTheme} />
                            </ProtectedRoute>
                        } />
                        <Route path="/upload" element={
                            <ProtectedRoute requiredRole={USER_ROLES.USER}>
                                <UploadPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                                <AdminPanel />
                            </ProtectedRoute>
                        } />
                    </Route>
                </Routes>
            </Router>
          </ModelProvider>
        </AuthProvider>
    </>
  )
}

export default App
