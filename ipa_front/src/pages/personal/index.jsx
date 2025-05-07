import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { Edit, X, Check, Loader, User, ArrowLeft, Calendar, Bell, Search, Link, MoreHorizontal } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { postService, userService } from '@/utils/apiService';
import { API_BASE_URL } from '@/utils/apiService';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState({ avatar: false });
    const [currentSlide, setCurrentSlide] = useState(0);
    const [userPosts, setUserPosts] = useState([]);
    const [userBookmarks, setUserBookmarks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date('2025-03-06T00:00:00'));
    const [selectedYear, setSelectedYear] = useState(2025);
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' 또는 'bookmarks'
    
    // 기본 프로필 이미지 제거 (Lucide User 아이콘으로 대체)
    // const DEFAULT_PROFILE_IMAGE = 'https://api.dicebear.com/7.x/avataaars/svg?seed=';
    // const getDefaultProfileImage = (userId) => {
    //     return `${DEFAULT_PROFILE_IMAGE}${userId || 'default'}`;
    // };

    // 이미지 URL 처리 함수
    const getImageUrl = (post) => {
        // 이미지 필드가 다양한 이름으로 존재할 수 있음
        const imageField = post.imageUrl || post.image_url || post.image || '';
        
        console.log('이미지 필드 처리 중:', {
            id: post.id,
            originalImageField: imageField,
            availableFields: {
                imageUrl: post.imageUrl,
                image_url: post.image_url,
                image: post.image
            }
        });
        
        // 이미지가 없는 경우
        if (!imageField) {
            // 게시물 내용 기반 더미 이미지 생성
            const content = post?.prompt || post?.title || post?.content || '';
            const encodedContent = encodeURIComponent(content.trim() || 'image');
            const fallbackUrl = `https://source.unsplash.com/300x300/?${encodedContent}`;
            console.log('이미지 없음, 대체 이미지 사용:', fallbackUrl);
            return fallbackUrl;
        }
        
        // 이미 완전한 URL인 경우
        if (imageField.startsWith('http')) {
            console.log('완전한 URL 사용:', imageField);
            return imageField;
        }
        
        // 상대 경로인 경우 API_BASE_URL과 결합
        const fullUrl = `${API_BASE_URL}${imageField}`;
        console.log('API URL과 결합:', fullUrl);
        return fullUrl;
    };

    // 프로필 이미지 URL 가져오기 함수 추가
    const getProfileImageUrl = () => {
        // 우선순위: 1. user.profile_image 2. 로컬 스토리지 3. user.profileImage 4. 기본 이미지
        let imageUrl = null;
        
        const storageKey = user?.id ? `profile_image_${user.id}` : null;
        const storageImage = storageKey ? localStorage.getItem(storageKey) : null;
        
        if (user?.profile_image) {
            console.log('Personal: 사용자 객체에서 프로필 이미지 URL 사용:', user.profile_image);
            imageUrl = user.profile_image;
        } 
        else if (storageImage) {
            console.log('Personal: 로컬 스토리지에서 프로필 이미지 복원:', storageImage);
            imageUrl = storageImage;
        }
        else if (user?.profileImage) {
            console.log('Personal: 대체 필드에서 프로필 이미지 URL 사용:', user.profileImage);
            imageUrl = user.profileImage;
        }
        
        // 이미지가 없는 경우 기본 이미지 반환
        if (!imageUrl) {
            const initial = user?.username?.charAt(0) || 'U';
            return `https://placehold.co/100x100/9370DB/FFFFFF?text=${initial}`;
        }
        
        // 상대 경로를 절대 경로로 변환
        if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
            imageUrl = `${API_BASE_URL}${imageUrl}`;
        }
        
        // 타임스탬프 추가 (캐시 방지)
        if (!imageUrl.includes('t=')) {
            const timestamp = new Date().getTime();
            imageUrl = imageUrl.includes('?') 
                ? `${imageUrl}&t=${timestamp}` 
                : `${imageUrl}?t=${timestamp}`;
        }
        
        return imageUrl;
    };

    // 사용자 게시물 가져오기
    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    console.log('사용자 정보:', user);
                    
                    // 사용자 게시물 가져오기
                    const postsResponse = await postService.getUserPosts();
                    console.log('사용자 게시물:', postsResponse);
                    
                    // 게시물 데이터 정제 - 날짜 형식 검증 및 이미지 URL 처리
                    const validatedPosts = (postsResponse.results || []).map(post => {
                        // 날짜 형식 검증
                        if (post.createdAt) {
                            try {
                                const date = new Date(post.createdAt);
                                // 유효한 날짜인지 확인
                                if (isNaN(date.getTime())) {
                                    console.warn('유효하지 않은 날짜 형식:', post.createdAt);
                                    // 현재 날짜로 대체
                                    post.createdAt = new Date().toISOString();
                                }
                            } catch (error) {
                                console.error('날짜 변환 중 오류:', error);
                                // 현재 날짜로 대체
                                post.createdAt = new Date().toISOString();
                            }
                        } else {
                            // createdAt이 없는 경우 현재 날짜 설정
                            post.createdAt = new Date().toISOString();
                        }
                        
                        // 이미지 URL 처리 - 백엔드 응답 구조에 맞게 매핑
                        post.imageUrl = getImageUrl(post);
                        
                        return post;
                    });
                    
                    setUserPosts(validatedPosts);
                    
                    // 사용자 북마크 가져오기
                    const bookmarksResponse = await postService.getUserBookmarks();
                    
                    // 북마크 데이터 정제 - 날짜 형식 검증
                    const validatedBookmarks = (bookmarksResponse.results || []).map(post => {
                        // 날짜 형식 검증
                        if (post.createdAt) {
                            try {
                                const date = new Date(post.createdAt);
                                // 유효한 날짜인지 확인
                                if (isNaN(date.getTime())) {
                                    // 현재 날짜로 대체
                                    post.createdAt = new Date().toISOString();
                                }
                            } catch (error) {
                                // 현재 날짜로 대체
                                post.createdAt = new Date().toISOString();
                            }
                        } else {
                            // createdAt이 없는 경우 현재 날짜 설정
                            post.createdAt = new Date().toISOString();
                        }
                        
                        // 이미지 URL 처리 - 백엔드 응답 구조에 맞게 매핑
                        post.imageUrl = getImageUrl(post);
                        
                        return post;
                    });
                    
                    setUserBookmarks(validatedBookmarks);
                } catch (error) {
                    console.error('사용자 데이터를 가져오는 중 오류 발생:', error);
                    setUserPosts([]);
                    setUserBookmarks([]);
                }
            }
        };
        
        fetchUserData();
    }, [user]);
    
    // 이미지 로드 핸들러
    const handleImageLoad = (id) => {
        setImageLoaded(prev => ({ ...prev, [id]: true }));
    };

    // 이미지 로드 실패 핸들러
    const handleImageError = (id) => {
        setImageLoaded(prev => ({ ...prev, [id]: true }));
    };

    // 활동 데이터와 월 레이블을 useMemo로 계산
    const { months, activityData, currentWeekIndex } = useMemo(() => {
        console.log("활동 데이터 생성 중...");
        console.log(`선택된 연도: ${selectedYear}`);
        console.log(`사용자 게시물 수: ${userPosts.length}`);
        
        // 게시물 날짜별 카운트
        const postCountByDate = {};
        userPosts.forEach(post => {
            try {
                // 날짜 형식 검증 및 안전한 변환
                let date;
                if (post.createdAt) {
                    // ISO 형식 문자열인지 확인
                    if (typeof post.createdAt === 'string' && post.createdAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                        date = new Date(post.createdAt);
                    } 
                    // 타임스탬프인 경우
                    else if (typeof post.createdAt === 'number') {
                        date = new Date(post.createdAt);
                    }
                    // 다른 형식의 날짜 문자열
                    else if (typeof post.createdAt === 'string') {
                        // 날짜 형식이 다를 수 있으므로 여러 형식 시도
                        date = new Date(post.createdAt);
                    }
                }

                // 유효한 날짜인지 확인
                if (date && !isNaN(date.getTime())) {
                    const dateKey = date.toISOString().split('T')[0];
                    postCountByDate[dateKey] = (postCountByDate[dateKey] || 0) + 1;
                    console.log(`게시물 날짜: ${dateKey}`);
                } else {
                    console.warn('유효하지 않은 날짜 형식:', post.createdAt);
                }
            } catch (error) {
                console.error('날짜 처리 중 오류 발생:', error, post);
            }
        });
        
        const weeks = [];
        let currentWeekIndex = -1;
        
        // 선택된 연도의 1월 1일
        const startOfYear = new Date(selectedYear, 0, 1);
        // 1월 1일의 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
        const firstDayOfWeek = startOfYear.getDay();
        
        // 월요일부터 시작하는 주 계산을 위해 조정
        // 1월 1일이 속한 주의 월요일 찾기
        const firstMonday = new Date(startOfYear);
        // 1이 월요일, 2가 화요일, ..., 0이 일요일
        const daysSinceMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        firstMonday.setDate(firstMonday.getDate() - daysSinceMonday);
        
        // 주 단위로 데이터 생성 (최대 53주)
        for (let weekOffset = 0; weekOffset < 53; weekOffset++) {
            const weekStart = new Date(firstMonday);
            weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
            
            // 이번 주가 다음 연도에 속하면 중단
            if (weekStart.getFullYear() > selectedYear && weekStart.getMonth() > 0) {
                break;
            }
            
            const week = [];
            let hasValidDay = false; // 이번 주에 유효한 날짜가 있는지 확인
            
            // 월요일부터 일요일까지 (월요일이 0, 일요일이 6)
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + dayOffset);
                
                // 현재 날짜가 선택된 연도에 속하는지 확인
                const isInSelectedYear = currentDate.getFullYear() === selectedYear;
                
                // 날짜를 YYYY-MM-DD 형식의 문자열로 변환
                const dateKey = currentDate.toISOString().split('T')[0];
                const count = isInSelectedYear ? (postCountByDate[dateKey] || 0) : -1; // -1은 표시하지 않음을 의미
                
                // 현재 날짜가 오늘 날짜인지 확인
                const today = new Date();
                const isToday = dateKey === today.toISOString().split('T')[0];
                
                if (isInSelectedYear) {
                    hasValidDay = true;
                }
                
                // 디버깅용 로그 (특정 날짜에 게시물이 있는 경우)
                if (count > 0) {
                    console.log(`${dateKey}에 ${count}개의 게시물이 있습니다.`);
                }
                
                // 기여도 레벨 계산 (0-4)
                let level = 0;
                if (count > 0) {
                    if (count === 1) level = 1;
                    else if (count === 2) level = 2;
                    else if (count <= 4) level = 3;
                    else level = 4;
                }
                
                // dayOffset이 그대로 요일 인덱스가 됨 (0: 월요일, 1: 화, ..., 6: 일)
                
                week.push({
                    date: currentDate,
                    count: isInSelectedYear ? level : -1, // 선택된 연도에 속하지 않으면 -1
                    actualCount: count,
                    dateKey,
                    isToday,
                    dayOfWeek: dayOffset // 요일 인덱스 (0: 월, 1: 화, ..., 6: 일)
                });
            }
            
            // 유효한 날짜가 있는 주만 추가
            if (hasValidDay) {
                weeks.push(week);
                
                // 현재 날짜가 속한 주 인덱스 찾기
                if (currentWeekIndex === -1) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const hasToday = week.some(day => day.dateKey === todayStr);
                    if (hasToday) {
                        currentWeekIndex = weeks.length - 1;
                    }
                }
            }
        }
        
        // 월 레이블 생성
        const monthLabels = [];
        for (let month = 0; month < 12; month++) {
            const date = new Date(selectedYear, month, 1);
            const monthName = date.toLocaleString('ko-KR', { month: 'short' });
            monthLabels.push(monthName);
        }
        
        return {
            months: monthLabels,
            activityData: weeks,
            currentWeekIndex
        };
    }, [userPosts, selectedYear]); // userPosts나 selectedYear가 변경될 때마다 다시 계산

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            {/* 프로필 헤더 */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
                {/* 아바타 */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                    <div className="w-full h-full rounded-full overflow-hidden bg-base-200">
                        {!imageLoaded.avatar && (
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader className="animate-spin" />
                            </div>
                        )}
                        <img
                            src={getProfileImageUrl()}
                            alt={user?.username || "Profile"}
                            className={`w-full h-full object-cover transition-opacity duration-200 ${
                                imageLoaded.avatar ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => handleImageLoad('avatar')}
                            onError={(e) => {
                                console.error('Personal: 프로필 이미지 로딩 실패');
                                e.target.onerror = null;
                                e.target.src = `https://placehold.co/100x100/9370DB/FFFFFF?text=${user?.username?.charAt(0) || 'U'}`;
                                handleImageLoad('avatar');
                            }}
                        />
                    </div>
                </div>

                {/* 이름 및 편집 - 수정 */}
                <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold">{user?.username || '사용자'}</h1>
                    </div>
                    {user?.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                </div>
                
                {/* 게시글 작성 버튼 추가 */}
                <div className="mt-4 sm:mt-0 sm:ml-auto">
                    <RouterLink 
                        to="/post" 
                        className="btn btn-primary"
                    >
                        <ArrowLeft size={18} />
                        목록으로
                    </RouterLink>
                </div>
            </div>

            {/* 활동 히스토리 그리드 */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">활동 히스토리</h2>
                    
                    {/* 연도 선택 UI */}
                    <div className="flex items-center gap-2">
                        <div className="join">
                            <button 
                                className={`join-item btn btn-sm ${selectedYear === 2024 ? 'btn-active' : ''}`}
                                onClick={() => setSelectedYear(2024)}
                            >
                                2024년
                            </button>
                            <button 
                                className={`join-item btn btn-sm ${selectedYear === 2025 ? 'btn-active' : ''}`}
                                onClick={() => setSelectedYear(2025)}
                            >
                                2025년
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-base-200 p-6 rounded-lg w-full overflow-x-hidden relative">
                    {/* 월 레이블 */}
                    <div className="flex ml-16 w-full">
                        {months.map((month, index) => {
                            return (
                                <div 
                                    key={month} 
                                    className="text-xs text-gray-500"
                                    style={{ 
                                        width: `calc((100% - 64px) / ${months.length})`,
                                        textAlign: 'start'
                                    }}
                                >
                                    {month}
                                </div>
                            );
                        })}
                    </div>

                    {/* 요일 레이블 + 그리드 */}
                    <div className="flex mt-2 w-full">
                        {/* 요일 레이블 수정 */}
                        <div className="flex flex-col justify-between mr-2 text-xs text-gray-500 shrink-0">
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>월</div>
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>화</div>
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>수</div>
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>목</div>
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>금</div>
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>토</div>
                            <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>일</div>
                        </div>

                        {/* 활동 그리드 */}
                        <div className="grid grid-cols-[repeat(53,1fr)] gap-2 flex-1">
                            {activityData.map((week, weekIndex) => (
                                <div 
                                    key={weekIndex} 
                                    className="grid grid-rows-7 gap-2"
                                >
                                    {/* 요일별로 정렬하여 표시 */}
                                    {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                                        const day = week.find(d => d.dayOfWeek === dayIndex);
                                        if (!day) return <div key={dayIndex} className="w-4 h-4 invisible"></div>;
                                        
                                        return (
                                            <div
                                                key={dayIndex}
                                                className={`
                                                    w-4 h-4 rounded-sm 
                                                    ${day.count === -1 ? 'invisible' : 'cursor-pointer'}
                                                    ${day.count === 0 ? 'bg-base-300' :
                                                      day.count === 1 ? 'bg-primary/20' :
                                                      day.count === 2 ? 'bg-primary/40' :
                                                      day.count === 3 ? 'bg-primary/60' :
                                                      'bg-primary'}
                                                    ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-1 hover:ring-primary hover:ring-offset-1'}
                                                    group relative
                                                `}
                                            >
                                                {/* CSS로만 구현된 툴팁 */}
                                                {day.count !== -1 && (
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1
                                                        bg-base-100 text-xs rounded shadow-lg whitespace-nowrap z-[200] border border-base-300
                                                        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all
                                                        pointer-events-none"
                                                    >
                                                        {day.actualCount > 0 ? (
                                                            <span className="font-bold text-primary">
                                                                {day.actualCount}개의 작품 업로드
                                                            </span>
                                                        ) : (
                                                            <span>작품 없음</span>
                                                        )}
                                                        <br />
                                                        {day.date.toLocaleDateString('ko-KR', { 
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 범례 */}
                    <div className="mt-6 flex items-center justify-end gap-2 text-xs text-gray-500">
                        <span>적음</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-sm bg-base-300"></div>
                            <div className="w-4 h-4 rounded-sm bg-primary/20"></div>
                            <div className="w-4 h-4 rounded-sm bg-primary/40"></div>
                            <div className="w-4 h-4 rounded-sm bg-primary/60"></div>
                            <div className="w-4 h-4 rounded-sm bg-primary"></div>
                        </div>
                        <span>많음</span>
                    </div>
                </div>
            </div>

            {/* 게시물 캐러셀 */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">내 작품</h2>
                    
                </div>
                <div className="relative">
                    <div 
                        className="carousel carousel-center w-full p-4 space-x-4 bg-base-200 rounded-lg"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {userPosts.length === 0 ? (
                            <div className="w-full h-60 flex items-center justify-center text-gray-500">
                                아직 업로드한 작품이 없습니다.
                            </div>
                        ) : (
                            userPosts.map((post, index) => (
                                <RouterLink 
                                    key={post.id}
                                    to={`/posts/${post.id}`}
                                    className="carousel-item relative w-60 h-60"
                                    id={`slide${index}`}
                                >
                                    <div className="w-full h-full bg-base-300 rounded-lg">
                                        {!imageLoaded[post.id] && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Loader className="animate-spin" />
                                            </div>
                                        )}
                                        <img
                                            src={getImageUrl(post)}
                                            alt={post.prompt || post.title || '이미지'}
                                            className={`rounded-lg w-full h-full object-cover transition-opacity duration-200 ${
                                                imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                                            }`}
                                            onLoad={() => handleImageLoad(post.id)}
                                            onError={() => handleImageError(post.id)}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex flex-col justify-end p-3">
                                            <div className="text-white text-sm font-medium line-clamp-2">
                                                {post.prompt || post.title || '제목 없음'}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="badge badge-sm">{post.model || post.category || '기타'}</span>
                                                <span className="text-xs text-white/80">
                                                    {post.createdAt && !isNaN(new Date(post.createdAt).getTime()) 
                                                        ? new Date(post.createdAt).toLocaleDateString() 
                                                        : '날짜 없음'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </RouterLink>
                            ))
                        )}
                    </div>
                    {/* 이전/다음 버튼 */}
                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex justify-between z-10">
                        <button 
                            className="btn btn-circle btn-sm bg-base-100" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const carouselContainer = e.currentTarget.parentElement.previousElementSibling;
                                const currentScroll = carouselContainer.scrollLeft;
                                const itemWidth = 240 + 16; // w-60 (240px) + space-x-4 (16px)
                                const itemsToScroll = 3; // 한 번에 3개의 아이템씩 스크롤
                                carouselContainer.scrollLeft = currentScroll - (itemWidth * itemsToScroll);
                            }}
                        >
                            ❮
                        </button>
                        <button 
                            className="btn btn-circle btn-sm bg-base-100" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const carouselContainer = e.currentTarget.parentElement.previousElementSibling;
                                const currentScroll = carouselContainer.scrollLeft;
                                const itemWidth = 240 + 16; // w-60 (240px) + space-x-4 (16px)
                                const itemsToScroll = 3; // 한 번에 3개의 아이템씩 스크롤
                                carouselContainer.scrollLeft = currentScroll + (itemWidth * itemsToScroll);
                            }}
                        >
                            ❯
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;