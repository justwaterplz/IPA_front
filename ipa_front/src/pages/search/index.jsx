import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchComponent from '@/pages/search/components/SearchComponent';
import SearchResults from '@/pages/search/components/SearchResults';
import Header from '../../components/layout/header';
import { postService } from '@/utils/localStorageDB';

const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState({
        query: '',
        target: 'prompt',
        date: ''
    });
    // 테마 변경용
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        // URL에서 검색 쿼리 파라미터 가져오기
        const params = new URLSearchParams(location.search);
        const query = params.get('query') || '';
        const target = params.get('target') || 'prompt';
        const date = params.get('date') || '';
        
        // 검색 쿼리 상태 업데이트
        setSearchQuery({
            query,
            target,
            date
        });
        
        // 초기 검색 실행
        if (target === 'date' && date) {
            executeSearch({ target, date });
        } else if (query && target) {
            executeSearch({ query, target });
        }
    }, [location.search]);
    
    const handleSearch = (searchData) => {
        setSearchQuery(searchData);
        executeSearch(searchData);
    };
    
    const executeSearch = (searchData) => {
        setIsSearching(true);
        
        // URL 업데이트
        const params = new URLSearchParams();
        if (searchData.target === 'date' && searchData.date) {
            params.set('target', searchData.target);
            params.set('date', searchData.date);
        } else if (searchData.query) {
            params.set('query', searchData.query);
            params.set('target', searchData.target);
        }
        
        // URL 업데이트
        navigate(`/search?${params.toString()}`, { replace: true });
        
        // 로컬 스토리지에서 검색 실행
        setTimeout(() => {
            const results = postService.searchPosts(searchData);
            setSearchResults(results);
            setIsSearching(false);
        }, 500); // 실제 검색 느낌을 위한 약간의 지연
    };
    
    return (
        <div className="container mx-auto px-4 py-8">

            <Header theme={theme} setTheme={setTheme} />
            
            {/* 검색 컴포넌트 */}
            <SearchComponent 
                onSearch={handleSearch} 
                initialQuery={searchQuery.query}
                initialTarget={searchQuery.target}
                initialDate={searchQuery.date}
            />
            
            {/* 검색 결과 컴포넌트 */}
            <SearchResults 
                results={searchResults}
                isLoading={isSearching}
                searchParams={searchQuery}
            />
        </div>
    );
};

export default Search;