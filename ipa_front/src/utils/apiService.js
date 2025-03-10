/**
 * 백엔드 API와 통신하기 위한 서비스 유틸리티
 */

import axios from 'axios';

// JWT 토큰 디코딩 함수 추가
const decodeJWT = (token) => {
  try {
    // JWT는 header.payload.signature 형식으로 구성됨
    // payload 부분만 추출하여 디코딩
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 토큰 디코딩 오류:', error);
    return null;
  }
};

// 테스트 모드 설정 - 전역 상수로 정의
const TEST_MODE = true; // 테스트 모드 활성화/비활성화

// 토큰 만료 시간 확인 함수
const isTokenExpired = (token) => {
  // 테스트 모드에서는 항상 토큰이 유효하다고 처리
  if (TEST_MODE) {
    console.log('테스트 모드: 토큰 만료 검사 건너뛰기');
    return false; // 항상 만료되지 않았다고 반환
  }
  
  const decodedToken = decodeJWT(token);
  if (!decodedToken) return true;
  
  // exp 필드는 Unix 타임스탬프(초 단위)로 저장됨
  const expirationTime = decodedToken.exp * 1000; // 밀리초로 변환
  const currentTime = Date.now();
  
  console.log('토큰 만료 시간:', new Date(expirationTime).toLocaleString());
  console.log('현재 시간:', new Date(currentTime).toLocaleString());
  console.log('남은 시간(분):', Math.round((expirationTime - currentTime) / 60000));
  
  return currentTime >= expirationTime;
};

// API 기본 설정
// Vite 환경변수에서 API 기본 URL 가져오기
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 인증 토큰 추가
api.interceptors.request.use(
  (config) => {
    console.log('API 요청:', config.method.toUpperCase(), config.url);
    
    // 백엔드에서 JWT 토큰 없이 모든 기능을 사용 가능하게 열어놓았다면
    // 토큰 관련 코드를 주석 처리하거나 조건부로 적용할 수 있습니다
    
    // 테스트 모드에서는 토큰 인증을 건너뛰기
    const skipAuth = TEST_MODE; // 테스트 모드와 일치시킴
    
    if (!skipAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // 토큰 만료 여부 확인 (테스트 모드에서는 실행되지 않음)
        if (!TEST_MODE && isTokenExpired(token)) {
          console.warn('토큰이 만료되었습니다. 로그아웃 처리합니다.');
          localStorage.removeItem('auth_token');
          
          // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          // 요청 취소
          throw new axios.Cancel('토큰이 만료되어 요청이 취소되었습니다.');
        }
        
        console.log('인증 토큰 사용:', token.substring(0, 10) + '...');
        // Bearer 접두사를 사용하는 JWT 인증 방식
        config.headers['Authorization'] = `Bearer ${token}`;
        
        // 디버깅을 위해 헤더 정보 출력
        console.log('요청 헤더:', config.headers);
      } else {
        console.warn('인증 토큰이 없습니다. 인증이 필요한 요청은 실패할 수 있습니다.');
      }
    } else {
      console.log('테스트 모드: 토큰 인증 건너뛰기');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 응답 로깅
api.interceptors.response.use(
  (response) => {
    console.log('API 응답 성공:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API 응답 오류:', error.config?.url, error.response?.status);
    
    // 테스트 모드에서는 401 에러 처리 비활성화
    // 테스트 모드가 아닐 때만 401 에러 처리
    if (!TEST_MODE && error.response && error.response.status === 401) {
      console.warn('인증 토큰이 만료되었거나 유효하지 않습니다. 로그아웃 처리합니다.');
      // 로컬 스토리지에서 토큰 제거
      localStorage.removeItem('auth_token');
      
      // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
      if (!window.location.pathname.includes('/login')) {
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
      }
    } else if (TEST_MODE && error.response && error.response.status === 401) {
      console.warn('테스트 모드: 401 인증 오류 무시');
    }
    
    return Promise.reject(error);
  }
);

// 개발 모드에서 더미 데이터 사용 여부
const USE_DUMMY_DATA = false; // 백엔드 연동이 완료되면 false로 변경

// 더미 데이터
const DUMMY_DATA = {
  posts: [
    {
      id: '1',
      title: '테스트 게시물 1',
      content: '이것은 테스트 게시물 1입니다.',
      image_url: 'https://placehold.co/600x400/9370DB/FFFFFF?text=Test+Image+1',
      user: {
        id: '1',
        username: 'testuser',
        profile_image: 'https://placehold.co/100x100/9370DB/FFFFFF?text=T'
      },
      created_at: new Date().toISOString(),
      tags: ['테스트', 'test'],
      likes_count: 5,
      is_bookmarked: false
    },
    {
      id: '2',
      title: '테스트 게시물 2',
      content: '이것은 테스트 게시물 2입니다.',
      image_url: 'https://placehold.co/600x400/4682B4/FFFFFF?text=Test+Image+2',
      user: {
        id: '2',
        username: 'admin',
        profile_image: 'https://placehold.co/100x100/4682B4/FFFFFF?text=A'
      },
      created_at: new Date().toISOString(),
      tags: ['테스트', 'admin'],
      likes_count: 10,
      is_bookmarked: true
    }
  ],
  users: [
    {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      profile_image: 'https://placehold.co/100x100/9370DB/FFFFFF?text=T'
    },
    {
      id: '2',
      username: 'admin',
      email: 'admin@example.com',
      profile_image: 'https://placehold.co/100x100/4682B4/FFFFFF?text=A'
    }
  ]
};

// 사용자 관련 API 서비스
const userService = {
  // 회원가입
  register: async (userData) => {
    try {
      console.log('회원가입 요청 데이터:', userData);
      // Swagger 문서에 표시된 회원가입 엔드포인트 사용
      const response = await api.post('/api/users/', userData);
      console.log('회원가입 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('회원가입 오류 상세:', error);
      console.error('응답 데이터:', error.response?.data);
      console.error('응답 상태:', error.response?.status);
      
      // 오류 메시지 생성
      let errorMessage = '회원가입 중 오류가 발생했습니다.';
      
      // 백엔드에서 반환한 오류 메시지가 있는 경우
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          // 필드별 오류 메시지가 있는 경우
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(error.response.data)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`);
            } else {
              fieldErrors.push(`${field}: ${errors}`);
            }
          }
          
          if (fieldErrors.length > 0) {
            errorMessage = `회원가입 중 다음 오류가 발생했습니다: ${fieldErrors.join('; ')}`;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
  },
  
  // 로그인
  login: async (email, password) => {
    try {
      console.log('로그인 요청 데이터:', { email, password });
      
      // 이메일과 비밀번호로 로그인
      const response = await api.post('/api/users/login/', { 
        email, 
        password 
      });
      
      console.log('로그인 응답:', response.data);
      
      // 토큰 저장 - 백엔드 응답 형식에 따라 토큰 필드 이름이 다를 수 있음
      // 가능한 토큰 필드 이름: token, access_token, jwt, auth_token 등
      const token = response.data.token || response.data.access_token || response.data.jwt;
      if (token) {
        console.log('토큰 저장:', token);
        
        // 토큰 디코딩 및 만료 시간 확인
        const decodedToken = decodeJWT(token);
        if (decodedToken) {
          console.log('디코딩된 토큰:', decodedToken);
          
          if (decodedToken.exp) {
            const expirationTime = new Date(decodedToken.exp * 1000);
            console.log('토큰 만료 시간:', expirationTime.toLocaleString());
            
            // 현재 시간과 만료 시간의 차이(분)
            const minutesUntilExpiration = Math.round((expirationTime - Date.now()) / 60000);
            console.log(`토큰 만료까지 남은 시간: ${minutesUntilExpiration}분`);
          }
        }
        
        localStorage.setItem('auth_token', token);
      } else {
        console.warn('토큰이 응답에 포함되어 있지 않습니다:', response.data);
      }
      
      // 백엔드 응답 형식에 따라 사용자 정보 반환
      // 응답에 user 객체가 있으면 그대로 반환, 없으면 응답 데이터 자체를 반환
      return response.data.user || response.data;
    } catch (error) {
      console.error('로그인 오류 상세:', error);
      console.error('응답 데이터:', error.response?.data);
      console.error('응답 상태:', error.response?.status);
      
      // 오류 메시지 생성
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      
      // 백엔드에서 반환한 오류 메시지가 있는 경우
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          // 필드별 오류 메시지가 있는 경우
          const fieldErrors = [];
          for (const [field, errors] of Object.entries(error.response.data)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`);
            } else {
              fieldErrors.push(`${field}: ${errors}`);
            }
          }
          
          if (fieldErrors.length > 0) {
            errorMessage = `로그인 중 다음 오류가 발생했습니다: ${fieldErrors.join('; ')}`;
          }
        }
      }
      
      throw new Error(errorMessage);
    }
  },
  
  // 로그아웃
  logout: async () => {
    try {
      // Swagger 문서에 표시된 로그아웃 엔드포인트 사용
      await api.post('/api/users/logout/');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      // 로컬 토큰은 항상 제거
      localStorage.removeItem('auth_token');
    }
  },
  
  // 현재 인증 상태 확인 (토큰 기반)
  getCurrentAuth: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { isAuthenticated: false, currentUser: null };
    }
    
    // 테스트 모드에서는 토큰 만료 확인 건너뛰기
    if (!TEST_MODE) {
      // 토큰 만료 여부 확인
      if (isTokenExpired(token)) {
        console.warn('토큰이 만료되었습니다. 로그아웃 처리합니다.');
        localStorage.removeItem('auth_token');
        return { isAuthenticated: false, currentUser: null };
      }
    } else {
      console.log('테스트 모드: 토큰 만료 확인 건너뛰기');
    }
    
    try {
      // Swagger 문서에 표시된 사용자 정보 조회 엔드포인트 사용
      const response = await api.get('/api/users/me/');
      console.log('현재 사용자 정보 응답:', response.data);
      
      return {
        isAuthenticated: true,
        currentUser: response.data
      };
    } catch (error) {
      console.error('인증 확인 오류 상세:', error);
      console.error('응답 데이터:', error.response?.data);
      console.error('응답 상태:', error.response?.status);
      
      // 테스트 모드에서는 401 오류를 무시하고 인증된 것으로 처리
      if (TEST_MODE && error.response?.status === 401) {
        console.warn('테스트 모드: 401 인증 오류 무시하고 인증된 것으로 처리');
        // 테스트용 더미 사용자 정보 반환
        return {
          isAuthenticated: true,
          currentUser: {
            id: 'test-user-id',
            username: 'testuser',
            email: 'test@example.com',
            profile_image: 'https://placehold.co/100x100/9370DB/FFFFFF?text=T'
          }
        };
      }
      
      // 토큰이 유효하지 않은 경우
      localStorage.removeItem('auth_token');
      return { isAuthenticated: false, currentUser: null };
    }
  },
  
  // 사용자 정보 가져오기
  getUserById: async (userId) => {
    try {
      // Swagger 문서에 표시된 사용자 정보 조회 엔드포인트 사용
      const response = await api.get(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      return null;
    }
  },
  
  // 사용자 정보 수정
  updateUser: async (userId, userData) => {
    try {
      // Swagger 문서에 표시된 사용자 정보 수정 엔드포인트 사용
      const response = await api.patch(`/api/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '사용자 정보 수정 중 오류가 발생했습니다.');
    }
  },
  
  // 사용자 삭제
  deleteUser: async (userId) => {
    try {
      // Swagger 문서에 표시된 사용자 삭제 엔드포인트 사용
      await api.delete(`/api/users/${userId}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '사용자 삭제 중 오류가 발생했습니다.');
    }
  }
};

// 게시물 관련 API 서비스
const postService = {
  // 게시물 목록 가져오기
  getAllPosts: async (tag = null, page = 1) => {
    // 개발 모드에서 더미 데이터 사용
    if (USE_DUMMY_DATA) {
      console.log('개발 모드: 더미 게시물 데이터 사용');
      
      // 태그로 필터링
      let filteredPosts = tag 
        ? DUMMY_DATA.posts.filter(post => post.tags.includes(tag))
        : DUMMY_DATA.posts;
      
      // 페이지네이션 처리
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
      
      // 페이지네이션 형식으로 반환
      return {
        results: paginatedPosts,
        count: filteredPosts.length,
        next: endIndex < filteredPosts.length ? `/api/posts/?page=${page + 1}` : null,
        previous: page > 1 ? `/api/posts/?page=${page - 1}` : null
      };
    }
    
    try {
      // Swagger 문서에 표시된 게시물 목록 조회 엔드포인트 사용
      const params = { page };
      
      if (tag) {
        params.tag = tag;
      }
      
      const response = await api.get('/api/posts/', { params });
      console.log('게시물 목록 응답:', response.data);
      
      // 백엔드 응답 형식에 따라 데이터 처리
      // 페이지네이션 형식: { results: [...], count: 10, next: '...', previous: '...' }
      // 또는 단순 배열: [...]
      if (response.data && Array.isArray(response.data)) {
        // 응답이 배열인 경우
        return { 
          results: response.data,
          count: response.data.length,
          next: null,
          previous: null
        };
      } else if (response.data && response.data.results) {
        // 응답이 페이지네이션 형식인 경우
        return response.data;
      } else {
        // 기타 형식의 응답
        console.warn('예상치 못한 응답 형식:', response.data);
        return { results: [], count: 0, next: null, previous: null };
      }
    } catch (error) {
      console.error('게시물을 가져오는 중 오류 발생:', error);
      
      if (USE_DUMMY_DATA) {
        console.log('오류 발생: 더미 게시물 데이터로 대체');
        return {
          results: DUMMY_DATA.posts,
          count: DUMMY_DATA.posts.length,
          next: null,
          previous: null
        };
      }
      
      return { results: [], count: 0, next: null, previous: null };
    }
  },
  
  // 게시물 생성
  createPost: async (postData) => {
    try {
      console.log('게시물 생성 요청 데이터:', postData);
      
      // FormData인 경우와 일반 객체인 경우를 구분하여 처리
      if (postData instanceof FormData) {
        console.log('FormData 형식으로 게시물 생성 요청');
        // FormData의 모든 항목 로깅
        for (let [key, value] of postData.entries()) {
          console.log(`FormData 항목: ${key}`, value);
        }
        
        const response = await api.post('/api/posts/', postData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('게시물 생성 응답:', response.data);
        console.log('응답 데이터 구조:', Object.keys(response.data));
        
        // 응답에 id가 없으면 게시물 목록에서 찾기
        if (!response.data.id) {
          console.log('응답에 id가 없습니다. 응답 데이터:', response.data);
          const postsResponse = await api.get('/api/posts/');
          const posts = postsResponse.data.results;
          const newPost = posts.find(post => 
            post.title === response.data.title && 
            post.content === response.data.content
          );
          
          if (newPost) {
            console.log('게시물 목록에서 새 게시물을 찾았습니다:', newPost);
            return newPost;
          } else {
            console.log('게시물 목록에서 새 게시물을 찾을 수 없습니다.');
            // 임시 id 생성
            const tempId = Date.now().toString();
            console.log('임시 id를 생성합니다:', tempId);
            return { ...response.data, id: tempId };
          }
        }
        
        return response.data;
      } else {
        // 일반 객체인 경우
        const response = await api.post('/api/posts/', postData);
        return response.data;
      }
    } catch (error) {
      console.error('게시물 생성 중 오류 발생:', error);
      console.error('응답 데이터:', error.response?.data);
      console.error('응답 상태:', error.response?.status);
      
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '게시물 생성 중 오류가 발생했습니다.');
    }
  },
  
  // 특정 게시물 가져오기
  getPostById: async (postId) => {
    // 개발 모드에서 더미 데이터 사용
    if (USE_DUMMY_DATA) {
      console.log('개발 모드: 더미 게시물 상세 데이터 사용');
      const post = DUMMY_DATA.posts.find(p => p.id === postId);
      
      if (post) {
        return post;
      } else {
        console.warn(`ID가 ${postId}인 게시물을 찾을 수 없습니다.`);
        // ID가 없으면 첫 번째 게시물 반환 (테스트용)
        return DUMMY_DATA.posts[0];
      }
    }
    
    try {
      // Swagger 문서에 표시된 게시물 상세 조회 엔드포인트 사용
      console.log('게시물 상세 요청 URL:', `/api/posts/${postId}/`);
      const response = await api.get(`/api/posts/${postId}/`);
      console.log('게시물 상세 API 응답 전체:', response);
      console.log('게시물 상세 API 응답 데이터:', response.data);
      console.log('게시물 상세 API 응답 데이터 타입:', typeof response.data);
      console.log('게시물 상세 API 응답 데이터 키:', Object.keys(response.data));
      return response.data;
    } catch (error) {
      console.error('게시물을 가져오는 중 오류 발생:', error);
      
      if (USE_DUMMY_DATA) {
        console.log('오류 발생: 더미 게시물 상세 데이터로 대체');
        // 테스트용으로 첫 번째 게시물 반환
        return DUMMY_DATA.posts[0];
      }
      
      return null;
    }
  },
  
  // 게시물 수정
  updatePost: async (postId, postData) => {
    try {
      // Swagger 문서에 표시된 게시물 수정 엔드포인트 사용
      const response = await api.patch(`/api/posts/${postId}/`, postData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '게시물 수정 중 오류가 발생했습니다.');
    }
  },
  
  // 게시물 삭제
  deletePost: async (postId) => {
    try {
      // Swagger 문서에 표시된 게시물 삭제 엔드포인트 사용
      await api.delete(`/api/posts/${postId}/`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '게시물 삭제 중 오류가 발생했습니다.');
    }
  },
  
  // 게시물 북마크/북마크 해제
  toggleBookmark: async (postId) => {
    try {
      // Swagger 문서에 표시된 북마크 토글 엔드포인트 사용
      const response = await api.post(`/api/posts/${postId}/bookmark/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '북마크 처리 중 오류가 발생했습니다.');
    }
  },
  
  // 태그 목록 가져오기
  getTags: async (language = 'ko') => {
    try {
      // Swagger 문서에 표시된 태그 목록 조회 엔드포인트 사용
      const response = await api.get('/api/posts/tags/', { params: { language } });
      return response.data;
    } catch (error) {
      console.error('태그 목록을 가져오는 중 오류 발생:', error);
      return [];
    }
  },
  
  // 현재 사용자의 게시물 가져오기
  getUserPosts: async (page = 1) => {
    // 개발 모드에서 더미 데이터 사용
    if (USE_DUMMY_DATA) {
      console.log('개발 모드: 더미 사용자 게시물 데이터 사용');
      
      // 현재 로그인한 사용자의 게시물만 필터링 (테스트용으로 첫 번째 사용자 사용)
      const currentUserId = DUMMY_DATA.users[0].id;
      const userPosts = DUMMY_DATA.posts.filter(post => post.user.id === currentUserId);
      
      // 페이지네이션 처리
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPosts = userPosts.slice(startIndex, endIndex);
      
      return {
        results: paginatedPosts,
        count: userPosts.length,
        next: endIndex < userPosts.length ? `/api/posts/user/posts/?page=${page + 1}` : null,
        previous: page > 1 ? `/api/posts/user/posts/?page=${page - 1}` : null
      };
    }
    
    try {
      // Swagger 문서에 표시된 사용자 게시물 조회 엔드포인트 사용
      const response = await api.get('/api/posts/user/posts/', { params: { page } });
      console.log('사용자 게시물 응답:', response.data);
      
      // 백엔드 응답 형식에 따라 데이터 처리
      if (response.data && Array.isArray(response.data)) {
        return { 
          results: response.data,
          count: response.data.length,
          next: null,
          previous: null
        };
      } else if (response.data && response.data.results) {
        return response.data;
      } else {
        console.warn('예상치 못한 응답 형식:', response.data);
        return { results: [], count: 0, next: null, previous: null };
      }
    } catch (error) {
      console.error('사용자 게시물을 가져오는 중 오류 발생:', error);
      
      if (USE_DUMMY_DATA) {
        console.log('오류 발생: 더미 사용자 게시물 데이터로 대체');
        const currentUserId = DUMMY_DATA.users[0].id;
        const userPosts = DUMMY_DATA.posts.filter(post => post.user.id === currentUserId);
        
        return {
          results: userPosts,
          count: userPosts.length,
          next: null,
          previous: null
        };
      }
      
      return { results: [], count: 0, next: null, previous: null };
    }
  },
  
  // 현재 사용자의 북마크 목록 가져오기
  getUserBookmarks: async (page = 1) => {
    // 개발 모드에서 더미 데이터 사용
    if (USE_DUMMY_DATA) {
      console.log('개발 모드: 더미 북마크 데이터 사용');
      
      // 북마크된 게시물만 필터링
      const bookmarkedPosts = DUMMY_DATA.posts.filter(post => post.is_bookmarked);
      
      // 페이지네이션 처리
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPosts = bookmarkedPosts.slice(startIndex, endIndex);
      
      return {
        results: paginatedPosts,
        count: bookmarkedPosts.length,
        next: endIndex < bookmarkedPosts.length ? `/api/posts/user/bookmarks/?page=${page + 1}` : null,
        previous: page > 1 ? `/api/posts/user/bookmarks/?page=${page - 1}` : null
      };
    }
    
    try {
      // Swagger 문서에 표시된 사용자 북마크 조회 엔드포인트 사용
      const response = await api.get('/api/posts/user/bookmarks/', { params: { page } });
      console.log('사용자 북마크 응답:', response.data);
      
      // 백엔드 응답 형식에 따라 데이터 처리
      if (response.data && Array.isArray(response.data)) {
        return { 
          results: response.data,
          count: response.data.length,
          next: null,
          previous: null
        };
      } else if (response.data && response.data.results) {
        return response.data;
      } else {
        console.warn('예상치 못한 응답 형식:', response.data);
        return { results: [], count: 0, next: null, previous: null };
      }
    } catch (error) {
      console.error('사용자 북마크를 가져오는 중 오류 발생:', error);
      
      if (USE_DUMMY_DATA) {
        console.log('오류 발생: 더미 북마크 데이터로 대체');
        const bookmarkedPosts = DUMMY_DATA.posts.filter(post => post.is_bookmarked);
        
        return {
          results: bookmarkedPosts,
          count: bookmarkedPosts.length,
          next: null,
          previous: null
        };
      }
      
      return { results: [], count: 0, next: null, previous: null };
    }
  },
  
  // 게시물 검색
  searchPosts: async (params) => {
    // 개발 모드에서 더미 데이터 사용
    if (USE_DUMMY_DATA) {
      console.log('개발 모드: 더미 검색 데이터 사용');
      
      // 검색어로 필터링
      let filteredPosts = DUMMY_DATA.posts;
      
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredPosts = filteredPosts.filter(post => 
          post.title.toLowerCase().includes(searchTerm) || 
          post.content.toLowerCase().includes(searchTerm)
        );
      }
      
      if (params.tag) {
        filteredPosts = filteredPosts.filter(post => 
          post.tags.some(tag => tag.toLowerCase().includes(params.tag.toLowerCase()))
        );
      }
      
      if (params.author) {
        filteredPosts = filteredPosts.filter(post => 
          post.user.username.toLowerCase().includes(params.author.toLowerCase())
        );
      }
      
      // 페이지네이션 처리
      const page = params.page || 1;
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
      
      return {
        results: paginatedPosts,
        count: filteredPosts.length,
        next: endIndex < filteredPosts.length ? `/api/posts/?page=${page + 1}` : null,
        previous: page > 1 ? `/api/posts/?page=${page - 1}` : null
      };
    }
    
    try {
      // Swagger 문서에 표시된 게시물 검색 엔드포인트 사용
      const response = await api.get('/api/posts/', { params });
      console.log('게시물 검색 응답:', response.data);
      
      // 백엔드 응답 형식에 따라 데이터 처리
      if (response.data && Array.isArray(response.data)) {
        // 응답이 배열인 경우
        return { 
          results: response.data,
          count: response.data.length,
          next: null,
          previous: null
        };
      } else if (response.data && response.data.results) {
        // 응답이 페이지네이션 형식인 경우
        return response.data;
      } else {
        // 기타 형식의 응답
        console.warn('예상치 못한 응답 형식:', response.data);
        return { results: [], count: 0, next: null, previous: null };
      }
    } catch (error) {
      console.error('게시물 검색 중 오류 발생:', error);
      
      if (USE_DUMMY_DATA) {
        console.log('오류 발생: 더미 검색 데이터로 대체');
        return {
          results: DUMMY_DATA.posts,
          count: DUMMY_DATA.posts.length,
          next: null,
          previous: null
        };
      }
      
      return { results: [], count: 0, next: null, previous: null };
    }
  }
};

// 파일 업로드 서비스
const fileService = {
  // uploadFile 함수는 더 이상 사용하지 않음 - postService.createPost로 통합
  // 하지만 기존 코드와의 호환성을 위해 함수는 유지하고 경고 메시지 출력
  uploadFile: async (file) => {
    console.warn('uploadFile 함수는 더 이상 사용되지 않습니다. postService.createPost를 사용해주세요.');
    console.warn('파일 업로드는 /api/posts/ 엔드포인트를 통해 직접 처리됩니다.');
    
    try {
      console.log('파일 업로드 시작:', file.name, file.type, file.size);
      
      const formData = new FormData();
      
      // 파일 타입에 따라 적절한 필드 이름 사용
      if (file.type.startsWith('image/')) {
        formData.append('image', file);
        console.log('이미지 파일로 업로드합니다. 필드명: image');
      } else {
        formData.append('file', file);
        console.log('일반 파일로 업로드합니다. 필드명: file');
      }
      
      // 기본 필드 추가 (필요한 경우)
      formData.append('title', 'Temporary Title'); // 임시 제목
      formData.append('content', 'Temporary Content'); // 임시 내용
      
      // FormData 내용 로깅 (디버깅용)
      for (let [key, value] of formData.entries()) {
        console.log('FormData 항목:', key, value instanceof File ? `File: ${value.name}` : value);
      }
      
      // 파일 업로드 엔드포인트 변경: /api/files/upload/ -> /api/posts/
      const response = await api.post('/api/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('파일 업로드 응답:', response.data);
      
      // 응답 데이터 구조 변환 (기존 코드와의 호환성 유지)
      const result = {
        ...response.data,
        fileUrl: response.data.image_url || response.data.file_url || response.data.url || ''
      };
      
      return result;
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
      console.error('응답 데이터:', error.response?.data);
      console.error('응답 상태:', error.response?.status);
      
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '파일 업로드 중 오류가 발생했습니다.');
    }
  }
};

export { userService, postService, fileService }; 