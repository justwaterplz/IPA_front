import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';

const SearchComponent = ({ onSearch, initialQuery = '', initialTarget = 'prompt', initialDate = '' }) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchTarget, setSearchTarget] = useState(initialTarget);
    const [searchDate, setSearchDate] = useState(initialDate);

    // 초기 값이 변경될 때 상태 업데이트
    useEffect(() => {
        setSearchQuery(initialQuery);
        setSearchTarget(initialTarget);
        setSearchDate(initialDate);
    }, [initialQuery, initialTarget, initialDate]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTarget === 'date') {
            onSearch({
                date: searchDate,
                target: searchTarget
            });
        } else {
            onSearch({
                query: searchQuery,
                target: searchTarget
            });
        }
    };

    const searchTargets = [
        { value: 'prompt', label: '프롬프트' },
        { value: 'author', label: '작성자' },
        { value: 'model', label: '모델 이름' },
        { value: 'color', label: '색상 (베타)' },
        { value: 'date', label: '작성일' }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto my-8">
            <form onSubmit={handleSearch} className="w-full">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="text-center mb-4 md:mb-0">
                        {/* <h2 className="text-2xl font-bold mb-2">검색</h2> */}
                        {/* <p className="text-sm text-gray-500">원하는 정보를 빠르게 찾아보세요</p> */}
                    </div>
                    
                    <div className="flex-1 flex flex-col md:flex-row gap-2">
                        <div className="join w-full">
                            {/* 왼쪽: 검색 대상 선택 */}
                            <select 
                                className="select select-bordered join-item w-1/3"
                                value={searchTarget}
                                onChange={(e) => setSearchTarget(e.target.value)}
                            >
                                {searchTargets.map(target => (
                                    <option key={target.value} value={target.value}>
                                        {target.label}
                                    </option>
                                ))}
                            </select>
                            
                            {/* 오른쪽: 검색어 입력 또는 날짜 선택 */}
                            {searchTarget === 'date' ? (
                                <input 
                                    type="date" 
                                    className="input input-bordered join-item w-2/3"
                                    value={searchDate}
                                    onChange={(e) => setSearchDate(e.target.value)}
                                    required
                                />
                            ) : (
                                <input 
                                    type="text" 
                                    className="input input-bordered join-item w-2/3"
                                    placeholder="검색어를 입력하세요"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    required
                                />
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={searchTarget === 'date' ? !searchDate : !searchQuery.trim()}
                        >
                            <SearchIcon size={20} />
                            검색
                        </button>
                    </div>
                </div>
                
                {/* 검색 팁 */}
                <div className="mt-4 text-sm text-gray-500 text-center">
                    <p>팁: 정확한 검색을 위해 구체적인 키워드를 사용하세요</p>
                </div>
            </form>
        </div>
    );
};

export default SearchComponent; 