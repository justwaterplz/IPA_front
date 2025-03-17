// components/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Search, Upload, Shield } from 'lucide-react';
import { useAuth, USER_ROLES } from '@/pages/auth/components/AuthContext';
import SearchModal from '@/pages/search/components/SearchModal';

const Header = ({ theme, setTheme }) => {
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, userRole } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearchClick = () => {
        setIsSearchModalOpen(true);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsSearchModalOpen(true);
        }
    };

    // 관리자 여부 확인
    const isAdmin = userRole === USER_ROLES.ADMIN;

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[100] w-full bg-base-100 shadow-sm">
                <div className="w-full">
                    <div className="flex justify-between items-center py-4 px-12">
                        {/* 왼쪽 (로고) */}
                        <div className="flex-shrink-0">
                            <Link to="/" className="flex items-center">
                                <span className={`text-8xl font-racing ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                    IPA
                                </span>
                            </Link>
                        </div>

                        {/* 오른쪽 (검색, 테마, 인증) */}
                        <div className="flex items-center gap-6">
                            {/* 업로드 버튼 - 로그인한 사용자만 표시 */}
                            {isAuthenticated && (
                                <Link to="/upload" className="btn btn-square tooltip tooltip-bottom flex items-center justify-center" data-tip="이미지 업로드">
                                    <Upload size={20} className="m-auto" />
                                </Link>
                            )}
                            
                            {/* 관리자 패널 버튼 - 관리자만 표시 */}
                            {isAuthenticated && isAdmin && (
                                <Link to="/admin" className="btn btn-square tooltip tooltip-bottom flex items-center justify-center" data-tip="관리자 패널">
                                    <Shield size={20} className="m-auto" />
                                </Link>
                            )}
                            
                            {/* 검색 */}
                            <button className="btn btn-square tooltip tooltip-bottom flex items-center justify-center" data-tip="검색" onClick={handleSearchClick}>
                                <Search size={20} className="m-auto" />
                            </button>
                            
                            {/* 테마 토글 */}
                            <label className="swap swap-rotate">
                                <input
                                    type="checkbox"
                                    checked={theme === 'dark'}
                                    onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                />
                                <svg className="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/></svg>
                                <svg className="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
                            </label>

                            {/* 인증 상태에 따른 UI */}
                            {isAuthenticated ? (
                                <div className="dropdown dropdown-end relative">
                                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                                        <div className="w-10 rounded-full">
                                            {user?.profile_image || user?.profileImage ? (
                                                <img 
                                                    alt="user profile" 
                                                    src={user.profile_image || user.profileImage || (user?.id ? localStorage.getItem(`profile_image_${user.id}`) : null)} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://placehold.co/200x200/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'U'}`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="bg-indigo-200 w-full h-full grid place-items-center rounded-full">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ul tabIndex={0} 
                                        className="dropdown-content menu menu-lg z-[101] mt-3 p-2 shadow bg-base-100 rounded-box w-52 absolute "
                                        style={{ maxHeight: '80vh', overflowY: 'auto' }}
                                    >
                                        <li>
                                            <Link to="/profile" className="justify-between">
                                                프로필
                                                {user?.unreadNotifications > 0 && (
                                                    <span className="badge badge-primary badge-lg">
                                                        {user.unreadNotifications}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                        {/* <li><Link to="/my-posts">내 게시물</Link></li> */}
                                        <li><Link to="/settings">설정</Link></li>
                                        {/* 관리자 패널 메뉴 항목 - 관리자만 표시 */}
                                        {isAdmin && (
                                            <li>
                                                <Link to="/admin" className="text-primary">
                                                    <Shield size={16} />
                                                    관리자 패널
                                                </Link>
                                            </li>
                                        )}
                                        <li>
                                            <button 
                                                onClick={handleLogout}
                                                className="text-error"
                                            >
                                                <LogOut size={16} />
                                                로그아웃
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <Link to="/login" className="btn btn-primary">
                                    로그인
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            {/* 헤더 높이만큼의 공간 + 추가 여백 */}
            <div className="h-24 mt-6"></div>
            
            {/* 검색 모달 */}
            <SearchModal 
                isOpen={isSearchModalOpen} 
                onClose={() => setIsSearchModalOpen(false)} 
            />
        </>
    );
};

export default Header;