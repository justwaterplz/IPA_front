/**
 * 로컬 스토리지를 활용한 임시 데이터베이스 유틸리티
 * 백엔드 API가 구축되기 전 프론트엔드 개발 및 테스트용으로 사용
 */

// 컬렉션 이름 상수
const COLLECTIONS = {
  USERS: 'ipa_users',
  POSTS: 'ipa_posts',
  AUTH: 'ipa_auth'
};

// 초기 데이터 설정 (앱 처음 실행 시)
const initializeLocalDB = () => {
  // 사용자 컬렉션이 없으면 생성
  if (!localStorage.getItem(COLLECTIONS.USERS)) {
    localStorage.setItem(COLLECTIONS.USERS, JSON.stringify([
      {
        id: 'admin123',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123', // 실제로는 해시 처리해야 함
        profileImage: 'https://placehold.co/100x100/4682B4/FFFFFF?text=Admin',
        isAdmin: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'user123',
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123', // 실제로는 해시 처리해야 함
        profileImage: 'https://placehold.co/100x100/9370DB/FFFFFF?text=User',
        isAdmin: false,
        createdAt: new Date().toISOString()
      }
    ]));
  }

  // 게시물 컬렉션이 없으면 생성
  if (!localStorage.getItem(COLLECTIONS.POSTS)) {
    localStorage.setItem(COLLECTIONS.POSTS, JSON.stringify([
      {
        id: '1',
        userId: 'user123',
        username: 'testuser',
        userProfileImage: 'https://placehold.co/100x100/9370DB/FFFFFF?text=User',
        imageUrl: 'https://placehold.co/600x600/9370DB/FFFFFF?text=Space+Cat',
        prompt: 'A cat floating in space with stars around',
        model: 'Midjourney',
        modelVersion: 'v5.0',
        tags: ['space', '우주', 'cat', '고양이'],
        createdAt: new Date().toISOString(),
        likes: 15
      },
      {
        id: '2',
        userId: 'admin123',
        username: 'admin',
        userProfileImage: 'https://placehold.co/100x100/4682B4/FFFFFF?text=Admin',
        imageUrl: 'https://placehold.co/600x600/4682B4/FFFFFF?text=Future+City',
        prompt: 'A futuristic city with flying cars and tall buildings',
        model: 'DALL-E',
        modelVersion: 'DALL-E 3',
        tags: ['city', '도시', 'future', '미래'],
        createdAt: new Date().toISOString(),
        likes: 8
      }
    ]));
  }

  // 인증 정보가 없으면 생성 (로그아웃 상태로 초기화)
  if (!localStorage.getItem(COLLECTIONS.AUTH)) {
    localStorage.setItem(COLLECTIONS.AUTH, JSON.stringify({
      isAuthenticated: false,
      currentUser: null
    }));
  }
};

// 사용자 관련 함수
const userService = {
  // 사용자 등록 (회원가입)
  register: (userData) => {
    const users = JSON.parse(localStorage.getItem(COLLECTIONS.USERS) || '[]');
    
    // 이메일 중복 확인
    if (users.some(user => user.email === userData.email)) {
      throw new Error('이미 등록된 이메일입니다.');
    }
    
    // 사용자명 중복 확인
    if (users.some(user => user.username === userData.username)) {
      throw new Error('이미 사용 중인 사용자명입니다.');
    }
    
    // 새 사용자 생성
    const newUser = {
      id: 'user_' + Date.now(),
      ...userData,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    // 사용자 추가
    users.push(newUser);
    localStorage.setItem(COLLECTIONS.USERS, JSON.stringify(users));
    
    // 비밀번호 제외한 사용자 정보 반환
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
  
  // 로그인
  login: (email, password) => {
    const users = JSON.parse(localStorage.getItem(COLLECTIONS.USERS) || '[]');
    const user = users.find(user => user.email === email && user.password === password);
    
    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    
    // 인증 정보 업데이트
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(COLLECTIONS.AUTH, JSON.stringify({
      isAuthenticated: true,
      currentUser: userWithoutPassword
    }));
    
    return userWithoutPassword;
  },
  
  // 로그아웃
  logout: () => {
    localStorage.setItem(COLLECTIONS.AUTH, JSON.stringify({
      isAuthenticated: false,
      currentUser: null
    }));
  },
  
  // 현재 인증 상태 확인
  getCurrentAuth: () => {
    return JSON.parse(localStorage.getItem(COLLECTIONS.AUTH) || '{"isAuthenticated":false,"currentUser":null}');
  },
  
  // 사용자 정보 가져오기
  getUserById: (userId) => {
    const users = JSON.parse(localStorage.getItem(COLLECTIONS.USERS) || '[]');
    const user = users.find(user => user.id === userId);
    
    if (!user) return null;
    
    // 비밀번호 제외한 사용자 정보 반환
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

// 게시물 관련 함수
const postService = {
  // 게시물 생성
  createPost: (postData) => {
    const auth = JSON.parse(localStorage.getItem(COLLECTIONS.AUTH) || '{"isAuthenticated":false}');
    if (!auth.isAuthenticated) {
      throw new Error('로그인이 필요합니다.');
    }
    
    const posts = JSON.parse(localStorage.getItem(COLLECTIONS.POSTS) || '[]');
    const newPost = {
      id: 'post_' + Date.now(),
      userId: auth.currentUser.id,
      username: auth.currentUser.username,
      userProfileImage: auth.currentUser.profileImage,
      ...postData,
      createdAt: new Date().toISOString(),
      likes: 0
    };
    
    posts.push(newPost);
    localStorage.setItem(COLLECTIONS.POSTS, JSON.stringify(posts));
    
    return newPost;
  },
  
  // 모든 게시물 가져오기
  getAllPosts: () => {
    return JSON.parse(localStorage.getItem(COLLECTIONS.POSTS) || '[]');
  },
  
  // 특정 게시물 가져오기
  getPostById: (postId) => {
    const posts = JSON.parse(localStorage.getItem(COLLECTIONS.POSTS) || '[]');
    return posts.find(post => post.id === postId) || null;
  },
  
  // 사용자별 게시물 가져오기
  getPostsByUserId: (userId) => {
    const posts = JSON.parse(localStorage.getItem(COLLECTIONS.POSTS) || '[]');
    return posts.filter(post => post.userId === userId);
  },
  
  // 게시물 검색
  searchPosts: (params) => {
    const posts = JSON.parse(localStorage.getItem(COLLECTIONS.POSTS) || '[]');
    
    // 검색 조건이 없으면 모든 게시물 반환
    if (!params || Object.keys(params).length === 0) {
      return posts;
    }
    
    return posts.filter(post => {
      // 프롬프트 검색
      if (params.query && params.target === 'prompt') {
        return post.prompt.toLowerCase().includes(params.query.toLowerCase());
      }
      
      // 작성자 검색
      if (params.query && params.target === 'author') {
        return post.username.toLowerCase().includes(params.query.toLowerCase());
      }
      
      // 모델 검색
      if (params.query && params.target === 'model') {
        return post.model.toLowerCase().includes(params.query.toLowerCase()) || 
               post.modelVersion.toLowerCase().includes(params.query.toLowerCase());
      }
      
      // 날짜 검색
      if (params.date && params.target === 'date') {
        const postDate = new Date(post.createdAt).toISOString().split('T')[0];
        return postDate === params.date;
      }
      
      // 태그 검색
      if (params.query && params.target === 'tag') {
        return post.tags.some(tag => 
          tag.toLowerCase().includes(params.query.toLowerCase())
        );
      }
      
      return true;
    });
  }
};

// 초기화 함수 실행
initializeLocalDB();

export { userService, postService, COLLECTIONS }; 