// 다른 사용자가 확인할 수 있는 공개된 profile page
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader, User } from 'lucide-react';
import { userService, postService } from '@/utils/apiService';
import { API_BASE_URL } from '@/utils/apiService';

const PublicProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState({});
    
    // 이미지 URL 처리 함수
    const getImageUrl = (post) => {
        // 이미지 필드가 다양한 이름으로 존재할 수 있음
        const imageField = post.imageUrl || post.image_url || post.image || '';
        
        // 이미지가 없는 경우
        if (!imageField) {
            // 게시물 내용 기반 더미 이미지 생성
            const content = post?.prompt || post?.title || post?.content || '';
            const encodedContent = encodeURIComponent(content.trim() || 'image');
            return `https://source.unsplash.com/300x300/?${encodedContent}`;
        }
        
        // 이미 완전한 URL인 경우
        if (imageField.startsWith('http')) {
            return imageField;
        }
        
        // 상대 경로인 경우 API_BASE_URL과 결합
        return `${API_BASE_URL}${imageField}`;
    };
    
    useEffect(() => {
        // 사용자 데이터 가져오기
        const fetchUserData = async () => {
            try {
                console.log('사용자 ID:', id);
                
                // API를 통해 사용자 정보 가져오기
                const userData = await userService.getUserById(id);
                console.log('가져온 사용자 정보:', userData);
                
                if (userData) {
                    setUser(userData);
                    
                    // 해당 사용자의 게시물 가져오기
                    try {
                        // 특정 사용자의 게시물을 가져오는 API 호출
                        // 백엔드에 해당 API가 없다면 전체 게시물에서 필터링
                        const allPosts = await postService.getAllPosts();
                        console.log('모든 게시물:', allPosts);
                        
                        // 응답 형식에 따라 게시물 배열 추출
                        let postsArray = [];
                        if (allPosts.results && Array.isArray(allPosts.results)) {
                            postsArray = allPosts.results;
                        } else if (Array.isArray(allPosts)) {
                            postsArray = allPosts;
                        }
                        
                        // 사용자 ID로 게시물 필터링
                        const userPosts = postsArray.filter(post => {
                            // 게시물의 사용자 ID 필드가 다양할 수 있음
                            const postUserId = post.user_id || post.userId || 
                                              (post.user && post.user.id) || 
                                              (post.author && post.author.id);
                            
                            console.log('게시물 사용자 ID 비교:', {
                                postId: post.id,
                                postUserId: postUserId,
                                targetUserId: id
                            });
                            
                            return postUserId === id;
                        });
                        
                        console.log('필터링된 사용자 게시물:', userPosts);
                        setPosts(userPosts);
                    } catch (error) {
                        console.error('사용자 게시물을 가져오는 중 오류 발생:', error);
                        setPosts([]);
                    }
                }
            } catch (error) {
                console.error('사용자 정보를 가져오는 중 오류 발생:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [id]);
    
    // 이미지 로드 핸들러
    const handleImageLoad = (id) => {
        setImageLoaded(prev => ({ ...prev, [id]: true }));
    };
    
    // 이미지 로드 실패 핸들러
    const handleImageError = (id) => {
        setImageLoaded(prev => ({ ...prev, [id]: true }));
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="animate-spin" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-base-200 rounded-lg p-6 mb-8 text-center">
                    <h1 className="text-2xl font-bold mb-2">사용자를 찾을 수 없습니다</h1>
                    <p>요청하신 사용자 정보가 존재하지 않습니다.</p>
                    <Link to="/" className="btn btn-primary mt-4">홈으로 돌아가기</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 프로필 정보 */}
            <div className="bg-base-200 rounded-lg p-6 mb-8 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden">
                    {user.profile_image || user.profileImage ? (
                        <img 
                            src={user.profile_image || user.profileImage}
                            alt={user.username || user.displayName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100/9370DB/FFFFFF?text=U';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User size={32} className="text-primary" />
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-2">{user.username || user.displayName}</h1>
                    {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                    <div className="text-sm mt-2">
                        <span className="font-bold">{posts.length}</span> 작품
                    </div>
                </div>
            </div>

            {/* 사용자의 작품들 */}
            <div>
                <h2 className="text-xl font-bold mb-4">작품 목록</h2>
                {posts.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">작품이 없습니다</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {posts.map(post => (
                            <Link 
                                key={post.id}
                                to={`/posts/${post.id}`}
                                className="aspect-square bg-base-300 rounded-lg overflow-hidden hover:opacity-80 transition-opacity relative"
                            >
                                {!imageLoaded[post.id] && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader className="animate-spin" />
                                    </div>
                                )}
                                <img 
                                    src={getImageUrl(post)}
                                    alt={post.title || post.prompt || '이미지'}
                                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                                        imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    onLoad={() => handleImageLoad(post.id)}
                                    onError={(e) => {
                                        handleImageError(post.id);
                                        e.target.src = 'https://placehold.co/600x400/9370DB/FFFFFF?text=Image+Not+Found';
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <span className="text-white font-medium">{post.title || post.prompt || '제목 없음'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;