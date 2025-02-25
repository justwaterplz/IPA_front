// components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ theme, setTheme }) => {
    // 임시로 로그인 상태를 관리하는 변수 (실제로는 전역 상태나 context에서 관리해야 함)
    const isLoggedIn = false;

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <header className="w-full px-4 sm:px-8 py-4">
            <div className="flex justify-between items-center">
                {/* 로고 영역 */}
                <Link to="/" className="flex items-center">
                    <span className={`text-8xl font-racing ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        IPA
                    </span>
                </Link>

                {/* 오른쪽 버튼 영역 */}
                <div className="flex items-center gap-4">
                    {/* Search Button */}
                    <button 
                        className="p-2 hover:bg-gray-100 rounded-full"
                        onClick={() => {/* 검색 페이지로 이동 */}}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    {/* Theme Switch */}
                    <label className="flex cursor-pointer gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                        </svg>
                        <input 
                            type="checkbox" 
                            className="toggle theme-controller black-btn" 
                            checked={theme === 'dark'}
                            onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    </label>

                    {/* Auth Buttons / Profile */}
                    {isLoggedIn ? (
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                                <div className="w-8 rounded-full">
                                    <img
                                        src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
                                        alt="프로필"
                                    />
                                </div>
                            </div>
                            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                                <li><Link to="/profile">프로필</Link></li>
                                <li><Link to="/settings">설정</Link></li>
                                <li><button onClick={() => {/* 로그아웃 로직 */}}>로그아웃</button></li>
                            </ul>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link to="/login" className="btn btn-sm">로그인</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">회원가입</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;