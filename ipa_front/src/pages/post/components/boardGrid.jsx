import React, { useState } from 'react';
import { Slide, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PostCard from '@/pages/post/components/postCards.jsx';
import { useNavigate, Link } from 'react-router-dom';

const POSTS_PER_PAGE = 40;
const BoardGrid = ({ posts }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    
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
                                    src={post.imageUrl}
                                    alt={post.prompt}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* 제목을 위한 그라데이션만 항상 표시 */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                    <h3 className="text-white font-semibold truncate">
                                        {post.prompt}
                                    </h3>
                                </div>

                                {/* 뱃지 */}
                                {post.model && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <span className="badge badge-primary">{post.model}</span>
                                    </div>
                                )}

                                {/* Copy Prompt 버튼 */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleCopyPrompt(post.prompt);
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