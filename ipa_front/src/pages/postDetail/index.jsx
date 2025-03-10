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
import { postService } from '@/utils/apiService';
import { API_BASE_URL } from '@/utils/apiService';

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

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 게시물 데이터 가져오기
    useEffect(() => {
        const fetchPost = async () => {
            try {
                const foundPost = await postService.getPostById(id);
                console.log('게시물 상세 데이터 (원본):', foundPost);
                
                // 백엔드 응답 구조에 맞게 데이터 매핑
                if (foundPost) {
                    const mappedPost = {
                        ...foundPost,
                        // 이미지 URL이 상대 경로인 경우 전체 URL로 변환
                        imageUrl: foundPost.image 
                            ? foundPost.image.startsWith('http') 
                                ? foundPost.image 
                                : `${API_BASE_URL}${foundPost.image}`
                            : null,
                        fileUrl: foundPost.file 
                            ? foundPost.file.startsWith('http')
                                ? foundPost.file
                                : `${API_BASE_URL}${foundPost.file}`
                            : null,
                        prompt: foundPost.content,
                        userId: foundPost.author?.id,
                        username: foundPost.author?.username,
                        userProfileImage: foundPost.author?.profile_image 
                            ? foundPost.author.profile_image.startsWith('http')
                                ? foundPost.author.profile_image
                                : `${API_BASE_URL}${foundPost.author.profile_image}`
                            : 'https://placehold.co/100x100/9370DB/FFFFFF?text=U',
                        createdAt: foundPost.created_at,
                        updatedAt: foundPost.updated_at,
                        tags: Array.isArray(foundPost.tags) 
                            ? foundPost.tags.flatMap(tag => {
                                // 태그 객체에서 name 속성이 JSON 문자열인 경우
                                if (typeof tag === 'object' && tag !== null && tag.name) {
                                    try {
                                        // JSON 문자열을 파싱
                                        const parsedTags = JSON.parse(tag.name);
                                        // 배열인 경우 모든 요소를 반환
                                        if (Array.isArray(parsedTags)) {
                                            return parsedTags;
                                        }
                                        // 배열이 아닌 경우 단일 태그로 처리
                                        return [tag.name];
                                    } catch {
                                        // JSON 파싱 실패시 원래 이름을 사용
                                        return [tag.name];
                                    }
                                }
                                // 문자열인 경우 그대로 사용
                                return [tag];
                            }).filter(tag => tag !== '')
                            : []
                    };
                    console.log('매핑된 게시물 데이터:', mappedPost);
                    setPost(mappedPost);
                }
            } catch (error) {
                console.error('게시물을 가져오는 중 오류 발생:', error);
                toast.error('게시물을 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
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
        
        const fetchAllPosts = async () => {
            try {
                const response = await postService.getAllPosts();
                
                // 응답 형식 확인
                let allPosts = [];
                if (response && response.results && Array.isArray(response.results)) {
                    allPosts = response.results;
                } else if (Array.isArray(response)) {
                    allPosts = response;
                } else {
                    console.warn('getAllPosts 응답이 예상 형식이 아닙니다:', response);
                    return;
                }
                
                if (allPosts.length === 0) {
                    console.log('게시물이 없습니다.');
                    return;
                }
                
                console.log('모든 게시물:', allPosts);
                
                // id가 문자열인지 숫자인지 확인하여 비교
                const postId = typeof id === 'string' ? id : id.toString();
                const currentIndex = allPosts.findIndex(p => 
                    (p.id && p.id.toString() === postId)
                );
                
                console.log('현재 게시물 인덱스:', currentIndex, '현재 ID:', postId);
                
                if (currentIndex > 0) {
                    setPrevPostId(allPosts[currentIndex - 1].id);
                }
                
                if (currentIndex !== -1 && currentIndex < allPosts.length - 1) {
                    setNextPostId(allPosts[currentIndex + 1].id);
                }
            } catch (error) {
                console.error('이전/다음 게시물을 가져오는 중 오류 발생:', error);
            }
        };
        
        fetchAllPosts();
    }, [id]);
    
    // 북마크 상태 확인
    useEffect(() => {
        if (post) {
            setIsBookmarked(post.is_bookmarked || false);
        }
    }, [post]);
    
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
    const handleCopyPrompt = async (content) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success('내용이 클립보드에 복사되었습니다.');
            
            // 3초 후 복사 상태 초기화
            setTimeout(() => setCopied(false), 3000);
        } catch (error) {
            console.error('클립보드 복사 오류:', error);
            toast.error('클립보드 복사에 실패했습니다.');
        }
    };
    
    // 북마크 기능
    const handleBookmark = async () => {
        try {
            await postService.toggleBookmark(id);
            setIsBookmarked(!isBookmarked);
            toast.success(isBookmarked ? '북마크가 해제되었습니다.' : '북마크에 추가되었습니다.');
        } catch (error) {
            console.error('북마크 처리 중 오류:', error);
            toast.error('북마크 처리에 실패했습니다.');
        }
    };
    
    // 공유 기능
    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: post.title || '멋진 AI 이미지',
                    text: `${post.username}님의 게시물 - "${post.content?.substring(0, 50)}${post.content?.length > 50 ? '...' : ''}"`,
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
            const url = post.imageUrl || post.fileUrl;
            if (!url) {
                toast.error('다운로드할 파일이 없습니다.');
                return;
            }

            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            // 파일명 결정 (이미지인 경우 .png, 파일인 경우 원래 확장자 유지)
            const originalPath = post.image || post.file || '';
            const extension = originalPath.split('.').pop() || 'png';
            a.download = `${post.title || 'download'}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('파일이 다운로드되었습니다.');
        } catch (err) {
            console.error('다운로드 오류:', err);
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
                            {post.imageUrl ? (
                                <img 
                                    src={post.imageUrl}
                                    alt={post.prompt || '생성된 이미지'}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setShowFullscreenImage(true)}
                                    onError={(e) => {
                                        console.error('이미지 로드 실패:', post.imageUrl);
                                        e.target.src = 'https://placehold.co/600x400/9370DB/FFFFFF?text=Image+Not+Found';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-base-200">
                                    <span className="text-base-content/50">이미지를 찾을 수 없습니다</span>
                                </div>
                            )}
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-base-content/60">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {/* New 뱃지 - 오늘 업로드된 게시물에만 표시 */}
                            {isToday(post.createdAt) && (
                                <span className="badge badge-secondary font-bold">NEW</span>
                            )}
                        </div>
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
                        <h3 className="text-sm font-medium mb-2">내용</h3>
                        <div className="bg-base-300 p-3 rounded-lg relative group">
                            <p className="text-sm whitespace-pre-wrap pr-8">{post.content}</p>
                            <button 
                                onClick={() => handleCopyPrompt(post.content)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-50 hover:opacity-100 hover:bg-base-100 transition-opacity"
                                title="내용 복사"
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
                                
                            </div>
                        </div>
                    </div>
                    
                    {/* 태그 정보 */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mb-4">
                            <div className="flex items-center gap-1 mb-2">
                                <Tag size={14} />
                                <h3 className="text-sm font-medium">태그</h3>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {post.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="badge badge-ghost text-xs select-none"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
                                        <span>{typeof post.model === 'object' ? post.model.name : post.model}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">버전: </span>
                                        <span>{post.modelVersion}</span>
                                    </div>
                                </div>
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