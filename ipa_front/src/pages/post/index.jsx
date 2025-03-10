// post pages
import BoardGrid from "@/pages/post/components/boardGrid.jsx";
import Header from "@/components/layout/header.jsx";
import { useEffect, useState } from 'react';
import { postService } from '@/utils/apiService';

const Post = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
        currentPage: 1
    });

    // 게시물 데이터 가져오기
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const response = await postService.getAllPosts(null, pagination.currentPage);
                setPosts(response.results || []);
                setPagination({
                    count: response.count || 0,
                    next: response.next,
                    previous: response.previous,
                    currentPage: pagination.currentPage
                });
            } catch (error) {
                console.error('게시물을 가져오는 중 오류 발생:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPosts();
    }, [pagination.currentPage]);

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            currentPage: newPage
        }));
    };

    // localStorage에서 테마를 가져오거나, 없으면 'light'를 기본값으로 사용
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light';
    });

    // theme가 변경될 때마다 localStorage에 저장하고 HTML 속성 업데이트
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Header theme={theme} setTheme={setTheme} />
                {/* <h1 className="text-3xl font-bold mb-8 text-center">프롬프트 게시판</h1> */}
                {loading ? (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-500">게시물을 불러오는 중...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-500">게시물이 없습니다. 첫 번째 게시물을 업로드해보세요!</p>
                    </div>
                ) : (
                    <>
                        <BoardGrid posts={posts} />
                        
                        {/* 페이지네이션 UI */}
                        {pagination.count > 0 && (
                            <div className="flex justify-center mt-8">
                                <div className="join">
                                    <button 
                                        className="join-item btn"
                                        disabled={!pagination.previous}
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    >
                                        «
                                    </button>
                                    <button className="join-item btn">
                                        페이지 {pagination.currentPage}
                                    </button>
                                    <button 
                                        className="join-item btn"
                                        disabled={!pagination.next}
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    >
                                        »
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Post;