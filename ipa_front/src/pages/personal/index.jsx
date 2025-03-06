import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/pages/auth/components/AuthContext';
import { Edit, X, Check, Loader, User, ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '@/utils/localStorageDB';

const Profile = () => {
    const { user } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.username || '');
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState({});
    const [currentSlide, setCurrentSlide] = useState(0);
    const [userPosts, setUserPosts] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date('2025-03-06T00:00:00'));
    const [selectedYear, setSelectedYear] = useState(2025);
    
    // 사용자 게시물 가져오기
    useEffect(() => {
        if (user) {
            console.log('사용자 정보:', user);
            // 모든 게시물을 가져와서 현재 사용자의 게시물만 필터링
            const allPosts = postService.getAllPosts();
            const userPostsData = allPosts.filter(post => post.userId === user.id);
            console.log('필터링된 사용자 게시물:', userPostsData);
            setUserPosts(userPostsData);
        }
    }, [user]);
    
    // 이름 변경 핸들러
    const handleNameChange = async () => {
        if (!newName.trim()) return;
        
        setIsLoading(true);
        try {
            // API 호출 로직이 들어갈 자리
            await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이
            setIsEditingName(false);
            // 성공 토스트 메시지
        } catch (error) {
            // 에러 토스트 메시지
        } finally {
            setIsLoading(false);
        }
    };

    // 이미지 로드 핸들러
    const handleImageLoad = (id) => {
        setImageLoaded(prev => ({ ...prev, [id]: true }));
    };

    // 활동 데이터와 월 레이블을 useMemo로 계산
    const { months, activityData, currentWeekIndex } = useMemo(() => {
        console.log('선택된 연도:', selectedYear);
        
        // 선택된 연도의 1월 1일과 12월 31일 설정
        const startOfYear = new Date(selectedYear, 0, 1); // 1월 1일
        const endOfYear = new Date(selectedYear, 11, 31); // 12월 31일
        
        console.log('연도 시작일:', startOfYear.toISOString());
        console.log('연도 종료일:', endOfYear.toISOString());
        
        // 1월 1일의 요일 확인 (0: 일요일, 1: 월요일, ..., 6: 토요일)
        const firstDayOfWeek = startOfYear.getDay();
        console.log('1월 1일의 요일:', firstDayOfWeek);
        
        // 12월 31일의 요일 확인
        const lastDayOfWeek = endOfYear.getDay();
        console.log('12월 31일의 요일:', lastDayOfWeek);
        
        // 사용자 게시물 날짜별 카운트 맵 생성
        const postCountByDate = {};
        
        if (userPosts.length > 0) {
            userPosts.forEach(post => {
                const postDate = new Date(post.createdAt);
                const dateKey = postDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
                
                // 선택된 연도의 게시물만 카운트
                if (postDate.getFullYear() === selectedYear) {
                    console.log('게시물 날짜:', postDate, '날짜 키:', dateKey);
                    
                    if (postCountByDate[dateKey]) {
                        postCountByDate[dateKey]++;
                    } else {
                        postCountByDate[dateKey] = 1;
                    }
                }
            });
        }
        
        console.log('날짜별 게시물 카운트:', postCountByDate);
        
        // 주 단위로 데이터 생성
        const weeks = [];
        
        // 현재 날짜가 속한 주 인덱스
        let currentWeekIndex = -1;
        
        // 1월 1일이 속한 주의 시작일 (일요일)
        const firstWeekStart = new Date(startOfYear);
        firstWeekStart.setDate(firstWeekStart.getDate() - firstDayOfWeek);
        
        // 주 단위로 데이터 생성 (최대 53주)
        for (let weekOffset = 0; weekOffset < 53; weekOffset++) {
            const weekStart = new Date(firstWeekStart);
            weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
            
            // 이번 주가 다음 연도에 속하면 중단
            if (weekStart.getFullYear() > selectedYear) {
                break;
            }
            
            const week = [];
            let hasValidDay = false; // 이번 주에 유효한 날짜가 있는지 확인
            
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
                
                week.push({
                    date: currentDate,
                    count: isInSelectedYear ? level : -1, // 선택된 연도에 속하지 않으면 -1
                    actualCount: count,
                    dateKey,
                    isToday
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
                        {user?.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="Profile"
                                className={`w-full h-full object-cover transition-opacity duration-200 ${
                                    imageLoaded.avatar ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => handleImageLoad('avatar')}
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-primary/10 ${
                                imageLoaded.avatar ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => handleImageLoad('avatar')}>
                                <User 
                                    size={48} 
                                    className="text-primary"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 이름 및 편집 */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="input input-bordered input-sm"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button 
                                className="btn btn-circle btn-sm btn-ghost"
                                onClick={() => setIsEditingName(false)}
                                disabled={isLoading}
                            >
                                <X size={16} />
                            </button>
                            <button 
                                className="btn btn-circle btn-sm btn-primary"
                                onClick={handleNameChange}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader className="animate-spin" /> : <Check size={16} />}
                            </button>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold">{user?.name}</h1>
                            <button 
                                className="btn btn-ghost btn-sm"
                                onClick={() => setIsEditingName(true)}
                            >
                                <Edit size={16} />
                                이름 변경
                            </button>
                        </>
                    )}
                </div>
                
                {/* 게시글 작성 버튼 추가 */}
                <div className="mt-4 sm:mt-0 sm:ml-auto">
                    <Link 
                        to="/post" 
                        className="btn btn-primary"
                    >
                        <ArrowLeft size={18} />
                        목록으로
                    </Link>
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
                                    {week.map((day, dayIndex) => (
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
                                    ))}
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
                                <Link 
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
                                            src={post.imageUrl}
                                            alt={post.prompt}
                                            className={`rounded-lg w-full h-full object-cover transition-opacity duration-200 ${
                                                imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                                            }`}
                                            onLoad={() => handleImageLoad(post.id)}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex flex-col justify-end p-3">
                                            <div className="text-white text-sm font-medium line-clamp-2">
                                                {post.prompt}
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="badge badge-sm">{post.model}</span>
                                                <span className="text-xs text-white/80">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
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