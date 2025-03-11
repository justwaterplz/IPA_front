import React, { useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PostCard from '@/pages/post/components/postCards.jsx';
import { useNavigate, Link } from 'react-router-dom';

// 오늘 날짜인지 확인하는 함수 추가
const isToday = (dateString) => {
    const today = new Date();
    const postDate = new Date(dateString);
    
    return (
        postDate.getDate() === today.getDate() &&
        postDate.getMonth() === today.getMonth() &&
        postDate.getFullYear() === today.getFullYear()
    );
};

const POSTS_PER_PAGE = 40;
const BoardGrid = ({ posts }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    
    // 전체 posts 데이터 로깅
    console.log('전체 게시물 데이터:', posts);
    
    // 이미지 URL을 전체 URL로 변환하는 함수
    const getFullImageUrl = (post) => {
        // 백엔드 응답 구조 로깅
        console.log('개별 게시물 데이터:', {
            id: post.id,
            title: post.title,
            content: post.content,
            image: post.image,
            tags: post.tags,
            author: post.author,
            created_at: post.created_at
        });
        
        // 이미지 필드 확인 (image 또는 image_url)
        const imageUrl = post.image;
        
        if (!imageUrl) {
            // 이미지가 없는 경우 콘텐츠 기반 더미 이미지 생성
            const content = post?.content || post?.title || '';
            const encodedContent = encodeURIComponent(content.trim() || 'image');
            console.log('이미지 URL이 없음, 더미 이미지 사용:', encodedContent);
            return `https://source.unsplash.com/300x300/?${encodedContent}`;
        }
        
        // 이미 완전한 URL인 경우
        if (imageUrl.startsWith('http')) return imageUrl;
        
        // 상대 경로인 경우
        // 백엔드 URL이 이미 포함되어 있으므로 그대로 반환
        return imageUrl;
    };
    
    // 디버깅을 위해 게시물 데이터 로깅
    console.log('게시물 데이터 (첫 번째 항목):', posts.length > 0 ? posts[0] : 'No posts');
    
    const sortedPosts = [...posts].reverse();
    const indexOfLastPost = currentPage * POSTS_PER_PAGE;
    const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE;
    const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.max(Math.ceil(sortedPosts.length / POSTS_PER_PAGE), 1);

    const handleCopyPrompt = async (prompt) => {
        try {
            await navigator.clipboard.writeText(prompt);
            toast.success('프롬프트가 복사되었습니다!', {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Slide
            });
        } catch (err) {
            console.error('Failed to copy prompt:', err);
            toast.error('프롬프트 복사에 실패했습니다.', {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                transition: Slide
            });
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {currentPosts.map((post) => (
                    <Link to={`/posts/${post.id}`} key={post.id}>
                        <div className="relative group cursor-pointer">
                            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105">
                                {/* 이미지 */}
                                <img
                                    src={getFullImageUrl(post)}
                                    alt={post.content || "게시물 이미지"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        console.error('이미지 로드 실패:', post.image);
                                        // 콘텐츠 기반 대체 이미지
                                        const content = post?.content || post?.title || '';
                                        const encodedContent = encodeURIComponent(content.trim() || 'placeholder');
                                        e.target.src = `https://source.unsplash.com/300x300/?${encodedContent}`;
                                    }}
                                />
                                
                                {/* 제목을 위한 그라데이션만 항상 표시 */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                    <h3 className="text-white font-semibold truncate">
                                        {post.content || post.title}
                                    </h3>
                                </div>

                                {/* 뱃지 영역 변경 - 좌측 상단과 우측 상단으로 분리 */}
                                {/* New 뱃지 - 좌측 상단으로 이동 */}
                                {isToday(post.created_at) && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <span className="badge badge-secondary font-bold">NEW</span>
                                    </div>
                                )}
                                
                                {/* 모델 뱃지 - 우측 상단 유지 */}
                                {post.model && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <span className="badge badge-primary">
                                            {typeof post.model === 'object' ? post.model.name : post.model}
                                        </span>
                                    </div>
                                )}

                                {/* Copy Prompt 버튼 */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleCopyPrompt(post.content || post.title);
                                    }}
                                    className="absolute bottom-2 right-2 z-10 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1"
                                >
                                    <svg 
                                        className="w-4 h-4" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" 
                                        />
                                    </svg>
                                    <span className="text-sm">Copy</span>
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination - 항상 표시 */}
            <div className="flex justify-center items-center gap-2 mt-8 mb-4">
                <button 
                    className="btn btn-square join-item"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    «
                </button>
                
                <div className="join">
                    {[...Array(totalPages)].map((_, index) => (
                        <input
                            key={index + 1}
                            type="radio"
                            name="pagination"
                            className="join-item btn btn-square rounded-md"
                            aria-label={String(index + 1)}
                            checked={currentPage === index + 1}
                            onChange={() => setCurrentPage(index + 1)}
                        />
                    ))}
                </div>

                <button 
                    className="btn btn-square join-item"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    »
                </button>
            </div>

            <ToastContainer
                position="bottom-center"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Slide}
            />
        </>
    );
};

export default BoardGrid;