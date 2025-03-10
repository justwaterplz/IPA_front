import './App.css'
import PostList from '@/pages/post'
import Header from "@/components/layout/header.jsx";
import RootLayout from "@/components/layout/RootLayout.jsx";
import AuthForm from '@/pages/auth';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PostDetail from '@/pages/postDetail';
import { AuthProvider, useAuth } from '@/pages/auth/components/AuthContext';
import Profile from '@/pages/personal';
import PublicProfile from './pages/personal/components/publicProfile';
import Search from '@/pages/search';
import UploadPage from '@/pages/upload';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect } from 'react';

// 홈 리다이렉트 컴포넌트 - 로그인 상태에 따라 적절한 페이지로 리다이렉트
const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();
  
  // 로그인 상태에 따라 포스트 목록 또는 로그인 페이지로 리다이렉트
  return isAuthenticated ? <PostList /> : <Navigate to="/login" replace />;
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
  }, [theme]);

  return (
    <>
        <AuthProvider>
          <Router>
              <Routes>
                  <Route element={<RootLayout theme={theme} setTheme={setTheme} />}>
                      <Route path="/" element={<HomeRedirect />} />
                      <Route path="/post" element={
                          <ProtectedRoute>
                              <PostList />
                          </ProtectedRoute>
                      } />
                      <Route path="/post/:id" element={<PostDetail />} />
                      <Route path="/login" element={<AuthForm theme={theme} setTheme={setTheme} />} />
                      <Route path="/posts/:id" element={<PostDetail />} />
                      <Route path="/profile" element={
                          <ProtectedRoute>
                              <Profile />
                          </ProtectedRoute>
                      } />
                      <Route path="/users/:id" element={<PublicProfile />} />
                      <Route path="/search" element={<Search />} />
                      {/* 보호된 라우트 - 로그인한 사용자만 접근 가능 */}
                      <Route path="/upload" element={
                          <ProtectedRoute>
                              <UploadPage />
                          </ProtectedRoute>
                      } />
                  </Route>
              </Routes>
          </Router>
        </AuthProvider>
    </>
  )
}

export default App
