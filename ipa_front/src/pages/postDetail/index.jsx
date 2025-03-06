import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { 
  ClipboardCopy, 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Info,
  Download,
  ChevronLeft,
  ChevronRight,
  Tag,
  Maximize
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import { postService } from '@/utils/localStorageDB';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 게시물 데이터 가져오기
    useEffect(() => {
        const fetchPost = () => {
            const foundPost = postService.getPostById(id);
            setPost(foundPost);
            setLoading(false);
        };
        
        fetchPost();
    }, [id]);
    
    // States
    const [copied, setCopied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showAIInfo, setShowAIInfo] = useState(true);
    const [showFullscreenImage, setShowFullscreenImage] = useState(false);
    
    // 이전/다음 포스트 ID 가져오기
    const [prevPostId, setPrevPostId] = useState(null);
    const [nextPostId, setNextPostId] = useState(null);
    
    // 이전/다음 포스트 ID 계산
    useEffect(() => {
        if (!id) return;
        
        const allPosts = postService.getAllPosts();
        const currentIndex = allPosts.findIndex(p => p.id === id);
        
        if (currentIndex > 0) {
            setPrevPostId(allPosts[currentIndex - 1].id);
        }
        
        if (currentIndex < allPosts.length - 1) {
            setNextPostId(allPosts[currentIndex + 1].id);
        }
    }, [id]);
    
    // 로딩 중일 때
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }
    
    // post가 없는 경우 더 친절한 에러 처리
    if (!post) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">게시물을 찾을 수 없습니다</h1>
                <Link to="/" className="text-primary hover:underline">
                    게시물 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    // 복사 기능
    const handleCopyPrompt = async (prompt) => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('프롬프트가 복사되었습니다!');
        } catch (err) {
            toast.error('프롬프트 복사에 실패했습니다.');
        }
    };
    
    // 북마크 기능
    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        toast.success(isBookmarked ? '북마크가 해제되었습니다.' : '북마크에 추가되었습니다.');
        // 여기에 실제 북마크 API 호출 코드 추가
    };
    
    // 공유 기능
    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: post.prompt || '멋진 AI 이미지',
                    text: `${post.author.displayName}님의 AI 이미지 - "${post.prompt.substring(0, 50)}${post.prompt.length > 50 ? '...' : ''}"`,
                    url: url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('URL이 클립보드에 복사되었습니다!');
            }
        } catch (err) {
            toast.error('공유하는 중 오류가 발생했습니다.');
            console.error('공유 오류:', err);
        }
    };
    
    // 이미지 다운로드 기능
    const handleDownload = async () => {
        try {
            const response = await fetch(post.imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${post.prompt.substring(0, 20) || 'ai-image'}-${post.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('이미지가 다운로드되었습니다.');
        } catch (err) {
            toast.error('다운로드 중 오류가 발생했습니다.');
        }
    };
    
    // 이전/다음 포스트로 이동
    const goToPrevPost = () => {
        if (prevPostId) {
            navigate(`/posts/${prevPostId}`);
        }
    };
    
    const goToNextPost = () => {
        if (nextPostId) {
            navigate(`/posts/${nextPostId}`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* 이전/다음 포스트 네비게이션 */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={goToPrevPost} 
                    className="btn btn-ghost btn-sm gap-1"
                    disabled={!prevPostId}
                >
                    <ChevronLeft size={16} />
                    <span>이전</span>
                </button>
                
                <Link 
                    to="/"
                    className="btn btn-ghost btn-sm gap-1"
                    title="모든 게시물 보기"
                >
                    <span>모든 게시물</span>
                </Link>
                
                <button 
                    onClick={goToNextPost} 
                    className="btn btn-ghost btn-sm gap-1"
                    disabled={!nextPostId}
                >
                    <span>다음</span>
                    <ChevronRight size={16} />
                </button>
            </div>
            
            <div className="flex gap-6 bg-base-200 rounded-lg overflow-hidden shadow-lg mt-14">
                {/* 왼쪽: 이미지 섹션 */}
                <div className="w-1/2">
                    <div className="relative">
                        <div className="aspect-square bg-base-300 overflow-hidden">
                            <img 
                                src={post.imageUrl}
                                alt={post.prompt || '생성된 이미지'}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setShowFullscreenImage(true)}
                            />
                        </div>
                        
                        {/* 이미지 액션 버튼들 (오버레이) */}
                        <div className="absolute top-3 right-3 flex gap-2">
                            <button 
                                onClick={() => setShowFullscreenImage(true)}
                                className="btn btn-circle btn-sm bg-base-100 bg-opacity-70 hover:bg-opacity-100"
                                title="이미지 확대"
                            >
                                <Maximize size={16} />
                            </button>
                            <button 
                                onClick={handleDownload}
                                className="btn btn-circle btn-sm bg-base-100 bg-opacity-70 hover:bg-opacity-100"
                                title="이미지 다운로드"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 정보 섹션 */}
                <div className="w-1/2 p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {/* 작성자 정보 */}
                    <div className="flex items-center space-x-3 mb-4">
                        <Link to={`/users/${post.userId}`} className="flex items-center space-x-3 hover:underline">
                            <img 
                                src={post.userProfileImage}
                                alt={post.username}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                            <span className="font-medium text-base-content">{post.username}</span>
                        </Link>
                        <span className="text-sm text-base-content/60">
                            {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    
                    {/* 액션 버튼들 */}
                    <div className="flex gap-1">
                        <button 
                            onClick={handleBookmark} 
                            className={`btn btn-ghost btn-sm ${isBookmarked ? 'text-primary' : ''}`}
                            title={isBookmarked ? '북마크 해제' : '북마크 추가'}
                        >
                            {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                        <button 
                            onClick={handleShare}
                            className="btn btn-ghost btn-sm"
                            title="공유하기"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>

                    {/* 프롬프트 */}
                    <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">프롬프트</h3>
                        <div className="bg-base-300 p-3 rounded-lg relative group">
                            <p className="text-sm whitespace-pre-wrap pr-8">{post.prompt}</p>
                            <button 
                                onClick={() => handleCopyPrompt(post.prompt)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-50 hover:opacity-100 hover:bg-base-100 transition-opacity"
                                title="프롬프트 복사"
                            >
                                <ClipboardCopy size={14} />
                            </button>
                        </div>
                    </div>
                    
                    {/* 이미지 정보 */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium">이미지 정보</h3>
                        </div>
                        <div className="bg-base-300 p-3 rounded-lg">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div>
                                    <span className="font-medium">생성 날짜: </span>
                                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="font-medium">좋아요: </span>
                                    <span>{post.likes || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* AI 모델 정보 */}
                    {post.model && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-medium">AI 모델 정보</h3>
                                <button 
                                    onClick={() => setShowAIInfo(!showAIInfo)}
                                    className="btn btn-ghost btn-xs"
                                    title={showAIInfo ? "정보 접기" : "정보 펼치기"}
                                >
                                    <Info size={14} />
                                </button>
                            </div>
                            <div className={`bg-base-300 p-3 rounded-lg transition-all duration-200 ${showAIInfo ? 'block' : 'hidden'}`}>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                    <div>
                                        <span className="font-medium">모델: </span>
                                        <span>{post.model}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">버전: </span>
                                        <span>{post.modelVersion}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 태그 정보 */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-1 mb-2">
                                <Tag size={14} />
                                <h3 className="text-sm font-medium">태그</h3>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {post.tags.map(tag => (
                                    <Link 
                                        key={tag}
                                        to={`/search?query=${tag}&target=tag`}
                                        className="badge badge-primary badge-outline text-xs"
                                    >
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 전체화면 이미지 모달 */}
            {showFullscreenImage && (
                <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
                     onClick={() => setShowFullscreenImage(false)}>
                    <div className="relative max-h-screen max-w-screen-lg">
                        <img 
                            src={post.imageUrl} 
                            alt={post.prompt || '이미지 확대보기'} 
                            className="max-h-screen max-w-full object-contain"
                        />
                        <button 
                            className="absolute top-4 right-4 btn btn-circle btn-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFullscreenImage(false);
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

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
        </div>
    );
};

export default PostDetail;