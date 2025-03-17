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
const TEST_MODE = false; // 테스트 모드 활성화/비활성화

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
      
      // JWT 토큰 발급 요청
      const response = await api.post('/api/token/', { 
        username: email, // Django의 기본 JWT 인증은 username을 사용
        password 
      });
      
      console.log('로그인 응답:', response.data);
      
      // JWT 토큰 저장
      const { access, refresh } = response.data;
      if (access) {
        console.log('액세스 토큰 저장:', access);
        localStorage.setItem('auth_token', access);
        localStorage.setItem('refresh_token', refresh);
        
        // 토큰 디코딩 및 만료 시간 확인
        const decodedToken = decodeJWT(access);
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
      } else {
        console.warn('토큰이 응답에 포함되어 있지 않습니다:', response.data);
      }
      
      // 사용자 정보 조회
      const userResponse = await api.get('/api/users/me/');
      return userResponse.data;
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
      console.log('사용자 정보 조회 요청:', userId);
      
      // UUID 형식 검증 (선택적)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      console.log('UUID 형식 여부:', isUUID);
      
      // Swagger 문서에 표시된 사용자 정보 조회 엔드포인트 사용
      const response = await api.get(`/api/users/${userId}/`);
      console.log('사용자 정보 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      console.error('응답 데이터:', error.response?.data);
      console.error('응답 상태:', error.response?.status);
      
      // 테스트 모드에서는 오류 발생 시 더미 데이터 반환
      if (TEST_MODE) {
        console.warn('테스트 모드: 더미 사용자 데이터 반환');
        return {
          id: userId,
          username: '사용자',
          email: 'user@example.com',
          profile_image: null
        };
      }
      
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
  },

  // 관리자 요청 보내기
  sendAdminRequest: async (requestData) => {
    try {
      console.log('관리자 요청 데이터:', requestData);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.log('테스트 모드: 관리자 요청 처리');
        return {
          success: true,
          message: '관리자 요청이 전송되었습니다.'
        };
      }
      
      // 실제 API 호출 - 백엔드 엔드포인트 업데이트
      const response = await api.post('/api/users/admin-request/', requestData);
      console.log('관리자 요청 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('관리자 요청 전송 중 오류:', error);
      console.error('응답 데이터:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '관리자 요청 전송 중 오류가 발생했습니다.');
    }
  },

  // 권한 신청하기
  requestApproval: async (requestData) => {
    try {
      console.log('권한 신청 데이터:', requestData);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.log('테스트 모드: 권한 신청 처리');
        return {
          success: true,
          message: '권한 신청이 성공적으로 전송되었습니다.'
        };
      }
      
      // 실제 API 호출 - 백엔드 엔드포인트 업데이트
      const response = await api.post('/api/users/permission-request/', {
        ...requestData,
        requestType: 'permission_request'
      });
      
      console.log('권한 신청 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('권한 신청 중 오류:', error);
      console.error('응답 데이터:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '권한 신청 중 오류가 발생했습니다.');
    }
  },

  // 현재 사용자의 요청 목록 가져오기
  getUserRequests: async (params = {}) => {
    try {
      console.log('사용자 요청 목록 조회 요청:', params);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.log('테스트 모드: 더미 사용자 요청 목록 반환');
        
        // 더미 데이터 생성
        const dummyRequests = generateDummyRequests(5);
        
        return {
          results: dummyRequests,
          count: dummyRequests.length,
          next: null,
          previous: null
        };
      }
      
      // 실제 API 호출
      const response = await api.get('/api/users/my-requests/', { params });
      console.log('사용자 요청 목록 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('사용자 요청 목록 조회 중 오류:', error);
      console.error('응답 데이터:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '사용자 요청 목록 조회 중 오류가 발생했습니다.');
    }
  },

  // 관리자 요청 목록 가져오기 (관리자용)
  getAdminRequests: async (params = {}) => {
    try {
      console.log('관리자 요청 목록 조회 요청:', params);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.log('테스트 모드: 더미 관리자 요청 목록 반환');
        
        // 더미 데이터 생성
        const dummyRequests = generateDummyRequests(15);
        
        return {
          results: dummyRequests,
          count: dummyRequests.length,
          next: null,
          previous: null
        };
      }
      
      // 실제 API 호출 - 백엔드 엔드포인트 업데이트
      const response = await api.get('/api/users/admin/requests/', { params });
      console.log('관리자 요청 목록 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('관리자 요청 목록 조회 중 오류:', error);
      console.error('응답 데이터:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '관리자 요청 목록 조회 중 오류가 발생했습니다.');
    }
  },
  
  // 관리자 요청 상세 조회 (관리자용)
  getAdminRequestDetail: async (requestId) => {
    try {
      console.log('관리자 요청 상세 조회 요청:', requestId);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.log('테스트 모드: 더미 관리자 요청 상세 반환');
        
        // 더미 데이터 생성
        const dummyRequest = generateDummyRequests(1)[0];
        dummyRequest.id = requestId;
        
        return dummyRequest;
      }
      
      // 실제 API 호출
      const response = await api.get(`/api/users/admin/requests/${requestId}/`);
      console.log('관리자 요청 상세 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('관리자 요청 상세 조회 중 오류:', error);
      console.error('응답 데이터:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '관리자 요청 상세 조회 중 오류가 발생했습니다.');
    }
  },
  
  // 관리자 요청 처리 (승인/거부)
  processAdminRequest: async (requestId, action, adminNote = '') => {
    try {
      console.log(`관리자 요청 ${action} 처리:`, requestId);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.log(`테스트 모드: 관리자 요청 ${action} 처리`);
        return {
          success: true,
          message: `요청이 성공적으로 ${action === 'approve' ? '승인' : '거부'}되었습니다.`
        };
      }
      
      // 실제 API 호출 - 백엔드 엔드포인트 업데이트
      const response = await api.post(`/api/users/admin/requests/${requestId}/${action}/`, {
        admin_note: adminNote
      });
      
      console.log(`관리자 요청 ${action} 응답:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`관리자 요청 ${action} 처리 중 오류:`, error);
      console.error('응답 데이터:', error.response?.data);
      throw new Error(error.response?.data?.message || error.response?.data?.detail || `관리자 요청 ${action} 처리 중 오류가 발생했습니다.`);
    }
  },

  // 토큰 갱신
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('리프레시 토큰이 없습니다.');
      }

      const response = await api.post('/api/token/refresh/', {
        refresh: refreshToken
      });

      const { access } = response.data;
      if (access) {
        localStorage.setItem('auth_token', access);
        return access;
      } else {
        throw new Error('새로운 액세스 토큰을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('토큰 갱신 중 오류:', error);
      // 토큰 갱신 실패 시 로그아웃 처리
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  },

  // 토큰 검증
  verifyToken: async (token) => {
    try {
      await api.post('/api/token/verify/', {
        token: token
      });
      return true;
    } catch (error) {
      console.error('토큰 검증 중 오류:', error);
      return false;
    }
  },

  // 프로필 이미지 업로드
  updateProfileImage: async (formData, userId) => {
    try {
      if (!userId) {
        throw new Error('사용자 정보가 없습니다.');
      }
      
      // multipart/form-data를 사용할 때는 Content-Type을 명시적으로 설정하지 않음
      // Axios가 자동으로 boundary 값을 포함한 Content-Type을 설정하도록 함
      const config = {
        headers: {
          // 'Content-Type': 'multipart/form-data' 제거
        }
      };
      
      console.log('프로필 이미지 업로드 요청:', userId);
      console.log('FormData 내용:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: 파일명=${value.name}, 타입=${value.type}, 크기=${value.size}바이트`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      // 백엔드 API 명세에 맞게 프로필 이미지 업로드 엔드포인트 사용
      console.log('프로필 이미지 업로드 엔드포인트로 이미지 업로드 시도');
      const response = await api.post(`/api/users/${userId}/profile-image/`, formData, config);
      console.log('프로필 이미지 업로드 성공:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error);
      console.error('응답 상태:', error.response?.status);
      console.error('응답 데이터:', error.response?.data);
      
      // 테스트 모드에서는 더미 응답 반환
      if (TEST_MODE) {
        console.warn('테스트 모드: 더미 프로필 이미지 URL 반환');
        return {
          profile_image: `https://placehold.co/200x200/9370DB/FFFFFF?text=${userId.charAt(0) || 'U'}`
        };
      }
      
      throw new Error(error.response?.data?.message || error.response?.data?.detail || '프로필 이미지 업로드 중 오류가 발생했습니다.');
    }
  }
};

// 더미 요청 데이터 생성 함수 (개발용)
const generateDummyRequests = (count = 10) => {
  const statuses = ['pending', 'approved', 'rejected'];
  const types = ['general_request', 'permission_request', 'feature_request', 'bug_report'];
  const users = [
    { id: '1', username: 'user1', email: 'user1@example.com', profile_image: 'https://placehold.co/100x100/9370DB/FFFFFF?text=U1' },
    { id: '2', username: 'user2', email: 'user2@example.com', profile_image: 'https://placehold.co/100x100/4682B4/FFFFFF?text=U2' },
    { id: '3', username: 'user3', email: 'user3@example.com', profile_image: 'https://placehold.co/100x100/20B2AA/FFFFFF?text=U3' }
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `req-${i + 1}`,
    user: users[i % users.length],
    type: types[i % types.length],
    message: `이것은 테스트 요청 #${i + 1}입니다. 이 요청은 개발 중에 사용되는 더미 데이터입니다.`,
    status: statuses[i % statuses.length],
    created_at: new Date(Date.now() - i * 86400000).toISOString(), // i일 전
    updated_at: new Date(Date.now() - i * 43200000).toISOString(), // i/2일 전
    admin_note: i % 3 === 0 ? '이 요청은 관리자에 의해 처리되었습니다.' : null
  }));
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
  
  /**
   * 게시물 생성 함수
   * @param {Object|FormData} postData - 게시물 데이터 (일반 객체 또는 FormData)
   * @returns {Promise<Object>} - 생성된 게시물 데이터
   */
  createPost: async (postData) => {
    try {
      console.log('게시물 생성 요청 데이터:', postData);
      
      // FormData인 경우와 일반 객체인 경우를 구분하여 처리
      if (postData instanceof FormData) {
        console.log('FormData 형식으로 게시물 생성 요청');
        // FormData의 모든 항목 로깅
        console.log('FormData 항목 목록:');
        for (let [key, value] of postData.entries()) {
          if (value instanceof File) {
            console.log(`FormData 항목: ${key}`, {
              fileName: value.name,
              fileType: value.type,
              fileSize: value.size,
              lastModified: new Date(value.lastModified).toISOString()
            });
          } else {
            // 문자열 값의 경우 값의 타입과 길이도 함께 로깅
            console.log(`FormData 항목: ${key}`, value, `(타입: ${typeof value}, 길이: ${value.length})`);
          }
        }
        
        // FormData 전송 시 Content-Type 헤더를 설정하지 않음
        // axios가 자동으로 multipart/form-data와 boundary를 설정하도록 함
        const response = await api.post('/api/posts/', postData, {
          headers: {
            // Content-Type 헤더를 명시적으로 제거
            'Content-Type': undefined
          }
        });
        
        console.log('게시물 생성 성공:', response.status);
        console.log('게시물 생성 응답 데이터:', response.data);
        
        return response.data;
      } else {
        // 일반 객체인 경우
        console.log('JSON 형식으로 게시물 생성 요청:', postData);
        const response = await api.post('/api/posts/', postData);
        console.log('게시물 생성 응답:', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('게시물 생성 중 오류 발생:', error);
      
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('응답 헤더:', error.response.headers);
        console.error('응답 데이터:', error.response.data);
        
        // 오류 응답 데이터 상세 로깅
        if (error.response.data) {
          console.error('오류 상세 정보:');
          for (const [key, value] of Object.entries(error.response.data)) {
            console.error(`- ${key}:`, value);
          }
        }
      }
      
      throw error;
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
  // 이미지 파일 업로드 함수 (별도 엔드포인트 사용)
  uploadImage: async (imageFile) => {
    try {
      console.log('이미지 업로드 시작:', imageFile.name, imageFile.type, imageFile.size);
      
      // 이미지 파일 검증
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드할 수 있습니다.');
      }
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // 이미지 업로드 엔드포인트 호출
      // 백엔드에 별도의 이미지 업로드 엔드포인트가 있다고 가정
      // 없다면 백엔드 개발자와 협의하여 추가해야 함
      const response = await api.post('/api/images/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('이미지 업로드 응답:', response.data);
      
      // 응답에서 이미지 URL 추출
      if (response.data && response.data.image_url) {
        return response.data.image_url;
      } else {
        console.error('이미지 업로드 응답에 URL이 없습니다:', response.data);
        throw new Error('이미지 업로드 후 URL을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('이미지 업로드 중 오류 발생:', error);
      
      if (error.response) {
        console.error('응답 상태:', error.response.status);
        console.error('응답 데이터:', error.response.data);
      }
      
      throw new Error('이미지 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  },

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

// 모듈 내보내기
export {
  userService,
  postService,
  fileService
}; 