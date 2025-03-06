// 고정된 사용자 5명 정의
const DUMMY_USERS = [
  {
    id: '1',
    username: 'user1',
    displayName: '김민수',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
  },
  {
    id: '2',
    username: 'user2',
    displayName: '이지연',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
  },
  {
    id: '3',
    username: 'user3',
    displayName: '박준호',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
  },
  {
    id: '4',
    username: 'user4',
    displayName: '최수진',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
  },
  {
    id: '5',
    username: 'user5',
    displayName: '정우진',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
  }
];

// 40개의 게시물 생성 및 5명의 사용자에게 균등하게 분배
const DUMMY_POSTS = Array(40).fill(null).map((_, index) => {
    // 게시물을 사용자에게 균등하게 분배 (0~7: user1, 8~15: user2, ...)
    const userIndex = Math.floor(index / 8);
    const user = DUMMY_USERS[userIndex];
    
    // 생성일 - 최근 게시물부터 과거 순으로 정렬
    const daysPast = index % 8; // 같은 사용자 내에서는 시간 차이를 둠
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - (userIndex * 10 + daysPast));

    return {
        id: `${index + 1}`,
        title: `작품 ${index + 1}`,
        prompt: `This is a sample prompt for post ${index + 1}. It demonstrates what a typical prompt might look like.`,
        image: `https://picsum.photos/seed/${index + 1}/400/400`,
        author: user,
        userId: user.id, // 사용자 ID 추가
        createdAt: createdDate.toLocaleDateString(),
        createdTimeAgo: getTimeAgo(createdDate),
        likes: Math.floor(Math.random() * 100),
        commentCount: Math.floor(Math.random() * 50),
        
        // 이미지 정보
        imageWidth: 1024,
        imageHeight: 1024,
        fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        fileFormat: 'PNG',
        
        // AI 모델 정보
        aiModel: ['Midjourney', 'DALL-E 3', 'Stable Diffusion XL'][Math.floor(Math.random() * 3)],
        negativePrompt: index % 3 === 0 ? 'low quality, bad anatomy, blurry, pixelated, watermark' : null,
        settings: {
            'CFG Scale': (Math.random() * 10 + 5).toFixed(1),
            'Steps': Math.floor(Math.random() * 30 + 20),
            'Sampler': ['Euler a', 'DPM++ 2M Karras', 'DPM++ SDE Karras'][Math.floor(Math.random() * 3)]
        },
        
        // 태그
        tags: [
            'portrait', 'landscape', 'abstract', 'scifi', 'fantasy', 
            'cyberpunk', 'nature', 'space', 'architecture', 'character'
        ].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 1)
    };
});

// 상대적 시간 표시를 위한 함수
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    
    if (diffInSeconds < minute) {
        return '방금 전';
    } else if (diffInSeconds < hour) {
        const minutes = Math.floor(diffInSeconds / minute);
        return `${minutes}분 전`;
    } else if (diffInSeconds < day) {
        const hours = Math.floor(diffInSeconds / hour);
        return `${hours}시간 전`;
    } else if (diffInSeconds < week) {
        const days = Math.floor(diffInSeconds / day);
        return `${days}일 전`;
    } else if (diffInSeconds < month) {
        const weeks = Math.floor(diffInSeconds / week);
        return `${weeks}주 전`;
    } else {
        const months = Math.floor(diffInSeconds / month);
        return `${months}개월 전`;
    }
}

export const generateDummyPosts = () => {
    return DUMMY_POSTS;
};

export const getDummyPost = (id) => {
    return DUMMY_POSTS.find(post => post.id === id);
};

// 특정 사용자의 게시물만 가져오기
export const getUserPosts = (userId) => {
    return DUMMY_POSTS.filter(post => post.author.id === userId);
};

// 이전 포스트 ID 가져오기
export const getPrevPostId = (currentId) => {
    const currentIndex = DUMMY_POSTS.findIndex(post => post.id === currentId);
    if (currentIndex <= 0) return null;
    return DUMMY_POSTS[currentIndex - 1].id;
};

// 다음 포스트 ID 가져오기
export const getNextPostId = (currentId) => {
    const currentIndex = DUMMY_POSTS.findIndex(post => post.id === currentId);
    if (currentIndex === -1 || currentIndex >= DUMMY_POSTS.length - 1) return null;
    return DUMMY_POSTS[currentIndex + 1].id;
};

// 관련 포스트 가져오기 (같은 태그 또는 같은 작성자)
export const getRelatedPosts = (currentId, limit = 3) => {
    const currentPost = getDummyPost(currentId);
    if (!currentPost) return [];
    
    // 같은 태그 또는 같은 작성자의 다른 게시물을 찾음
    return DUMMY_POSTS
        .filter(post => post.id !== currentId) // 현재 포스트 제외
        .filter(post => 
            // 같은 작성자의 게시물이거나
            post.author.id === currentPost.author.id ||
            // 같은 태그를 가진 게시물
            (post.tags.some(tag => currentPost.tags.includes(tag)))
        )
        .sort(() => 0.5 - Math.random()) // 랜덤 정렬
        .slice(0, limit); // 지정된 개수만큼 가져오기
};

// 사용자 정보 가져오기
export const getDummyUser = (userId) => {
    return DUMMY_USERS.find(user => user.id === userId);
};

// 모든 사용자 정보 가져오기
export const getAllUsers = () => {
    return DUMMY_USERS;
};