import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home, LogOut, User } from 'lucide-react';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { API_BASE_URL } from '@/utils/apiService';

const AdminLayout = ({ children }) => {
    const { logout, user } = useAuth();
    
    // 이미지 URL 결정 로직을 함수로 추출
    const getProfileImageUrl = () => {
        // 우선순위: 1. user.profile_image 2. 로컬 스토리지 3. 기본 이미지
        let imageUrl = null;
        
        // 로컬 스토리지 키 생성
        const storageKey = user?.id ? `profile_image_${user.id}` : null;
        
        // 사용자 객체에서 프로필 이미지 URL 가져오기
        if (user?.profile_image) {
            console.log('관리자 패널: 사용자 객체에서 프로필 이미지 URL 사용:', user.profile_image);
            imageUrl = user.profile_image;
        } 
        // 로컬 스토리지에서 이미지 URL 가져오기
        else if (storageKey && localStorage.getItem(storageKey)) {
            console.log('관리자 패널: 로컬 스토리지에서 프로필 이미지 URL 사용:', localStorage.getItem(storageKey));
            imageUrl = localStorage.getItem(storageKey);
        }
        
        // 이미지 URL이 없으면 기본 이미지 반환
        if (!imageUrl) {
            return `https://placehold.co/100x100/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'A'}`;
        }
        
        // 상대 경로인 경우 API_BASE_URL을 붙여 완전한 URL로 만들기
        if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
            console.log('관리자 패널: 상대 경로를 완전한 URL로 변환:', `${API_BASE_URL}${imageUrl}`);
            imageUrl = `${API_BASE_URL}${imageUrl}`;
        }
        
        // 이미 타임스탬프가 있는지 확인
        const hasTimestamp = imageUrl.includes('?t=') || imageUrl.includes('&t=');
        
        // 이미 타임스탬프가 있으면 그대로 반환
        if (hasTimestamp) {
            return imageUrl;
        }
        
        // 타임스탬프 추가
        const timestamp = new Date().getTime();
        return imageUrl.includes('?') 
            ? `${imageUrl}&t=${timestamp}` 
            : `${imageUrl}?t=${timestamp}`;
    };

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
                                        src={getProfileImageUrl()} 
                                        alt={`${user?.username || '관리자'} 프로필`}
                                        onError={(e) => {
                                            console.log('관리자 패널: 프로필 이미지 로딩 실패, 기본 이미지로 대체:', e.target.src);
                                            e.target.onerror = null; // 무한 루프 방지
                                            e.target.src = `https://placehold.co/100x100/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'A'}`;
                                        }}
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