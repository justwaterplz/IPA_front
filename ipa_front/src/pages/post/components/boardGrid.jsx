import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PostCard from '@/pages/post/components/postCards.jsx';

const BoardGrid = ({ posts }) => {
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
            });
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {posts.map((post) => (
                    <div key={post.id} className="relative group">
                        {/* 이미지 카드 */}
                        <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                            {/* 호버 시 나타나는 오버레이와 제목 */}
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                <div className="p-4 w-full">
                                    <h3 className="text-white font-semibold truncate">
                                        {post.title}
                                    </h3>
                                </div>
                            </div>
                            
                            {/* 뱃지 */}
                            {post.badge && (
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="badge badge-primary">{post.badge}</span>
                                </div>
                            )}

                            {/* Copy Prompt 버튼 */}
                            <button
                                onClick={() => handleCopyPrompt(post.prompt)}
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
                ))}
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
            />
        </>
    );
};

export default BoardGrid;