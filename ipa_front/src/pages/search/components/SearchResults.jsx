import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchResults = ({ results, isLoading, searchParams }) => {
    const navigate = useNavigate();
    
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
    
    return (
        <div className="w-full max-w-6xl mx-auto my-8 p-6 bg-base-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
                검색 결과 ({results.length}건)
                {searchParams?.target && (
                    <span className="text-sm font-normal ml-2">
                        검색 대상: {getTargetLabel(searchParams.target)}
                    </span>
                )}
            </h2>
            
            {/* 이미지 그리드 형태의 검색 결과 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(result => (
                    <div 
                        key={result.id} 
                        className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
                    >
                        {/* 이미지 - 클릭 시 게시물로 이동 */}
                        <figure 
                            className="relative aspect-square overflow-hidden cursor-pointer"
                            onClick={() => navigate(`/post/${result.id}`)}
                        >
                            <img 
                                src={result.imageUrl} 
                                alt="게시물 이미지"
                                className="w-full h-full object-cover"
                            />
                        </figure>
                        
                        {/* 카드 내용 - 사용자 정보 */}
                        <div className="p-3">
                            <div 
                                className="flex items-center gap-2 cursor-pointer" 
                                onClick={() => navigate(`/profile/${result.username}`)}
                            >
                                <div className="avatar">
                                    <div className="w-8 h-8 rounded-full">
                                        <img 
                                            src={result.userProfileImage || `https://placehold.co/100x100/9CA3AF/FFFFFF?text=${result.username?.charAt(0)}`} 
                                            alt={result.username}
                                        />
                                    </div>
                                </div>
                                <span className="font-medium">{result.username}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">{result.date}</div>
                        </div>
                    </div>
                ))}
            </div>
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