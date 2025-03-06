// post pages
import BoardGrid from "@/pages/post/components/boardGrid.jsx";
import Header from "@/components/layout/header.jsx";
import { useEffect, useState } from 'react';
import { postService } from '@/utils/localStorageDB';

const Post = () => {
    const [posts, setPosts] = useState([]);

    // 게시물 데이터 가져오기
    useEffect(() => {
        const fetchPosts = () => {
            const allPosts = postService.getAllPosts();
            setPosts(allPosts);
        };
        
        fetchPosts();
        
        // 로컬 스토리지 변경 감지를 위한 이벤트 리스너
        const handleStorageChange = () => {
            fetchPosts();
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

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
                {posts.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-500">게시물이 없습니다. 첫 번째 게시물을 업로드해보세요!</p>
                    </div>
                ) : (
                    <BoardGrid posts={posts} />
                )}
            </div>
        </div>
    );
}

export default Post;