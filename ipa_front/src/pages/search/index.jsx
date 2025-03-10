import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchComponent from '@/pages/search/components/SearchComponent';
import SearchResults from '@/pages/search/components/SearchResults';
import Header from '../../components/layout/header';
import { postService } from '@/utils/apiService';

const Search = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState({
        query: '',
        target: 'prompt',
        tag: ''
    });
    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        currentPage: 1
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
        const tag = params.get('tag') || '';
        const page = parseInt(params.get('page')) || 1;
        
        // 검색 쿼리 상태 업데이트
        setSearchQuery({
            query,
            target,
            tag
        });
        
        setPagination(prev => ({
            ...prev,
            currentPage: page
        }));
        
        // 초기 검색 실행
        if (query || tag) {
            executeSearch({ query, target, tag, page });
        }
    }, [location.search]);
    
    const handleSearch = (searchData) => {
        setSearchQuery(searchData);
        executeSearch({ ...searchData, page: 1 });
    };
    
    const handlePageChange = (newPage) => {
        executeSearch({ ...searchQuery, page: newPage });
    };
    
    const executeSearch = async (searchData) => {
        setIsSearching(true);
        
        // URL 업데이트
        const params = new URLSearchParams();
        if (searchData.query) {
            params.set('query', searchData.query);
            params.set('target', searchData.target);
        }
        if (searchData.tag) {
            params.set('tag', searchData.tag);
        }
        if (searchData.page && searchData.page > 1) {
            params.set('page', searchData.page.toString());
        }
        
        // URL 업데이트
        navigate(`/search?${params.toString()}`, { replace: true });
        
        try {
            // API를 통한 검색 실행
            const apiParams = {};
            
            if (searchData.query) {
                if (searchData.target === 'prompt') {
                    apiParams.search = searchData.query;
                } else if (searchData.target === 'author') {
                    apiParams.author = searchData.query;
                }
            }
            
            if (searchData.tag) {
                apiParams.tag = searchData.tag;
            }
            
            if (searchData.page) {
                apiParams.page = searchData.page;
            }
            
            const response = await postService.searchPosts(apiParams);
            setSearchResults(response);
            
            setPagination({
                count: response.count || 0,
                next: response.next,
                previous: response.previous,
                currentPage: searchData.page || 1
            });
        } catch (error) {
            console.error('검색 중 오류 발생:', error);
            setSearchResults([]);
            setPagination({
                count: 0,
                next: null,
                previous: null,
                currentPage: 1
            });
        } finally {
            setIsSearching(false);
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <Header theme={theme} setTheme={setTheme} />
            
            {/* 검색 컴포넌트 */}
            <SearchComponent 
                onSearch={handleSearch} 
                initialQuery={searchQuery.query}
                initialTarget={searchQuery.target}
                initialTag={searchQuery.tag}
            />
            
            {/* 검색 결과 컴포넌트 */}
            <SearchResults 
                results={searchResults}
                isLoading={isSearching}
                searchParams={searchQuery}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default Search;