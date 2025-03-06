// 다른 사용자가 확인할 수 있는 공개된 profile page
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDummyUser, getUserPosts } from '@/data/dummyData';
import { Loader } from 'lucide-react';

const PublicProfile = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState({});
    
    useEffect(() => {
        // 사용자 데이터 가져오기
        const userData = getDummyUser(id);
        const userPosts = getUserPosts(id);
        
        if (userData) {
            setUser(userData);
            setPosts(userPosts);
        }
        
        setLoading(false);
    }, [id]);
    
    // 이미지 로드 핸들러
    const handleImageLoad = (id) => {
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
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 프로필 정보 */}
            <div className="bg-base-200 rounded-lg p-6 mb-8 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden">
                    <img 
                        src={user.avatar} 
                        alt={user.displayName} 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold mb-2">{user.displayName}</h1>
                    <p className="text-sm text-gray-500">@{user.username}</p>
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
                                    src={post.image}
                                    alt={post.title}
                                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                                        imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                                    }`}
                                    onLoad={() => handleImageLoad(post.id)}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <span className="text-white font-medium">{post.title}</span>
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