import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/utils/apiService';

const SearchResults = ({ results, isLoading, searchParams, pagination, onPageChange }) => {
    const navigate = useNavigate();
    
    // 이미지 URL을 전체 URL로 변환하는 함수
    const getFullImageUrl = (result) => {
        if (!result) return 'https://placehold.co/600x400/9370DB/FFFFFF?text=No+Image';
        
        // 백엔드 응답 구조 로깅
        console.log('검색 결과 데이터 구조:', Object.keys(result));
        
        // 이미지 필드 확인 (image 또는 image_url)
        const imageUrl = result.image || result.image_url;
        
        if (!imageUrl) {
            // 이미지가 없는 경우 콘텐츠 기반 더미 이미지 생성
            const content = result?.content || result?.title || '';
            const encodedContent = encodeURIComponent(content.trim() || 'image');
            console.log('이미지 URL이 없음, 더미 이미지 사용:', encodedContent);
            return `https://source.unsplash.com/300x300/?${encodedContent}`;
        }
        
        // 이미 완전한 URL인 경우
        if (imageUrl.startsWith('http')) {
            console.log('완전한 URL:', imageUrl);
            return imageUrl;
        }
        
        // 상대 경로인 경우 API_BASE_URL 추가
        const fullUrl = `${API_BASE_URL}${imageUrl}`;
        console.log('변환된 URL:', fullUrl);
        return fullUrl;
    };

    // 프로필 이미지 URL 처리 함수
    const getProfileImageUrl = (author) => {
        if (!author || !author.profile_image) {
            // 프로필 이미지가 없는 경우 이니셜 기반 이미지 생성
            const initial = author?.username?.charAt(0) || 'U';
            return `https://placehold.co/100x100/9370DB/FFFFFF?text=${initial}`;
        }
        
        // 이미 완전한 URL인 경우
        if (author.profile_image.startsWith('http')) {
            return author.profile_image;
        }
        
        // 상대 경로인 경우 API_BASE_URL 추가
        return `${API_BASE_URL}${author.profile_image}`;
    };

    // 디버깅을 위해 검색 결과 로깅
    console.log('검색 결과:', results);
    
    if (isLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto my-8 p-6 bg-base-200 rounded-lg">
                <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }
    
    if (!results || results.length === 0) {
        return (
            <div className="w-full max-w-6xl mx-auto my-8 p-6 bg-base-200 rounded-lg">
                <div className="text-center py-8">
                    <h3 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h3>
                    <p className="text-gray-500">
                        {searchParams?.query 
                            ? `'${searchParams.query}'에 대한 검색 결과가 없습니다.` 
                            : searchParams?.date
                              ? `'${searchParams.date}' 날짜에 대한 검색 결과가 없습니다.`
                              : '검색어를 입력하고 검색 버튼을 클릭하세요.'}
                    </p>
                    {searchParams?.target && (
                        <p className="text-gray-500 mt-2">
                            검색 대상: {getTargetLabel(searchParams.target)}
                        </p>
                    )}
                </div>
            </div>
        );
    }
    
    // 결과가 배열인지 확인하고 배열로 변환
    const searchResults = Array.isArray(results) ? results : results?.results || [];
    
    return (
        <div className="w-full max-w-6xl mx-auto my-8 p-6 bg-base-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
                검색 결과 ({searchResults.length}건)
                {searchParams?.target && (
                    <span className="text-sm font-normal ml-2">
                        검색 대상: {getTargetLabel(searchParams.target)}
                    </span>
                )}
            </h2>
            
            {/* 이미지 그리드 형태의 검색 결과 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(result => {
                    console.log('개별 결과:', result);
                    const imageUrl = getFullImageUrl(result);
                    console.log('처리된 이미지 URL:', imageUrl);
                    
                    return (
                        <div 
                            key={result.id} 
                            className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                        >
                            <figure 
                                className="relative aspect-square overflow-hidden cursor-pointer"
                                onClick={() => navigate(`/posts/${result.id}`)}
                            >
                                <img 
                                    src={imageUrl}
                                    alt={result.content || result.title || "게시물 이미지"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        console.error('이미지 로드 실패:', result.image || result.image_url);
                                        // 콘텐츠 기반 대체 이미지
                                        const content = result?.content || result?.title || '';
                                        const encodedContent = encodeURIComponent(content.trim() || 'placeholder');
                                        e.target.src = `https://source.unsplash.com/300x300/?${encodedContent}`;
                                    }}
                                />
                            </figure>
                            
                            {/* 카드 내용 - 사용자 정보 */}
                            <div className="p-3">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer" 
                                    onClick={() => navigate(`/users/${result.author?.id}`)}
                                >
                                    <div className="avatar">
                                        <div className="w-8 h-8 rounded-full">
                                            <img 
                                                src={getProfileImageUrl(result.author)}
                                                alt={result.author?.username || "사용자"}
                                                onError={(e) => {
                                                    e.target.src = `https://placehold.co/100x100/9370DB/FFFFFF?text=${result.author?.username?.charAt(0) || 'U'}`;
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="font-medium">{result.author?.username || "알 수 없는 사용자"}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-2">
                                    {new Date(result.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* 페이지네이션 */}
            {pagination && pagination.count > 0 && (
                <div className="flex justify-center mt-8">
                    <div className="join">
                        <button 
                            className="join-item btn"
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            disabled={!pagination.previous}
                        >
                            «
                        </button>
                        <button className="join-item btn">
                            {pagination.currentPage} / {Math.ceil(pagination.count / 10)}
                        </button>
                        <button 
                            className="join-item btn"
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            disabled={!pagination.next}
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 검색 대상 레이블 가져오기
const getTargetLabel = (target) => {
    const targetMap = {
        'prompt': '프롬프트 내용',
        'author': '작성자',
        'model': '모델 이름',
        'color': '색상 (베타)',
        'date': '작성일'
    };
    
    return targetMap[target] || target;
};

export default SearchResults;