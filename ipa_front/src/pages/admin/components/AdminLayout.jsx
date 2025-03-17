import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home, LogOut } from 'lucide-react';
import { useAuth } from '@/pages/auth/components/AuthContext';

const AdminLayout = ({ children }) => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-base-200">
            {/* 상단 네비게이션 바 */}
            <nav className="bg-primary text-primary-content shadow-lg">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6" />
                        <span className="text-xl font-bold">IPA 관리자</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="avatar">
                                <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                    <img 
                                        src={user?.profile_image || 'https://placehold.co/100x100/9370DB/FFFFFF?text=A'} 
                                        alt="프로필" 
                                    />
                                </div>
                            </div>
                            <span className="font-medium">{user?.username || '관리자'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link to="/" className="btn btn-ghost btn-sm">
                                <Home className="h-4 w-4" />
                                <span className="hidden sm:inline">홈</span>
                            </Link>
                            <button 
                                onClick={logout} 
                                className="btn btn-ghost btn-sm"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* 메인 컨텐츠 */}
            <main>
                {children}
            </main>

            {/* 푸터 */}
            <footer className="bg-neutral text-neutral-content p-4 mt-8">
                <div className="container mx-auto text-center">
                    <p>© 2023 IPA 관리자 패널. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default AdminLayout; 