// post pages
import BoardGrid from "@/pages/post/components/boardGrid.jsx";
import Header from "@/components/layout/header.jsx";
import { useEffect, useState } from 'react';

const Post = () => {
    const posts = [
        {
            id: 1,
            image: 'https://picsum.photos/300/200?random=1',
            prompt: '이것은 첫 번째 프롬프트입니다.',
            badge: 'NEW'
        },
        {
            id: 2,
            image: 'https://picsum.photos/300/200?random=2',
            prompt: '두 번째 프롬프트 내용입니다.',
            badge: 'HOT'
        },
        {
            id: 3,
            image: 'https://picsum.photos/300/200?random=3',
            prompt: '세 번째 프롬프트 예시입니다.',
            badge: 'POPULAR'
        },
        {
            id: 4,
            image: 'https://picsum.photos/300/200?random=4',
            prompt: '네 번째 프롬프트 내용입니다.',
            badge: 'FEATURED'
        },
        {
            id: 5,
            image: 'https://picsum.photos/300/200?random=5',
            prompt: '다섯 번째 프롬프트 예시입니다.',
            badge: 'NEW'
        },
        {
            id: 6,
            image: 'https://picsum.photos/300/200?random=6',
            prompt: '여섯 번째 프롬프트 내용입니다.',
            badge: 'HOT'
        },
        {
            id: 7,
            image: 'https://picsum.photos/300/200?random=7',
            prompt: '일곱 번째 프롬프트 예시입니다.',
            badge: 'POPULAR'
        },
        {
            id: 8,
            image: 'https://picsum.photos/300/200?random=8',
            prompt: '여덟 번째 프롬프트 내용입니다.',
            badge: 'FEATURED'
        },
    ];

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
                <BoardGrid posts={posts} />
            </div>
        </div>
    );
}

export default Post;